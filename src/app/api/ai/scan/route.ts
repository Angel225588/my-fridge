import { NextRequest, NextResponse } from 'next/server';
import { getVisionModel } from '@/lib/gemini/client';
import { createSupabaseServer } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

function getScanPrompt() {
  const today = new Date().toISOString().split('T')[0];

  return `Tu es un assistant de cuisine intelligent. La date d'aujourd'hui est : ${today}

Analyse cette image et détermine s'il s'agit :
1. D'un TICKET DE CAISSE / reçu → extrais TOUS les produits alimentaires
2. D'un PRODUIT UNIQUE → identifie le produit

INSTRUCTIONS CRITIQUES POUR LES DATES D'EXPIRATION :
- Cherche ATTENTIVEMENT toute date imprimée sur le produit : "À consommer avant le", "DDM", "DLC", "BB", "Best Before", "Exp", "Use by", etc.
- La date imprimée sur le produit est LA VÉRITÉ. Utilise-la EXACTEMENT.
- Formats courants : JJ/MM/AAAA, JJ.MM.AAAA, MM/AAAA, JJ/MM/AA. En Europe, le jour vient TOUJOURS avant le mois.
- Convertis la date lue en format YYYY-MM-DD.
- Si la date est DANS LE PASSÉ, c'est normal - le produit est expiré. Retourne quand même la vraie date.
- N'invente JAMAIS de date. Si tu ne vois pas de date, mets null.
- NE JAMAIS estimer ou deviner une date d'expiration. UNIQUEMENT les dates réellement LUES sur le produit/emballage.
- Si tu ne vois PAS de date → expiration_date = null. Ne mets PAS estimated_expiry_days.

INSTRUCTIONS POUR LE LIEU DE STOCKAGE (location) :
- Analyse le TYPE de produit pour déterminer où il va :
  - "fridge" : produits frais, laitiers, viande, charcuterie, fromage, yaourt, crème, jus frais, plats préparés frais
  - "freezer" : surgelés, glaces, viande congelée, légumes surgelés
  - "pantry" : conserves, céréales, pâtes, riz, épices, sauces, huiles, snacks, biscuits, chips, chocolat, café, thé, boissons non-fraiches (sodas, eau), farines, sucre, sel, miel, confiture
- NE PAS mettre tous les produits dans "fridge" par défaut. Réfléchis au type de produit.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :

Pour un TICKET DE CAISSE :
{
  "type": "receipt",
  "store_name": "nom du magasin si visible",
  "items": [
    {
      "name": "nom du produit en français, clair et court",
      "quantity": 1,
      "unit": "pcs",
      "category": "dairy|meat|produce|beverages|grains|frozen|condiments|snacks|other",
      "location": "fridge|freezer|pantry",
      "expiration_date": null,
      "price": 0.00
    }
  ]
}

Pour un PRODUIT UNIQUE :
{
  "type": "product",
  "items": [
    {
      "name": "nom du produit en français",
      "quantity": 1,
      "unit": "pcs|kg|g|liters|ml|bottles|cans|boxes|bags",
      "category": "dairy|meat|produce|beverages|grains|frozen|condiments|snacks|other",
      "location": "fridge|freezer|pantry",
      "expiration_date": "YYYY-MM-DD - la date EXACTE lue sur le produit, ou null",
      "price": null,
      "brand": "marque si visible"
    }
  ]
}

Règles :
- Noms en français, courts et clairs
- Catégorise correctement : dairy=laitier, meat=viande/poisson, produce=fruits/légumes, beverages=boissons, grains=céréales/pain, frozen=surgelés, condiments=sauces/épices, snacks=gâteaux/chips
- Location : RÉFLÉCHIS au type de produit. Les conserves, pâtes, riz, snacks, épices → pantry. Les surgelés → freezer. Les produits frais → fridge.
- "price" : le prix unitaire en euros si visible sur le ticket, sinon null
- Si pas de date d'expiration visible, mets expiration_date=null. Ne devine JAMAIS.
- Pour les tickets, ignore les articles non-alimentaires (sacs, produits ménagers, etc.)
- Réponds UNIQUEMENT avec le JSON, PAS de backticks, PAS de markdown
`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou HEIC.' }, { status: 400 });
    }

    const model = getVisionModel();
    if (!model) {
      return NextResponse.json({ error: 'IA non disponible' }, { status: 503 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const result = await model.generateContent([
      getScanPrompt(),
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('AI scan response (no JSON found):', responseText);
      return NextResponse.json({ error: 'Impossible d\'analyser l\'image' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 });
  }
}
