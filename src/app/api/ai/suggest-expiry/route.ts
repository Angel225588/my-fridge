import { NextRequest, NextResponse } from 'next/server';
import { getTextModel } from '@/lib/gemini/client';
import { EXPIRATION_SUGGESTION_PROMPT } from '@/lib/gemini/prompts';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { product_name, category } = await request.json();

    if (!product_name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const model = getTextModel();
    if (!model) {
      return NextResponse.json(
        { error: 'AI is not available' },
        { status: 503 }
      );
    }

    const prompt = EXPIRATION_SUGGESTION_PROMPT
      .replace('{{product_name}}', product_name)
      .replace('{{category}}', category || 'other');

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to get suggestion' },
        { status: 500 }
      );
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Expiry suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest expiration' },
      { status: 500 }
    );
  }
}
