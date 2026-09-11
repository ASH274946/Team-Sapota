import type { StorageScope } from '../../services/storage/key-generator';

export interface PresignUploadRequestDto {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  scope: StorageScope;
  entityId: string;
  subFolder?: string;
  isPublic?: boolean;
}

export interface PresignUploadResponseDto {
  uploadUrl: string;
  fileId: string;
  key: string;
  expiresInSeconds: number;
}

export interface FileAccessResponseDto {
  downloadUrl: string;
  fileId: string;
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  expiresInSeconds: number;
}

export interface StoredFileDto {
  id: string;
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  scope: string;
  ownerId: string;
  organizationId: string | null;
  entityId: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}
