import { Request, Response } from 'express';
import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';
import { getR2Storage } from '../services/storage/r2-storage';
import { generateR2ObjectKey } from '../services/storage/key-generator';
import { logger } from '../utils/logger';

async function resolveOrgId(req: Request): Promise<string> {
  const reqOrgId = req.user?.activeOrganizationId || req.user?.organizationId;
  if (reqOrgId) {
    const existing = await prisma.organization.findUnique({
      where: { id: reqOrgId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // Check user in database
  if (req.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { organizationId: true, activeOrganizationId: true },
    });
    if (dbUser?.organizationId) {
      const existing = await prisma.organization.findUnique({
        where: { id: dbUser.organizationId },
        select: { id: true },
      });
      if (existing) return existing.id;
    }
    if (dbUser?.activeOrganizationId) {
      const existing = await prisma.organization.findUnique({
        where: { id: dbUser.activeOrganizationId },
        select: { id: true },
      });
      if (existing) return existing.id;
    }
  }

  // Fallback to default active organization
  const defaultOrg = await prisma.organization.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  if (defaultOrg) return defaultOrg.id;

  const anyOrg = await prisma.organization.findFirst({ select: { id: true } });
  if (anyOrg) return anyOrg.id;

  // If no org exists, create default
  const newOrg = await prisma.organization.create({
    data: {
      name: 'Vidya AI Campus',
      code: 'VIDYA-CAMPUS',
      status: 'ACTIVE',
    },
  });
  return newOrg.id;
}

async function resolveUserId(req: Request, organizationId: string): Promise<string> {
  const reqUserId = req.user?.id;
  if (reqUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: reqUserId },
      select: { id: true, organizationId: true },
    });
    if (dbUser) {
      if (!dbUser.organizationId) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { organizationId },
        }).catch(() => {});
      }
      return dbUser.id;
    }
  }

  const teacher = await prisma.user.findFirst({
    where: { role: { in: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true },
  });
  if (teacher) return teacher.id;

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (anyUser) return anyUser.id;

  return reqUserId || 'system-user';
}

export const uploadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUserId = req.user?.id;
    if (!rawUserId) {
      res.status(401).json({ success: false, error: 'Unauthorized: authentication required' });
      return;
    }

    const organizationId = await resolveOrgId(req);
    const userId = await resolveUserId(req, organizationId);

    const { title, description, resourceType, subject, className } = req.body;
    const file = req.file;

    if (!title || !resourceType) {
      res.status(400).json({ success: false, error: 'Title and resource type are required' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, error: 'File is required' });
      return;
    }

    let buffer: Buffer;
    if (file.path && fs.existsSync(file.path)) {
      buffer = fs.readFileSync(file.path);
    } else if (file.buffer) {
      buffer = file.buffer;
    } else {
      res.status(400).json({ success: false, error: 'Unable to read uploaded file' });
      return;
    }

    // 1. Generate structured R2 key: documents/{userId}/{fileId}-{filename}
    const { key, fileId } = generateR2ObjectKey({
      scope: 'documents',
      entityId: userId,
      filename: file.originalname || file.filename || 'document.pdf',
    });

    // 2. Upload to Cloudflare R2
    const r2 = getR2Storage();
    let fileUrl: string;
    let r2Success = false;
    try {
      await r2.save(key, buffer, file.mimetype || 'application/octet-stream');
      fileUrl = key;
      r2Success = true;
      logger.info(`[uploadResource] Successfully uploaded to Cloudflare R2: key=${key}`);
    } catch (r2Err: any) {
      logger.error(`[uploadResource] Cloudflare R2 upload failed (key=${key}): ${r2Err.message}`);
      // Safe fallback: persist permanently in local uploads folder so viewing/downloading never fails
      const localUploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
      if (!fs.existsSync(localUploadDir)) {
        fs.mkdirSync(localUploadDir, { recursive: true });
      }
      const safeFilename = file.filename || `${fileId}-${file.originalname}`;
      const targetLocalPath = path.join(localUploadDir, safeFilename);
      if (!fs.existsSync(targetLocalPath)) {
        fs.writeFileSync(targetLocalPath, buffer);
      }
      fileUrl = `/uploads/${safeFilename}`;
    } finally {
      // Clean up temporary disk file ONLY when R2 upload succeeded
      if (r2Success && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
    }

    // 3. Create StoredFile metadata record
    await prisma.storedFile.upsert({
      where: { key },
      create: {
        id: fileId,
        key,
        bucket: process.env.R2_BUCKET_NAME || 'vidyaai-uploads',
        originalName: file.originalname || 'document.pdf',
        mimeType: file.mimetype || 'application/octet-stream',
        sizeBytes: buffer.length,
        scope: 'documents',
        ownerId: userId,
        organizationId,
        isPublic: false,
      },
      update: {
        sizeBytes: buffer.length,
      },
    }).catch((err) => {
      logger.warn(`[uploadResource] StoredFile metadata creation warning: ${err.message}`);
    });

    // 4. Create LibraryResource record in database
    const resource = await prisma.libraryResource.create({
      data: {
        title,
        description,
        resourceType,
        subject,
        className,
        fileUrl,
        fileSize: buffer.length,
        uploadedById: userId,
        organizationId,
      },
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error: any) {
    logger.error(`[uploadResource] Error uploading resource: ${error.message || error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to upload resource' });
  }
};

export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const organizationId = await resolveOrgId(req);
    const { subject, className, resourceType, search } = req.query;

    const where: any = {
      organizationId,
    };

    if (subject && subject !== 'All') {
      where.subject = String(subject);
    }
    if (className && className !== 'All') {
      where.className = String(className);
    }
    if (resourceType && resourceType !== 'All') {
      where.resourceType = String(resourceType);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { subject: { contains: String(search), mode: 'insensitive' } },
        { resourceType: { contains: String(search), mode: 'insensitive' } },
        { className: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    let resources: any[] = [];
    try {
      resources = await prisma.libraryResource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true } },
        },
      });
    } catch (err) {
      logger.warn(`[getResources] LibraryResource query warning: ${err}`);
    }

    const unifiedResources = [...resources];

    // Fetch Assignments
    if (!resourceType || resourceType === 'All' || resourceType === 'Assignment') {
      const assignmentWhere: any = { organizationId, createdById: userId };
      if (subject && subject !== 'All') assignmentWhere.subject = String(subject);
      if (search) {
        assignmentWhere.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { subject: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const assignments = await prisma.assignment.findMany({
        where: assignmentWhere,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } }, class: { select: { grade: true, section: true } } }
      });

      const assignmentResources = assignments.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description || 'Generated Assignment',
        resourceType: 'Assignment',
        subject: a.subject,
        className: a.class ? `${a.class.grade} - ${a.class.section}` : 'General',
        fileUrl: `/assignments/${a.id}`,
        fileSize: 0,
        uploadedById: a.createdById || '',
        uploadedBy: a.createdBy || { firstName: 'System', lastName: '' },
        organizationId: a.organizationId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }));

      unifiedResources.push(...assignmentResources);
    }

    // Fetch KnowledgeDocuments
    if (!resourceType || resourceType === 'All' || resourceType === 'Document' || resourceType === 'PDF') {
      const docWhere: any = { organizationId };
      if (search) {
        docWhere.OR = [
          { filename: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const docs = await prisma.knowledgeDocument.findMany({
        where: docWhere,
        orderBy: { createdAt: 'desc' }
      });

      const docResources = docs.map(d => ({
        id: d.id,
        title: d.filename,
        description: 'Uploaded Material',
        resourceType: 'Document',
        subject: 'General',
        className: 'General',
        fileUrl: d.fileUrl,
        fileSize: 0,
        uploadedById: '',
        uploadedBy: { firstName: 'Faculty', lastName: 'Member' },
        organizationId: d.organizationId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }));

      unifiedResources.push(...docResources);
    }

    // Sort all by createdAt desc safely
    unifiedResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, data: unifiedResources });
  } catch (error: any) {
    logger.error(`[getResources] Error fetching resources: ${error.message || error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch resources' });
  }
};

export const updateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { title, description, resourceType, subject, className } = req.body;

    const existing = await prisma.libraryResource.findUnique({ where: { id } });
    if (!existing || existing.uploadedById !== userId) {
      res.status(403).json({ success: false, error: 'Resource not found or unauthorized' });
      return;
    }

    const updated = await prisma.libraryResource.update({
      where: { id },
      data: {
        title,
        description,
        resourceType,
        subject,
        className,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error(`[updateResource] Error updating resource: ${error.message || error}`);
    res.status(500).json({ success: false, error: 'Failed to update resource' });
  }
};

export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.libraryResource.findUnique({ where: { id } });
    if (!existing || existing.uploadedById !== userId) {
      res.status(403).json({ success: false, error: 'Resource not found or unauthorized' });
      return;
    }

    if (existing.fileUrl) {
      if (existing.fileUrl.startsWith('/uploads/')) {
        const filename = existing.fileUrl.replace('/uploads/', '');
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore
          }
        }
      } else {
        // Delete from Cloudflare R2
        const r2 = getR2Storage();
        await r2.delete(existing.fileUrl).catch(() => {});
      }
    }

    await prisma.libraryResource.delete({ where: { id } });

    res.json({ success: true, message: 'Resource deleted' });
  } catch (error: any) {
    logger.error(`[deleteResource] Error deleting resource: ${error.message || error}`);
    res.status(500).json({ success: false, error: 'Failed to delete resource' });
  }
};

export const downloadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.libraryResource.findUnique({ where: { id } });

    if (!resource || !resource.fileUrl) {
      res.status(404).json({ success: false, error: 'Resource not found' });
      return;
    }

    if (resource.fileUrl.startsWith('/uploads/')) {
      const filename = resource.fileUrl.replace('/uploads/', '');
      const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        res.download(filePath, resource.title);
        return;
      }
    }

    if (resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://')) {
      res.redirect(resource.fileUrl);
      return;
    }

    try {
      const r2 = getR2Storage();
      const signedUrl = await r2.getSignedDownloadUrl(resource.fileUrl, 900);
      res.redirect(signedUrl);
    } catch (r2Err: any) {
      logger.warn(`[downloadResource] R2 download url error: ${r2Err.message}`);
      const baseFilename = path.basename(resource.fileUrl);
      const localPath = path.join(path.resolve(process.env.UPLOAD_DIR || 'uploads'), baseFilename);
      if (fs.existsSync(localPath)) {
        res.download(localPath, resource.title);
      } else {
        res.status(404).json({ success: false, error: 'File not available on server' });
      }
    }
  } catch (error: any) {
    logger.error(`[downloadResource] Error downloading resource: ${error.message || error}`);
    res.status(500).json({ success: false, error: 'Failed to download resource' });
  }
};

export const viewResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.libraryResource.findUnique({ where: { id } });

    if (!resource || !resource.fileUrl) {
      res.status(404).json({ success: false, error: 'Resource not found' });
      return;
    }

    if (resource.fileUrl.startsWith('/uploads/')) {
      const filename = resource.fileUrl.replace('/uploads/', '');
      const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        if (resource.resourceType === 'PDF' || filename.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
        res.sendFile(filePath);
        return;
      }
    }

    if (resource.fileUrl.startsWith('http://') || resource.fileUrl.startsWith('https://')) {
      res.redirect(resource.fileUrl);
      return;
    }

    try {
      const r2 = getR2Storage();
      const signedUrl = await r2.getSignedDownloadUrl(resource.fileUrl, 900);
      res.redirect(signedUrl);
    } catch (r2Err: any) {
      logger.warn(`[viewResource] R2 view url error: ${r2Err.message}`);
      const baseFilename = path.basename(resource.fileUrl);
      const localPath = path.join(path.resolve(process.env.UPLOAD_DIR || 'uploads'), baseFilename);
      if (fs.existsSync(localPath)) {
        if (resource.resourceType === 'PDF' || baseFilename.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
        res.sendFile(localPath);
      } else {
        res.status(404).json({ success: false, error: 'File not available on storage server' });
      }
    }
  } catch (error: any) {
    logger.error(`[viewResource] Error viewing resource: ${error.message || error}`);
    res.status(500).json({ success: false, error: 'Failed to view resource' });
  }
};
