import path from 'path';
import fs from 'fs/promises';
import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(subDir = '') {
    this.baseDir = path.resolve(env.UPLOAD_DIR, subDir);
  }

  private fullPath(key: string): string {
    const safe = path.basename(key);
    return path.join(this.baseDir, safe);
  }

  async save(key: string, data: Buffer | Uint8Array, _contentType: string): Promise<string> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const fp = this.fullPath(key);
    await fs.writeFile(fp, data);
    return this.getPublicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(this.fullPath(key));
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.fullPath(key));
    } catch {
      // noop
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.fullPath(key));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `/api/papers/download/${path.basename(key)}`;
  }
}
