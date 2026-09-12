import { createClient } from '@supabase/supabase-js';
import type { StorageAdapter } from './storage-adapter';
import { env } from '../../config/env';

export class SupabaseStorageAdapter implements StorageAdapter {
  private supabase;
  private bucket: string;

  constructor() {
    const url = env.SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
    this.bucket = env.SUPABASE_BUCKET || process.env.SUPABASE_BUCKET || 'uploads';
  }

  async save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, data, { contentType, upsert: true });

    if (error) {
      throw new Error(`Supabase Upload failed: ${error.message}`);
    }

    return this.getPublicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .download(key);

      if (error || !data) {
        return null;
      }
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase Delete failed: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(undefined, { search: key });

      if (error || !data) {
        return false;
      }
      return data.some(file => file.name === key);
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(key);

    return data.publicUrl;
  }
}
