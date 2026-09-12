import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import type { StorageAdapter } from './storage-adapter';
import { logger } from '../../utils/logger';

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET || 'vidyaai-uploads';
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY || '';

    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : process.env.R2_ENDPOINT_URL || undefined;

    this.client = new S3Client({
      region: env.S3_REGION || 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
    return this.getPublicUrl(key);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      if (!response.Body) return null;
      const chunks: Uint8Array[] = [];
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      logger.error(`[S3Storage] Get error for key=${key}: ${err}`);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
    } catch (err) {
      logger.error(`[S3Storage] Delete error for key=${key}: ${err}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    // Generate pre-signed URL synchronously or asynchronously.
    // For interface compatibility, if keys aren't defined, return local path helper.
    if (!env.S3_ACCESS_KEY_ID) {
      return `/api/v1/papers/download/${key}`;
    }
    // Return a signed URL or public URL. Since getPublicUrl is sync,
    // we return the public URL structure, but we also support async pre-signing where needed.
    return `https://${this.bucket}.s3.${env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }
}
