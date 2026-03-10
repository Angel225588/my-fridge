import { NextRequest, NextResponse } from 'next/server';
import { getVisionModel } from '@/lib/gemini/client';
import { RECEIPT_PARSING_PROMPT } from '@/lib/gemini/prompts';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { ParsedReceipt } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

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
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou HEIC.' },
        { status: 400 }
      );
    }

    const model = getVisionModel();
    if (!model) {
      return NextResponse.json(
        { error: 'AI is not available. Please add a Gemini API key.' },
        { status: 503 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const result = await model.generateContent([
      RECEIPT_PARSING_PROMPT,
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
      return NextResponse.json(
        { error: 'Failed to parse receipt. Please try again with a clearer photo.' },
        { status: 500 }
      );
    }

    const parsed: ParsedReceipt = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ receipt: parsed });
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse receipt' },
      { status: 500 }
    );
  }
}
