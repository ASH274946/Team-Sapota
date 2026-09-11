import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import storageRouter from '../api/storage/routes';
import prisma from '../config/prisma';
import * as r2Module from '../services/storage/r2-storage';

vi.mock('../middlewares/rate-limit.middleware', () => ({
  uploadRateLimiter: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../services/storage/r2-storage', () => ({
  getR2Storage: vi.fn(),
}));

vi.mock('../config/prisma', () => ({
  default: {
    storedFile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    assignment: {
      findFirst: vi.fn(),
    },
    enrollment: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = req.testUser || {
      id: 'test-user-1',
      email: 'teacher@vidyaai.com',
      role: 'TEACHER',
      organizationId: 'org-1',
    };
    next();
  },
}));

describe('Storage API Routes', () => {
  let app: express.Express;
  let mockR2: any;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v1/storage', storageRouter);

    mockR2 = {
      getPresignedUploadUrl: vi.fn().mockResolvedValue('https://mock-r2.com/presigned-upload'),
      getSignedDownloadUrl: vi.fn().mockResolvedValue('https://mock-r2.com/signed-download'),
      save: vi.fn().mockResolvedValue('https://mock-r2.com/signed-download'),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(Buffer.from('test')),
      exists: vi.fn().mockResolvedValue(true),
    };
    (r2Module.getR2Storage as any).mockReturnValue(mockR2);
  });

  describe('POST /api/v1/storage/presign-upload', () => {
    it('generates presigned upload URL for authorized scope', async () => {
      (prisma.storedFile.upsert as any).mockResolvedValueOnce({
        id: 'mock-file-id',
      });

      const res = await request(app)
        .post('/api/v1/storage/presign-upload')
        .send({
          filename: 'syllabus.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          scope: 'syllabus',
          entityId: 'course-123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBe('https://mock-r2.com/presigned-upload');
      expect(res.body.data.key).toContain('syllabus/course-123');
    });

    it('rejects upload when scope permission check fails', async () => {
      const studentApp = express();
      studentApp.use(express.json());
      studentApp.use((req: any, _res, next) => {
        req.testUser = { id: 'student-1', role: 'STUDENT', organizationId: 'org-1' };
        next();
      });
      studentApp.use('/api/v1/storage', storageRouter);

      // Student cannot upload to syllabus scope
      const res = await request(studentApp)
        .post('/api/v1/storage/presign-upload')
        .send({
          filename: 'hack.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          scope: 'syllabus',
          entityId: 'course-123',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/storage/:id/access', () => {
    it('returns signed download URL for authorized file owner', async () => {
      (prisma.storedFile.findUnique as any).mockResolvedValueOnce({
        id: 'f-1',
        key: 'teachers/test-user-1/f-1-notes.pdf',
        scope: 'teachers',
        ownerId: 'test-user-1',
        organizationId: 'org-1',
        originalName: 'notes.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
        isPublic: false,
      });

      const res = await request(app).get('/api/v1/storage/f-1/access');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBe('https://mock-r2.com/signed-download');
    });
  });

  describe('DELETE /api/v1/storage/:id', () => {
    it('deletes from R2 and removes DB record', async () => {
      (prisma.storedFile.findUnique as any).mockResolvedValueOnce({
        id: 'f-1',
        key: 'teachers/test-user-1/f-1-notes.pdf',
        scope: 'teachers',
        ownerId: 'test-user-1',
        organizationId: 'org-1',
      });
      (prisma.storedFile.delete as any).mockResolvedValueOnce({});

      const res = await request(app).delete('/api/v1/storage/f-1');

      expect(res.status).toBe(204);
      expect(mockR2.delete).toHaveBeenCalledWith('teachers/test-user-1/f-1-notes.pdf');
    });
  });
});
