import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for browser/client-side usage
 * Uses the anon key - respects Row Level Security
 */
export function createSupabaseBrowser() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Create a Supabase client for server-side usage (API routes, server actions)
 * Can optionally use service role key for admin operations
 */
export function createServerSupabase(useServiceRole = false): SupabaseClient<Database> {
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : supabaseAnonKey;

  return createClient<Database>(supabaseUrl, key);
}
