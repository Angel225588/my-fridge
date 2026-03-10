import { NextRequest, NextResponse } from 'next/server';
import { getTextModel, getVisionModel } from '@/lib/gemini/client';
import { createSupabaseServer } from '@/lib/supabase/server';

interface ProductForReview {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  unit: string;
  expiration_date: string | null;
  image_url: string | null;
}

interface ImageIssue {
  id: string;
  name: string;
  issue: 'receipt_as_image' | 'wrong_product' | 'unrelated';
  suggestion: string;
}

interface Correction {
  id: string;
  name: string;
  changes: {
    field: string;
    from: string;
    to: string;
    reason: string;
  }[];
}

interface DuplicateGroup {
  product_ids: string[];
  names: string[];
  suggestion: 'merge' | 'keep_separate';
  reason: string;
}

function getVerifyPrompt(products: ProductForReview[]) {
  const today = new Date().toISOString().split('T')[0];

  const productList = products.map((p) =>
    `- ID: ${p.id} | "${p.name}" | catégorie: ${p.category} | lieu: ${p.location} | qté: ${p.quantity} ${p.unit} | exp: ${p.expiration_date || 'aucune'}`
  ).join('\n');

  return `Tu es un assistant de cuisine intelligent. Date d'aujourd'hui : ${today}

Voici l'inventaire actuel d'un frigo. Analyse CHAQUE produit et identifie les problèmes :

${productList}

TÂCHES :

1. CORRECTIONS DE LIEU (location) :
Vérifie que chaque produit est au bon endroit :
- "fridge" : produits frais, laitiers, viande, charcuterie, fromage, yaourt, crème, jus frais
- "freezer" : surgelés, glaces, viande congelée
- "pantry" : conserves, céréales, pâtes, riz, épices, sauces, huiles, snacks, biscuits, chips, chocolat, café, thé, sodas, eau, farines, sucre, sel, miel, confiture

2. CORRECTIONS DE CATÉGORIE (category) :
Vérifie que chaque produit a la bonne catégorie :
- dairy=laitier, meat=viande/poisson, produce=fruits/légumes, beverages=boissons, grains=céréales/pain/pâtes, frozen=surgelés, condiments=sauces/épices, snacks=gâteaux/chips/chocolat, other=autre

3. DOUBLONS :
Identifie les produits qui semblent être le même article (noms similaires, variantes, etc.)
Suggère si on devrait les fusionner ou les garder séparés.

Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :
{
  "corrections": [
    {
      "id": "uuid du produit",
      "name": "nom du produit",
      "changes": [
        {
          "field": "location|category",
          "from": "valeur actuelle",
          "to": "valeur corrigée",
          "reason": "explication courte en français"
        }
      ]
    }
  ],
  "duplicates": [
    {
      "product_ids": ["uuid1", "uuid2"],
      "names": ["nom1", "nom2"],
      "suggestion": "merge|keep_separate",
      "reason": "explication courte en français"
    }
  ]
}

Si aucune correction n'est nécessaire, retourne {"corrections": [], "duplicates": []}.
Ne corrige QUE ce qui est clairement faux. En cas de doute, ne corrige pas.
`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { fridge_id } = await request.json();

    if (!fridge_id) {
      return NextResponse.json({ error: 'fridge_id requis' }, { status: 400 });
    }

    const model = getTextModel();
    if (!model) {
      return NextResponse.json({ error: 'IA non disponible' }, { status: 503 });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, category, location, quantity, unit, expiration_date, image_url')
      .eq('fridge_id', fridge_id);

    if (error) {
      return NextResponse.json({ error: 'Erreur de lecture' }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ corrections: [], duplicates: [] });
    }

    const result = await model.generateContent(getVerifyPrompt(products as ProductForReview[]));
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('AI verify response (no JSON):', responseText);
      return NextResponse.json({ error: 'Impossible d\'analyser' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { corrections: Correction[]; duplicates: DuplicateGroup[] };

    // Second pass: check product images using vision model
    const productsWithImages = (products as ProductForReview[]).filter((p) => p.image_url);
    let imageIssues: ImageIssue[] = [];

    if (productsWithImages.length > 0) {
      const visionModel = getVisionModel();
      if (visionModel) {
        // Process in batches of 5
        const batches: ProductForReview[][] = [];
        for (let i = 0; i < productsWithImages.length; i += 5) {
          batches.push(productsWithImages.slice(i, i + 5));
        }

        for (const batch of batches) {
          try {
            const imageParts = await Promise.all(
              batch.map(async (p) => {
                try {
                  const response = await fetch(p.image_url!);
                  const arrayBuffer = await response.arrayBuffer();
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  const mimeType = response.headers.get('content-type') || 'image/jpeg';
                  return {
                    product: p,
                    inlineData: { data: base64, mimeType },
                  };
                } catch {
                  return null;
                }
              })
            );

            const validParts = imageParts.filter((p): p is NonNullable<typeof p> => p !== null);
            if (validParts.length === 0) continue;

            const imagePromptParts: (string | { inlineData: { data: string; mimeType: string } })[] = [];
            imagePromptParts.push(
              `Tu es un assistant qui vérifie si les images de produits alimentaires correspondent bien aux produits.

Pour chaque image ci-dessous, vérifie :
1. Si l'image est un ticket de caisse / reçu → problème "receipt_as_image"
2. Si l'image montre un produit différent du nom indiqué → problème "wrong_product"
3. Si l'image n'a aucun rapport avec un produit alimentaire → problème "unrelated"

Voici les produits à vérifier :`
            );

            for (const part of validParts) {
              imagePromptParts.push(`\n--- Produit ID: ${part.product.id} | Nom: "${part.product.name}" ---`);
              imagePromptParts.push({ inlineData: part.inlineData });
            }

            imagePromptParts.push(`
Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks :
{
  "image_issues": [
    {
      "id": "uuid du produit",
      "name": "nom du produit",
      "issue": "receipt_as_image|wrong_product|unrelated",
      "suggestion": "explication courte en français"
    }
  ]
}

Si aucune image n'a de problème, retourne {"image_issues": []}.
Ne signale QUE les vrais problèmes. Si l'image semble correcte, ne la signale pas.`);

            const visionResult = await visionModel.generateContent(imagePromptParts);
            const visionText = visionResult.response.text();
            const visionJsonMatch = visionText.match(/\{[\s\S]*\}/);

            if (visionJsonMatch) {
              const visionParsed = JSON.parse(visionJsonMatch[0]) as { image_issues: ImageIssue[] };
              imageIssues = [...imageIssues, ...(visionParsed.image_issues || [])];
            }
          } catch (err) {
            console.error('Vision batch error:', err);
          }
        }
      }
    }

    return NextResponse.json({
      ...parsed,
      image_issues: imageIssues,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}
