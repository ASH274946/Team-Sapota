import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import type { StorageAdapter } from './storage-adapter';

export class R2StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private publicDomain?: string;

  constructor() {
    const accountId = env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY || '';
    this.bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || env.S3_BUCKET || 'vidyaai-uploads';
    this.publicDomain = env.R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;

    // Cloudflare R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : process.env.R2_ENDPOINT_URL || undefined;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Return public URL or direct download path if custom public domain is explicitly configured
   */
  getPublicUrl(key: string): string {
    if (this.publicDomain) {
      const cleanDomain = this.publicDomain.replace(/\/+$/, '');
      return `${cleanDomain}/${key}`;
    }
    return `/api/v1/storage/by-key?key=${encodeURIComponent(key)}`;
  }

  /**
   * Save a buffer directly to R2 and return the presigned download URL
   */
  async save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: data,
      ContentType: contentType,
    }));
    return this.getSignedDownloadUrl(cleanKey);
  }

  /**
   * Fetch object buffer directly from R2, checking standard folder prefixes if unprefixed
   */
  async get(key: string): Promise<Buffer | null> {
    const cleanKey = key.replace(/^\/+/, '');
    const candidateKeys = [cleanKey];
    
    if (!cleanKey.includes('/')) {
      candidateKeys.push(
        `question-papers/${cleanKey}`,
        `assignments/${cleanKey}`,
        `quizzes/${cleanKey}`,
        `uploads/${cleanKey}`,
        `uploads/pdfs/${cleanKey}`,
        `lesson-plans/${cleanKey}`
      );
    }

    for (const candidate of candidateKeys) {
      try {
        const response = await this.client.send(new GetObjectCommand({
          Bucket: this.bucket,
          Key: candidate,
        }));
        if (!response.Body) continue;

        const chunks: Uint8Array[] = [];
        const stream = response.Body as any;
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      } catch {
        // try next candidate
      }
    }

    logger.debug(`[R2Storage] Object not found in R2 for key=${key}`);
    return null;
  }

  /**
   * Delete an object from R2
   */
  async delete(key: string): Promise<void> {
    const cleanKey = key.replace(/^\/+/, '');
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      }));
      logger.info(`[R2Storage] Deleted key=${cleanKey} from bucket=${this.bucket}`);
    } catch (err) {
      logger.error(`[R2Storage] Delete error for key=${cleanKey}: ${err}`);
      throw err;
    }
  }

  /**
   * Check if an object exists in R2 (supporting candidate prefixes)
   */
  async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^\/+/, '');
    const candidateKeys = [cleanKey];
    if (!cleanKey.includes('/')) {
      candidateKeys.push(
        `question-papers/${cleanKey}`,
        `assignments/${cleanKey}`,
        `quizzes/${cleanKey}`,
        `uploads/${cleanKey}`,
        `uploads/pdfs/${cleanKey}`,
        `lesson-plans/${cleanKey}`
      );
    }

    for (const candidate of candidateKeys) {
      try {
        await this.client.send(new HeadObjectCommand({
          Bucket: this.bucket,
          Key: candidate,
        }));
        return true;
      } catch {
        // try next
      }
    }
    return false;
  }

  /**
   * Generate pre-signed URL for direct browser uploading (default 15 minutes)
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresInSeconds = 900): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const isMock = !process.env.R2_ACCOUNT_ID && !env.R2_ACCESS_KEY_ID && !env.S3_ACCESS_KEY_ID;
    if (isMock) {
      return `/api/v1/storage/upload?key=${encodeURIComponent(cleanKey)}`;
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Generate temporary pre-signed URL for downloading/viewing (default 15 minutes)
   */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const cleanKey = key.replace(/^\/+/, '');
    const isMock = !process.env.R2_ACCOUNT_ID && !env.R2_ACCESS_KEY_ID && !env.S3_ACCESS_KEY_ID;
    if (isMock) {
      return `/api/v1/storage/by-key?key=${encodeURIComponent(cleanKey)}`;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

let r2Instance: R2StorageAdapter | null = null;
export function getR2Storage(): R2StorageAdapter {
  if (!r2Instance) {
    r2Instance = new R2StorageAdapter();
  }
  return r2Instance;
}
