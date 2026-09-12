'use client';
/**
 * supabase/client.ts
 * Browser-side Supabase client for use in Client Components ().
 *
 * USAGE:
 *   import { createClient } from '@/lib/supabase/client';
 *   const supabase = createClient();
 *   const { data } = await supabase.storage.from('uploads').list();
 *
 * NOTE: This client uses the anon key. For admin operations (bypassing RLS),
 * use the server-side admin client instead.
 *
 * INSTALL: npm install @supabase/supabase-js @supabase/ssr --workspace=apps/frontend
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
