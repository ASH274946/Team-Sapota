/**
 * supabase/server.ts
 * Server-side Supabase client for use in Server Components, Route Handlers,
 * Server Actions, and Middleware.
 *
 * USAGE in Server Component:
 *   import { createClient } from '@/lib/supabase/server';
 *   const supabase = await createClient();
 *   const { data } = await supabase.storage.from('uploads').list();
 *
 * NOTE: This client uses the anon key with cookie-based auth context.
 * For admin/service-role operations, use admin.ts instead.
 *
 * INSTALL: npm install @supabase/supabase-js @supabase/ssr --workspace=apps/frontend
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method is called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
