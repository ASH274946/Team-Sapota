export interface StorageAdapter {
  save(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  getPresignedUploadUrl?(key: string, contentType: string, expiresInSeconds?: number): Promise<string>;
  getSignedDownloadUrl?(key: string, expiresInSeconds?: number): Promise<string>;
}
