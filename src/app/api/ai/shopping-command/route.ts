import { NextRequest, NextResponse } from 'next/server';
import { getTextModel } from '@/lib/gemini/client';
import { createSupabaseServer } from '@/lib/supabase/server';

const SHOPPING_COMMAND_PROMPT = `Tu es un assistant de liste de courses. Analyse la commande en langage naturel (en français) et extrais les articles à ajouter à la liste de courses.

Retourne un objet JSON avec cette structure :
{
  "items": [
    {
      "name": "nom du produit en français, clair et court",
      "quantity": nombre,
      "unit": "pcs|kg|g|liters|ml|bottles|cans|boxes|bags",
      "category": "dairy|meat|produce|beverages|grains|frozen|condiments|snacks|other"
    }
  ],
  "message": "message de confirmation en français, court et sympa"
}

Exemples :
- "Il me faut du lait et des oeufs" → 2 items: Lait (1 liters, dairy), Oeufs (6 pcs, other)
- "Achète 3 bouteilles d'eau" → 1 item: Eau (3 bottles, beverages)
- "J'ai besoin de pâtes, riz et huile d'olive" → 3 items
- "Rachète du poulet 500g" → 1 item: Poulet (500 g, meat)

Règles :
- Noms en français, courts et clairs
- Si quantité non spécifiée, mettre 1
- Si unité non spécifiée, mettre "pcs"
- Catégorise correctement chaque article
- Retourne UNIQUEMENT le JSON, sans markdown, sans backticks

La date d'aujourd'hui est : ${new Date().toISOString().split('T')[0]}
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { command, fridge_id, profile_id } = await request.json();

    if (!command || !fridge_id || !profile_id) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Validate profile belongs to user
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil non autorisé' }, { status: 403 });
    }

    const model = getTextModel();
    if (!model) {
      return NextResponse.json({ error: 'IA non disponible' }, { status: 503 });
    }

    const result = await model.generateContent([SHOPPING_COMMAND_PROMPT, command]);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({
        message: "Je n'ai pas compris. Essayez : \"Il me faut du lait et des oeufs\"",
        items: [],
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const items = parsed.items || [];

    // Add each item to shopping list
    for (const item of items) {
      await supabase.from('shopping_list').insert({
        fridge_id,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        category: item.category || 'other',
        added_by: profile_id,
      });
    }

    return NextResponse.json({
      message: parsed.message || `${items.length} article(s) ajouté(s) à la liste`,
      items,
    });
  } catch (error) {
    console.error('Shopping command error:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement' }, { status: 500 });
  }
}
