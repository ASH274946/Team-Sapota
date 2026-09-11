import { Request, Response } from 'express';
import fs from 'fs';
import prisma from '../../config/prisma';
import { getR2Storage } from '../../services/storage/r2-storage';
import { generateR2ObjectKey, parseR2ObjectKey, StorageScope } from '../../services/storage/key-generator';
import { StorageRbacService, StorageUserContext } from '../../services/storage/storage-rbac.service';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { logger } from '../../utils/logger';

function getUserContext(req: Request): StorageUserContext {
  const user = (req as any).user;
  if (!user || !user.id) {
    throw ApiError.unauthorized('Authentication required');
  }
  return {
    id: user.id,
    role: user.role,
    organizationId: user.organizationId || (req as any).organizationId || null,
  };
}

/**
 * POST /api/v1/storage/presign-upload
 * Generates presigned URL for direct browser-to-R2 upload
 */
export async function presignUpload(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  const { filename, mimeType, sizeBytes, scope, entityId, subFolder, isPublic } = req.body;

  // 1. RBAC authorization for scope
  const allowed = StorageRbacService.canUploadToScope(user, scope, entityId);
  if (!allowed) {
    throw ApiError.forbidden(`You do not have permission to upload files to ${scope}/${entityId}`);
  }

  // 2. Generate deterministic R2 key
  const { key, fileId } = generateR2ObjectKey({
    scope: scope as StorageScope,
    entityId,
    filename,
    subFolder,
  });

  const r2 = getR2Storage();
  const expiresInSeconds = 900; // 15 minutes
  const uploadUrl = await r2.getPresignedUploadUrl(key, mimeType, expiresInSeconds);

  // Pre-create metadata record in pending/active state
  await prisma.storedFile.upsert({
    where: { key },
    create: {
      id: fileId,
      key,
      bucket: process.env.R2_BUCKET_NAME || 'vidyaai-uploads',
      originalName: filename,
      mimeType,
      sizeBytes,
      scope,
      ownerId: user.id,
      organizationId: user.organizationId,
      entityId,
      isPublic: Boolean(isPublic),
    },
    update: {
      originalName: filename,
      mimeType,
      sizeBytes,
    },
  });

  sendCreated(res, {
    uploadUrl,
    fileId,
    key,
    expiresInSeconds,
  });
}

/**
 * POST /api/v1/storage/upload
 * Handles direct multipart file upload via server and saves to Cloudflare R2
 */
export async function directUpload(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded');
  }

  const scope = (req.body.scope || 'documents') as StorageScope;
  const entityId = req.body.entityId || user.id;
  const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;

  // 1. RBAC Check
  const allowed = StorageRbacService.canUploadToScope(user, scope, entityId);
  if (!allowed) {
    throw ApiError.forbidden(`You do not have permission to upload files to ${scope}/${entityId}`);
  }

  const { originalname, mimetype, size, path: tempPath } = req.file;

  // 2. Generate R2 key
  const { key, fileId } = generateR2ObjectKey({
    scope,
    entityId,
    filename: originalname,
  });

  const r2 = getR2Storage();
  let buffer: Buffer;

  try {
    if (tempPath && fs.existsSync(tempPath)) {
      buffer = fs.readFileSync(tempPath);
    } else if (req.file.buffer) {
      buffer = req.file.buffer;
    } else {
      throw new Error('Unable to read uploaded file buffer');
    }
  } catch (err: any) {
    throw ApiError.badRequest(`Failed to read file: ${err.message}`);
  }

  // 3. Upload to Cloudflare R2
  try {
    await r2.save(key, buffer, mimetype);
  } catch (r2Err: any) {
    logger.error(`[directUpload] R2 upload failed for key=${key}: ${r2Err.message}`);
    throw ApiError.internal('Failed to upload file to Cloudflare R2 storage');
  } finally {
    // Clean up local temp file
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // ignore unlink error
      }
    }
  }

  // 4. Save metadata to DB (with rollback if DB fails)
  let record;
  try {
    record = await prisma.storedFile.create({
      data: {
        id: fileId,
        key,
        bucket: process.env.R2_BUCKET_NAME || 'vidyaai-uploads',
        originalName: originalname,
        mimeType: mimetype,
        sizeBytes: size,
        scope,
        ownerId: user.id,
        organizationId: user.organizationId,
        entityId,
        isPublic,
      },
    });
  } catch (dbErr: any) {
    logger.error(`[directUpload] DB record creation failed, rolling back R2 key=${key}: ${dbErr.message}`);
    await r2.delete(key).catch(() => {});
    throw ApiError.internal('Failed to save file metadata');
  }

  const downloadUrl = await r2.getSignedDownloadUrl(key, 900);

  sendCreated(res, {
    ...record,
    downloadUrl,
  });
}

/**
 * GET /api/v1/storage/:id/access
 * Authenticated RBAC verification and presigned download URL generation
 */
export async function getFileAccess(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  const { id } = req.params;

  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) {
    throw ApiError.notFound('File not found');
  }

  const canAccess = await StorageRbacService.canAccessFile(user, 'file:read', file);
  if (!canAccess) {
    throw ApiError.forbidden('You do not have permission to access this file');
  }

  const r2 = getR2Storage();
  const expiresInSeconds = 900;
  const downloadUrl = await r2.getSignedDownloadUrl(file.key, expiresInSeconds);

  sendSuccess(res, {
    data: {
      fileId: file.id,
      key: file.key,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      downloadUrl,
      expiresInSeconds,
    },
  });
}

/**
 * GET /api/v1/storage/by-key
 * Access file via object key with strict RBAC enforcement
 */
export async function getFileByKey(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  const key = req.query.key as string;
  if (!key) {
    throw ApiError.badRequest('Key query parameter is required');
  }

  let file = await prisma.storedFile.findUnique({ where: { key } });

  // If not found in DB directly, parse key structure and check if user has access to scope
  if (!file) {
    const parsed = parseR2ObjectKey(key);
    if (!parsed) {
      throw ApiError.notFound('File key not found');
    }
    file = {
      id: parsed.fileId,
      key,
      bucket: process.env.R2_BUCKET_NAME || 'vidyaai-uploads',
      originalName: parsed.filename,
      mimeType: 'application/octet-stream',
      sizeBytes: 0,
      scope: parsed.scope,
      ownerId: parsed.scope === 'students' || parsed.scope === 'teachers' || parsed.scope === 'admins' || parsed.scope === 'documents' ? parsed.entityId : user.id,
      organizationId: user.organizationId,
      entityId: parsed.entityId,
      isPublic: false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  const canAccess = await StorageRbacService.canAccessFile(user, 'file:read', file!);
  if (!canAccess) {
    throw ApiError.forbidden('You do not have permission to access this file');
  }

  const r2 = getR2Storage();
  const expiresInSeconds = 900;
  const downloadUrl = await r2.getSignedDownloadUrl(key, expiresInSeconds);

  sendSuccess(res, {
    data: {
      key,
      downloadUrl,
      expiresInSeconds,
    },
  });
}

/**
 * DELETE /api/v1/storage/:id
 * RBAC authorization, R2 object removal, and database metadata cleanup
 */
export async function deleteFile(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  const { id } = req.params;

  const file = await prisma.storedFile.findUnique({ where: { id } });
  if (!file) {
    throw ApiError.notFound('File not found');
  }

  const canDelete = await StorageRbacService.canAccessFile(user, 'file:delete', file);
  if (!canDelete) {
    throw ApiError.forbidden('You do not have permission to delete this file');
  }

  const r2 = getR2Storage();
  await r2.delete(file.key);
  await prisma.storedFile.delete({ where: { id } });

  sendNoContent(res);
}

/**
 * GET /api/v1/storage
 * List stored files with RBAC filtering
 */
export async function listFiles(req: Request, res: Response): Promise<void> {
  const user = getUserContext(req);
  const { page, limit, sort, order } = parsePagination(req);
  const scope = req.query.scope as string | undefined;
  const entityId = req.query.entityId as string | undefined;

  const where: any = {};

  if (scope) where.scope = scope;
  if (entityId) where.entityId = entityId;

  // Non-super-admins only see files in their org or owned by them
  if (user.role !== 'SUPER_ADMIN') {
    if (user.role === 'STUDENT') {
      where.OR = [
        { ownerId: user.id },
        { isPublic: true },
      ];
    } else if (user.organizationId) {
      where.organizationId = user.organizationId;
    } else {
      where.ownerId = user.id;
    }
  }

  const [files, total] = await Promise.all([
    prisma.storedFile.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.storedFile.count({ where }),
  ]);

  sendSuccess(res, {
    data: files,
    pagination: buildPagination(page, limit, total),
  });
}
