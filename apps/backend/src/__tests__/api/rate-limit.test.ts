import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

/**
 * In-memory stand-in for Redis that implements the subset of commands used by
 * the rate-limit middleware and the DailyLimitService (get/set/del/incr/expire/
 * ttl + a Lua `eval` replicating the atomic check-and-increment script).
 */
class FakeRedis {
  private store = new Map<string, string>();
  private expirations = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }
  async del(keys: string | string[]): Promise<number> {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach((k) => this.store.delete(k));
    return list.length;
  }
  async incr(key: string): Promise<number> {
    const current = this.store.has(key) ? parseInt(this.store.get(key) as string, 10) : 0;
    const next = current + 1;
    this.store.set(key, String(next));
    return next;
  }
  async expire(key: string, _seconds: number): Promise<number> {
    this.expirations.set(key, _seconds);
    return 1;
  }
  async ttl(key: string): Promise<number> {
    return this.expirations.has(key) ? (this.expirations.get(key) as number) : -1;
  }
  // Replicates the CHECK_AND_INCR_SCRIPT used by both the middleware and DailyLimitService.
  async eval(_script: string, _numkeys: number, key: string, limit: string, expiry: string) {
    const lim = parseInt(limit, 10);
    const exp = parseInt(expiry, 10);
    const current = this.store.has(key) ? parseInt(this.store.get(key) as string, 10) : 0;
    if (current >= lim) return [0, current];
    const next = current + 1;
    this.store.set(key, String(next));
    if (next === 1) this.expirations.set(key, exp);
    return [1, next];
  }
  on(): this {
    return this;
  }
  reset() {
    this.store.clear();
    this.expirations.clear();
  }
}

// Shared instance returned by the mocked redis client (must be stable across calls).
const sharedRedis = new FakeRedis();

vi.mock('../../config/redis', () => ({
  getRedisClient: () => sharedRedis,
  getBullRedisClient: () => sharedRedis,
  isRedisConnected: () => true,
  isBullRedisConnected: () => true,
  closeRedis: vi.fn(),
  closeBullRedis: vi.fn(),
}));

import { DailyLimitService } from '../../services/daily-limit.service';
import { uploadRateLimiter, paperGenerationRateLimiter } from '../../middlewares/rate-limit.middleware';

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.on = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('DailyLimitService', () => {
  let service: DailyLimitService;
  let redis: FakeRedis;

  beforeEach(() => {
    redis = new FakeRedis();
    service = new DailyLimitService(redis as any);
  });

  it('exposes the correct limits per role and type', () => {
    expect(service.getLimit('STUDENT', 'quiz')).toBe(5);
    expect(service.getLimit('TEACHER', 'quiz')).toBe(10);
    expect(service.getLimit('TEACHER', 'paper')).toBe(5);
    expect(service.getLimit('TEACHER', 'assignment')).toBe(5);
    expect(service.getLimit('ADMIN', 'quiz')).toBe(Infinity);
    expect(service.getLimit('SUPER_ADMIN', 'quiz')).toBe(Infinity);
    // Students have no paper/assignment allowance
    expect(service.getLimit('STUDENT', 'paper')).toBe(0);
  });

  it('enforces 5 daily quizzes for student then blocks', async () => {
    for (let i = 1; i <= 5; i++) {
      const r = await service.checkAndIncrement('student-1', 'STUDENT', 'quiz');
      expect(r.allowed).toBe(true);
      expect(r.used).toBe(i);
      expect(r.remaining).toBe(5 - i);
    }

    const rBlocked = await service.checkAndIncrement('student-1', 'STUDENT', 'quiz');
    expect(rBlocked.allowed).toBe(false);
    expect(rBlocked.remaining).toBe(0);
  });

  it('grants admins unlimited usage', async () => {
    const r = await service.checkAndIncrement('admin-1', 'ADMIN', 'quiz');
    expect(r.allowed).toBe(true);
    expect(r.limit).toBe(Infinity);
    expect(r.remaining).toBe(Infinity);
  });

  it('denies roles with no permission for a type', async () => {
    const r = await service.checkLimit('student-1', 'STUDENT', 'paper');
    expect(r.allowed).toBe(false);
    expect(r.limit).toBe(0);
  });
});

describe('rate-limit middleware', () => {
  beforeEach(() => {
    sharedRedis.reset();
  });

  it('uploadRateLimiter allows up to 20 uploads then blocks with 429', async () => {
    const userId = 'uploader';
    let blocked = false;

    for (let i = 1; i <= 21; i++) {
      const req = { user: { id: userId }, ip: '10.0.0.1', headers: {} } as unknown as Request;
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;
      await uploadRateLimiter(req, res, next);

      if (i <= 20) {
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalledWith(429);
      } else {
        blocked = true;
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(429);
        const body = (res.json as any).mock.calls[0][0];
        expect(body).toMatchObject({ success: false });
        expect(body.error).toMatch(/uploads per day/i);
      }
    }

    expect(blocked).toBe(true);
  });

  it('paperGenerationRateLimiter blocks repeated generation (per-user cooldown / daily cap)', async () => {
    const userId = 'paper-user';
    let blocked = false;

    for (let i = 1; i <= 21; i++) {
      const req = { user: { id: userId, organizationId: 'org-1' }, ip: '10.0.0.2', headers: {} } as unknown as Request;
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;
      await paperGenerationRateLimiter(req, res, next);

      // The limiter enforces an IP burst, a 2-minute per-user cooldown and the
      // daily cap; any of those surfacing a 429 proves the limiter blocks.
      const statusCalls = (res.status as any).mock.calls;
      if (statusCalls.some((c: number[]) => c[0] === 429)) {
        blocked = true;
        const body = (res.json as any).mock.calls[0][0];
        expect(body).toMatchObject({ success: false });
        break;
      }
    }

    expect(blocked).toBe(true);
  });
});
