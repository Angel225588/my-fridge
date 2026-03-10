import { NextRequest, NextResponse } from 'next/server';
import { getTextModel } from '@/lib/gemini/client';
import { COMMAND_PARSING_PROMPT } from '@/lib/gemini/prompts';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { AICommandResult } from '@/types';

// Map French categories from AI to DB enum values
const categoryMap: Record<string, string> = {
  'produits laitiers': 'dairy',
  'laitier': 'dairy',
  'lait': 'dairy',
  'viande': 'meat',
  'volaille': 'meat',
  'poisson': 'meat',
  'fruits': 'produce',
  'légumes': 'produce',
  'fruits et légumes': 'produce',
  'boissons': 'beverages',
  'boisson': 'beverages',
  'céréales': 'grains',
  'pain': 'grains',
  'surgelés': 'frozen',
  'surgelé': 'frozen',
  'condiments': 'condiments',
  'sauce': 'condiments',
  'épices': 'condiments',
  'snacks': 'snacks',
  'snack': 'snacks',
  'autre': 'other',
};

function normalizeCategory(cat: string): string {
  if (!cat) return 'other';
  const lower = cat.toLowerCase().trim();
  // Already a valid enum value
  if (['dairy', 'meat', 'produce', 'beverages', 'grains', 'frozen', 'condiments', 'snacks', 'other'].includes(lower)) {
    return lower;
  }
  return categoryMap[lower] || 'other';
}

// Map French units to DB values
function normalizeUnit(unit: string): string {
  if (!unit) return 'pcs';
  const lower = unit.toLowerCase().trim();
  const unitMap: Record<string, string> = {
    'litre': 'liters', 'litres': 'liters', 'l': 'liters',
    'millilitre': 'ml', 'millilitres': 'ml',
    'kilogramme': 'kg', 'kilogrammes': 'kg', 'kilo': 'kg', 'kilos': 'kg',
    'gramme': 'g', 'grammes': 'g',
    'pièce': 'pcs', 'pièces': 'pcs', 'unité': 'pcs', 'unités': 'pcs',
    'bouteille': 'bottles', 'bouteilles': 'bottles',
    'boîte': 'boxes', 'boîtes': 'boxes',
    'conserve': 'cans', 'conserves': 'cans',
    'sac': 'bags', 'sacs': 'bags',
  };
  return unitMap[lower] || lower;
}

// Escape LIKE/ILIKE wildcards in user/AI input
function escapeLikePattern(str: string): string {
  return str.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// Map French locations
function normalizeLocation(loc: string): string {
  if (!loc) return 'fridge';
  const lower = loc.toLowerCase().trim();
  const locMap: Record<string, string> = {
    'frigo': 'fridge', 'réfrigérateur': 'fridge', 'frigidaire': 'fridge',
    'congélateur': 'freezer', 'congel': 'freezer',
    'placard': 'pantry', 'garde-manger': 'pantry', 'armoire': 'pantry',
  };
  if (['fridge', 'freezer', 'pantry'].includes(lower)) return lower;
  return locMap[lower] || 'fridge';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { command, fridge_id, profile_id } = await request.json();

    if (!command || !fridge_id || !profile_id) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Validate profile_id belongs to the authenticated user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non autorisé' },
        { status: 403 }
      );
    }

    const model = getTextModel();
    if (!model) {
      return NextResponse.json(
        { error: 'IA non disponible. Ajoutez une clé API Gemini.' },
        { status: 503 }
      );
    }

    const result = await model.generateContent([COMMAND_PARSING_PROMPT, command]);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Impossible de comprendre la commande' },
        { status: 500 }
      );
    }

    const parsed: AICommandResult = JSON.parse(jsonMatch[0]);

    if (parsed.type === 'unknown' || parsed.confidence < 0.5) {
      return NextResponse.json({
        message: "Je n'ai pas compris. Essayez : \"Ajoute du lait\" ou \"Le poulet expire le 20 mars\"",
        action: null,
      });
    }

    switch (parsed.type) {
      case 'add_product': {
        const data = parsed.data as Record<string, unknown>;
        const { error } = await supabase.from('products').insert({
          fridge_id,
          added_by: profile_id,
          name: (data.name as string) || 'Article inconnu',
          quantity: (data.quantity as number) || 1,
          unit: normalizeUnit((data.unit as string) || 'pcs'),
          category: normalizeCategory((data.category as string) || 'other'),
          expiration_date: (data.expiration_date as string) || null,
          location: normalizeLocation((data.location as string) || 'fridge'),
          purchase_date: new Date().toISOString().split('T')[0],
        });

        if (error) {
          console.error('DB insert error:', error);
          throw error;
        }
        break;
      }

      case 'update_expiration': {
        const data = parsed.data as Record<string, unknown>;
        const productName = data.product_name as string;

        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .eq('fridge_id', fridge_id)
          .ilike('name', `%${escapeLikePattern(productName)}%`)
          .limit(1);

        if (products && products.length > 0) {
          await supabase
            .from('products')
            .update({ expiration_date: data.expiration_date as string })
            .eq('id', products[0].id);
        }
        break;
      }

      case 'update_quantity': {
        const data = parsed.data as Record<string, unknown>;
        const productName = data.product_name as string;

        const { data: products } = await supabase
          .from('products')
          .select('id, quantity')
          .eq('fridge_id', fridge_id)
          .ilike('name', `%${escapeLikePattern(productName)}%`)
          .limit(1);

        if (products && products.length > 0) {
          let newQuantity = data.quantity as number;
          if (data.action === 'add') newQuantity = products[0].quantity + newQuantity;
          if (data.action === 'subtract') newQuantity = Math.max(0, products[0].quantity - newQuantity);

          await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', products[0].id);
        }
        break;
      }

      case 'remove_product': {
        const data = parsed.data as Record<string, unknown>;
        const productName = data.product_name as string;

        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('fridge_id', fridge_id)
          .ilike('name', `%${escapeLikePattern(productName)}%`)
          .limit(1);

        if (products && products.length > 0) {
          await supabase
            .from('products')
            .delete()
            .eq('id', products[0].id);
        }
        break;
      }

      case 'query_expiring': {
        const data = parsed.data as Record<string, unknown>;
        const days = (data.days as number) || 7;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const { data: products } = await supabase
          .from('products')
          .select('name, expiration_date')
          .eq('fridge_id', fridge_id)
          .not('expiration_date', 'is', null)
          .lte('expiration_date', futureDate.toISOString().split('T')[0])
          .order('expiration_date', { ascending: true });

        if (products && products.length > 0) {
          const items = products.map((p) => `${p.name} (${p.expiration_date})`).join(', ');
          return NextResponse.json({
            message: `Articles expirant dans ${days} jours : ${items}`,
            action: 'query',
            data: products,
          });
        }

        return NextResponse.json({
          message: `Aucun article n'expire dans les ${days} prochains jours.`,
          action: 'query',
          data: [],
        });
      }
    }

    return NextResponse.json({
      message: parsed.message,
      action: parsed.type,
    });
  } catch (error) {
    console.error('AI command error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la commande' },
      { status: 500 }
    );
  }
}
