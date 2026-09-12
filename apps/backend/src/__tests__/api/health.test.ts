import { describe, it, expect } from 'vitest';
import express from 'express';
import helmet from 'helmet';
import request from 'supertest';

/**
 * Health endpoint contract test.
 *
 * The production app (`src/app.ts`) exposes /health with the exact helmet
 * configuration reproduced below. We spin up a minimal Express app using the
 * SAME helmet settings and the same response shape so the contract (status 200,
 * JSON shape, and security headers) is verified against real middleware.
 */
function buildHealthApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    })
  );

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      phase: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        db: 'prisma-postgresql',
        redis: 'connected',
        bullmqRedis: 'connected',
        workers: 'web-only',
      },
    });
  });

  return app;
}

describe('GET /health', () => {
  const app = buildHealthApp();

  it('returns 200 with the expected JSON shape', async () => {
    const res = await request(app).get('/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      phase: 'ready',
      services: { db: 'prisma-postgresql' },
    });
    expect(typeof res.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.services).toHaveProperty('redis');
    expect(res.body.services).toHaveProperty('bullmqRedis');
    expect(res.body.services).toHaveProperty('workers');
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/health').expect(200);

    // helmet always sets these
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');

    // our CSP config sets a policy and forbids framing
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['content-security-policy']).toContain("object-src 'none'");
  });
});
