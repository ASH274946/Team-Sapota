import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import prisma from '../../config/prisma';
import { AuditService } from '../../services/audit.service';

// ── Controllable mocks (objects built entirely inside factories below) ──
vi.mock('argon2', () => {
  const hash = vi.fn();
  const verify = vi.fn();
  return { hash, verify, default: { hash, verify } };
});
vi.mock('jsonwebtoken', () => {
  const TokenExpiredError = class extends Error {
    constructor(m = 'jwt expired') {
      super(m);
      this.name = 'TokenExpiredError';
    }
  };
  const JsonWebTokenError = class extends Error {
    constructor(m = 'invalid token') {
      super(m);
      this.name = 'JsonWebTokenError';
    }
  };
  const sign = vi.fn(() => 'signed-token');
  const verify = vi.fn();
  const m = { sign, verify, TokenExpiredError, JsonWebTokenError };
  return { ...m, default: m };
});
vi.mock('../../config/prisma', () => ({
  default: {
    user: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    loginHistory: { create: vi.fn().mockResolvedValue({}) },
    session: {
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({}),
    },
    organization: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
  },
}));

// Stable fake redis shared across getRedisClient() calls (referenced lazily in the factory).
class LoginFakeRedis {
  private store = new Map<string, string>();
  async get(k: string) {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  async set(k: string, v: string) {
    this.store.set(k, v);
    return 'OK';
  }
  async del(keys: string | string[]) {
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => this.store.delete(k));
    return 1;
  }
  async incr(k: string) {
    const c = this.store.has(k) ? parseInt(this.store.get(k) as string, 10) : 0;
    const n = c + 1;
    this.store.set(k, String(n));
    return n;
  }
  async expire() {
    return 1;
  }
  reset() {
    this.store.clear();
  }
}
const loginRedis = new LoginFakeRedis();
vi.mock('../../config/redis', () => ({ getRedisClient: () => loginRedis }));
vi.mock('../../services/audit.service', () => ({ AuditService: { logAuditEvent: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../../services/invitation.service', () => ({ validateInvitationToken: vi.fn() }));
vi.mock('../../utils/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import {
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
  hashPassword,
} from '../../services/auth.service';
import authRouter from '../../api/auth/routes';

// ─────────────────────────────────────────────────────────────
// Unit tests for auth primitives (argon2 + jwt mocked)
// ─────────────────────────────────────────────────────────────
describe('auth.service primitives', () => {
  beforeEach(() => {
    vi.mocked(argon2.verify).mockReset();
    vi.mocked(argon2.hash).mockReset();
    vi.mocked(jwt.sign).mockClear();
    vi.mocked(jwt.verify).mockReset();
  });

  it('verifyPassword returns true on a matching hash', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true);
    expect(await verifyPassword('pw', 'hash')).toBe(true);
  });

  it('verifyPassword returns false on a non-matching hash', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(false);
    expect(await verifyPassword('pw', 'hash')).toBe(false);
  });

  it('verifyPassword returns false (never throws) when argon2 errors', async () => {
    vi.mocked(argon2.verify).mockRejectedValue(new Error('kdf failure'));
    expect(await verifyPassword('pw', 'hash')).toBe(false);
  });

  it('hashPassword delegates to argon2', async () => {
    vi.mocked(argon2.hash).mockResolvedValue('argon-hash');
    expect(await hashPassword('pw')).toBe('argon-hash');
  });

  it('generateAccessToken produces a signed token', () => {
    const token = generateAccessToken({ userId: 'u1', email: 'a@b.com', role: 'STUDENT' });
    expect(token).toBe('signed-token');
    expect(jwt.sign).toHaveBeenCalledOnce();
  });

  it('verifyAccessToken returns the payload for a valid token', () => {
    vi.mocked(jwt.verify).mockReturnValue({ id: 'u1', email: 'a@b.com', role: 'TEACHER' } as any);
    const payload = verifyAccessToken('token');
    expect(payload.userId).toBe('u1');
    expect(payload.role).toBe('TEACHER');
  });

  it('verifyAccessToken rejects an expired token', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });
    expect(() => verifyAccessToken('expired')).toThrow(/expired/i);
  });

  it('verifyAccessToken rejects a forged/invalid token', () => {
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('invalid signature');
    });
    expect(() => verifyAccessToken('forged')).toThrow(/invalid/i);
  });
});

// ─────────────────────────────────────────────────────────────
// Integration test for the login flow (prisma/argon2/jwt mocked)
// ─────────────────────────────────────────────────────────────
describe('POST /login (enumeration-safe)', () => {
  let app: express.Express;

  const validUser = {
    id: 'uid-1',
    email: 'student@vidyaai.com',
    role: 'STUDENT',
    passwordHash: 'hashed',
    organizationId: null,
    activeOrganizationId: null,
    departmentId: null,
    firstName: 'Rahul',
    lastName: 'Verma',
    hasCompletedOnboarding: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({ id: 'rt-1' } as any);
    loginRedis.reset();
    app = express();
    app.use(express.json());
    app.use('/', authRouter);
  });

  it('returns a token for valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .set('user-agent', 'vitest')
      .send({ email: 'student@vidyaai.com', password: 'Student@123' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('signed-token');
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('student@vidyaai.com');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(AuditService.logAuditEvent).toHaveBeenCalled();
  });

  it('rejects an invalid password with 401', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .set('user-agent', 'vitest')
      .send({ email: 'student@vidyaai.com', password: 'wrong' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('does not reveal whether the email exists (enumeration-safe)', async () => {
    // Non-existent user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const missing = await request(app)
      .post('/login')
      .set('user-agent', 'vitest')
      .send({ email: 'ghost@vidyaai.com', password: 'whatever' })
      .expect(401);

    // Existing user, wrong password
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validUser as any);
    vi.mocked(argon2.verify).mockResolvedValue(false);
    const wrong = await request(app)
      .post('/login')
      .set('user-agent', 'vitest')
      .send({ email: 'student@vidyaai.com', password: 'wrong' })
      .expect(401);

    // Same status + identical generic message => cannot enumerate accounts.
    expect(missing.status).toBe(wrong.status);
    expect(missing.body.error).toBe(wrong.body.error);
    expect(missing.body.error).toBe('Invalid email or password');
    expect(missing.body.error).not.toMatch(/not found|no account|does not exist/i);
    expect(JSON.stringify(missing.body)).not.toContain('ghost@vidyaai.com');
  });
});
