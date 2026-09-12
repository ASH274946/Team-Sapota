import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import multer from 'multer';
import { errorMiddleware } from '../../middlewares/error.middleware';
import { AppError } from '../../api/common/errors';

vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn() },
}));

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/app-error', () => {
    throw new AppError('Custom boom', 418, 'TEAPOT');
  });

  app.get('/zod-error', () => {
    throw new ZodError([
      { code: 'custom', path: ['email'], message: 'Invalid email' } as any,
    ]);
  });

  app.get('/multer-error', () => {
    throw new multer.MulterError('LIMIT_FILE_SIZE' as any, 'file');
  });

  app.get('/unknown-error', () => {
    throw new Error('secret-db-connection-string-leaked');
  });

  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware', () => {
  const app = buildApp();

  it('maps an AppError to its statusCode and code', async () => {
    const res = await request(app).get('/app-error').expect(418);
    expect(res.body).toMatchObject({
      success: false,
      error: 'Custom boom',
      code: 'TEAPOT',
    });
  });

  it('maps a ZodError to 400 with field details', async () => {
    const res = await request(app).get('/zod-error').expect(400);
    expect(res.body).toMatchObject({
      success: false,
      error: 'Validation failed',
    });
    expect(res.body.details).toHaveProperty('email');
  });

  it('maps a MulterError to 400', async () => {
    const res = await request(app).get('/multer-error').expect(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/File upload failed/);
  });

  it('returns the raw message for unknown errors outside production', async () => {
    const res = await request(app).get('/unknown-error').expect(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('secret-db-connection-string-leaked');
    // No stack trace should ever leak into the response body.
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('returns a generic message for unknown errors in production (no leak)', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app).get('/unknown-error').expect(500);
      expect(res.body.error).toBe('Internal server error');
      expect(res.body.error).not.toContain('secret');
      expect(JSON.stringify(res.body)).not.toContain('stack');
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
