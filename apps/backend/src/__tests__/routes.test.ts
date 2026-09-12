import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import apiRouter from '../routes';
import { errorMiddleware } from '../middlewares/error.middleware';

// Mock Auth Middleware
vi.mock('../middlewares/auth.middleware', () => ({
  authenticate: vi.fn((req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: 'test-user',
      email: 'test@example.com',
      role: 'SUPER_ADMIN',
      organizationId: 'org-a',
      activeOrganizationId: 'org-a',
    };
    next();
  }),
  authorize: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  requireOrganizationScope: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  requireOwnership: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

// Mock Services
vi.mock('../services/assignment.service', () => ({
  createAssignment: vi.fn().mockImplementation(async (data, files) => {
    return {
      _id: 'mocked-id',
      ...data,
      uploadedFiles: files,
      status: 'draft',
    };
  }),
  listAssignments: vi.fn().mockImplementation(async (page, limit, _status) => {
    return {
      assignments: [],
      total: 0,
      page,
      limit,
    };
  }),
  getAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  enqueueGeneration: vi.fn(),
}));

// Mock Sockets
vi.mock('../sockets/socket.server', () => ({
  emitToAssignment: vi.fn(),
  initializeSocketServer: vi.fn(),
}));

// Mock Rate Limiting
vi.mock('../middlewares/rate-limit.middleware', () => ({
  paperGenerationRateLimiter: vi.fn((_req, _res, next) => next()),
  quizGenerationRateLimiter: vi.fn((_req, _res, next) => next()),
  uploadRateLimiter: vi.fn((_req, _res, next) => next()),
}));

describe('API Route Registry and Error Handling Integration Tests', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    app.use(errorMiddleware);
  });

  describe('Route Versioning & Aliasing', () => {
    it('should resolve versioned GET /api/v1/assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .expect(200);

      expect(res.body).toEqual({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      });
    });

    it('should resolve legacy/compatible GET /api/assignments', async () => {
      const res = await request(app)
        .get('/api/assignments')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/v1/invalid-route')
        .expect(404);
    });
  });

  describe('Validation & Payload Parsing', () => {
    it('should return 400 Bad Request when request body is empty or malformed', async () => {
      const res = await request(app)
        .post('/api/v1/assignments')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toHaveProperty('title');
      expect(res.body.details).toHaveProperty('subject');
    });
  });

  describe('Multer / Upload Error Handling', () => {
    it('should capture custom file filter errors in global handler and return 400', async () => {
      // Simulate file filter throwing a file-type error by bypassing router to direct error middleware
      const customApp = express();
      customApp.get('/error-trigger', (_req, _res, next) => {
        next(new Error('File type image/png is not allowed. Only PDF and TXT files accepted.'));
      });
      customApp.use(errorMiddleware);

      const res = await request(customApp)
        .get('/error-trigger')
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Only PDF and TXT');
    });
  });
});
