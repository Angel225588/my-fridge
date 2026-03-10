import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase client for browser/client-side usage
 * Uses the anon key - respects Row Level Security
 * Env vars are read lazily to avoid build-time errors during static generation
 */
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. ' +
      'Set them in your environment variables.'
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}

/**
 * Create a Supabase client for server-side usage (API routes, server actions)
 * Can optionally use service role key for admin operations
 */
export function createServerSupabase(useServiceRole = false): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(url, key);
}
