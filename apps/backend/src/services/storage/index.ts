import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';
import { LocalStorageAdapter } from './local-storage';
import { S3StorageAdapter } from './s3-storage';
import { SupabaseStorageAdapter } from './supabase-storage';
import { getR2Storage } from './r2-storage';

let adapter: StorageAdapter | null = null;

export function getStorageAdapter(subDir = ''): StorageAdapter {
  if (adapter) return adapter;

  switch (env.STORAGE_TYPE) {
    case 'r2':
      adapter = getR2Storage();
      break;
    case 'supabase':
      adapter = new SupabaseStorageAdapter();
      break;
    case 's3':
      adapter = new S3StorageAdapter();
      break;
    case 'local':
    default:
      // If R2 credentials are configured in env, prioritize R2
      if (process.env.R2_ACCOUNT_ID || env.R2_ACCOUNT_ID) {
        adapter = getR2Storage();
      } else {
        adapter = new LocalStorageAdapter(subDir);
      }
      break;
  }

  return adapter;
}

export function getPdfStorage(): StorageAdapter {
  return getStorageAdapter('pdfs');
}

export { StorageAdapter } from './storage-adapter';
export { R2StorageAdapter, getR2Storage } from './r2-storage';
export { generateR2ObjectKey, parseR2ObjectKey, sanitizeFilename } from './key-generator';
export type { StorageScope, KeyGenerationOptions } from './key-generator';
export { StorageRbacService } from './storage-rbac.service';
export type { StorageAction, StorageUserContext, StoredFileRecord } from './storage-rbac.service';
