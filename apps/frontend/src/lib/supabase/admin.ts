/**
 * supabase/admin.ts
 * Admin Supabase client using the SERVICE ROLE KEY.
 *
 * ⚠️  SECURITY WARNING: Never import this in Client Components or expose to the browser.
 *     This client BYPASSES all Row Level Security (RLS) policies.
 *     Use ONLY in:
 *       - Server Actions
 *       - Route Handlers (API routes)
 *       - Server Components that require admin access
 *
 * USAGE:
 *   import { createAdminClient } from '@/lib/supabase/admin';
 *   const supabase = createAdminClient();
 *   // Example: upload a file on behalf of a user
 *   await supabase.storage.from('uploads').upload(path, file);
 *
 * INSTALL: npm install @supabase/supabase-js --workspace=apps/frontend
 */

import { createClient } from '@supabase/supabase-js';

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  // Singleton pattern — reuse across requests in the same server instance
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}

/**
 * Supabase Storage helpers using the admin client.
 * These bypass RLS and should only be called server-side.
 */
export const storage = {
  /**
   * Upload a file to a Supabase Storage bucket.
   * @param bucket - The bucket name (e.g., 'uploads', 'papers', 'submissions')
   * @param path   - The file path within the bucket (e.g., 'org-id/user-id/filename.pdf')
   * @param file   - The file content (Buffer, Blob, ArrayBuffer, ReadableStream, or string)
   * @param contentType - MIME type of the file
   */
  async upload(
    bucket: string,
    path: string,
    file: Buffer | Blob | ArrayBuffer | ReadableStream | string,
    contentType: string
  ): Promise<{ url: string; path: string }> {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  },

  /**
   * Delete a file from a Supabase Storage bucket.
   */
  async remove(bucket: string, paths: string[]): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  },

  /**
   * Get a signed URL for private file access (time-limited).
   */
  async getSignedUrl(bucket: string, path: string, expiresInSeconds = 3600): Promise<string> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Failed to create signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  },
};
