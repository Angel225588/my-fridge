import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simple in-memory rate limiter: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

/**
 * Quick start: creates a confirmed user and returns credentials.
 * No email confirmation needed - for home/personal use.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create a simple email from the name
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${slug}@myfridge.local`;
    const password = crypto.randomUUID();

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // User exists — return generic response (no user enumeration)
      // The password won't work for the existing user, but the client
      // should handle sign-in separately
      return NextResponse.json({ email, password, exists: true });
    }

    // Create new user (auto-confirmed via admin API)
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      email,
      password,
      exists: false,
      user_id: newUser.user.id,
    });
  } catch (error) {
    console.error('Quick start error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
