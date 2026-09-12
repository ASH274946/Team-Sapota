import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { getRequestOrgId } from '../security/request-context';
import { loadSubmissionScoped, AccessDeniedError } from '../security/assignment-access';
import { aiGenerationRateLimiter, globalIpRateLimiter } from '../middlewares/rate-limit.middleware';
import prisma from '../config/prisma';

vi.mock('../config/prisma', () => ({
  default: {
    studentSubmission: {
      findUnique: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../config/redis', () => {
  const mockRedis = {
    eval: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };
  return {
    getRedisClient: () => mockRedis,
    getBullRedisClient: () => mockRedis,
    isRedisConnected: () => true,
    isBullRedisConnected: () => true,
  };
});

describe('Multi-Tenant RBAC Security & Rate Limiting Integration (VID-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Tenant RBAC Tenant Isolation', () => {
    it('should NOT allow a regular TEACHER to override organizationId via request body', () => {
      const mockReq = {
        user: {
          id: 'user-teacher-1',
          role: 'TEACHER',
          organizationId: 'org-alpha',
        },
        body: {
          _requireOrganizationScope: 'org-beta', // Malicious cross-tenant override attempt
        },
      } as unknown as Request;

      const effectiveOrgId = getRequestOrgId(mockReq);
      expect(effectiveOrgId).toBe('org-alpha');
      expect(effectiveOrgId).not.toBe('org-beta');
    });

    it('should allow SUPER_ADMIN to target specific active organization scope', () => {
      const mockReq = {
        user: {
          id: 'user-super-admin',
          role: 'SUPER_ADMIN',
          organizationId: 'org-alpha',
        },
        body: {
          _requireOrganizationScope: 'org-beta',
        },
      } as unknown as Request;

      const effectiveOrgId = getRequestOrgId(mockReq);
      expect(effectiveOrgId).toBe('org-beta');
    });

    it('should throw AccessDeniedError (403) when user attempts to access cross-tenant submission', async () => {
      const mockReq = {
        user: {
          id: 'user-teacher-1',
          role: 'TEACHER',
          organizationId: 'org-alpha',
        },
        params: { submissionId: 'sub-org-beta-999' },
      } as unknown as Request;

      vi.mocked(prisma.studentSubmission.findUnique).mockResolvedValue({
        id: 'sub-org-beta-999',
        organizationId: 'org-beta',
        assignmentId: 'assign-beta',
        studentId: 'student-beta',
      } as any);

      await expect(loadSubmissionScoped(mockReq, 'sub-org-beta-999')).rejects.toThrow(AccessDeniedError);
    });
  });

  describe('Redis-Backed Sliding Window Rate Limiting (429 & Retry-After)', () => {
    it('should trigger HTTP 429 and Retry-After header on 11th AI generation request within 60s window', async () => {
      const { getRedisClient } = await import('../config/redis');
      const redis = getRedisClient();

      // Mock redis.eval script return values: allowed for first 10, blocked for 11th
      let callCount = 0;
      vi.mocked(redis.eval).mockImplementation(async () => {
        callCount++;
        if (callCount <= 10) {
          return [1, callCount]; // allowed
        }
        return [0, 11]; // blocked
      });

      const mockReq = {
        user: { id: 'user-heavy-generator' },
        ip: '192.168.1.50',
        headers: {},
      } as unknown as Request;

      const setHeaderMock = vi.fn();
      const statusMock = vi.fn().mockReturnThis();
      const jsonMock = vi.fn();

      const mockRes = {
        setHeader: setHeaderMock,
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;

      const nextMock = vi.fn();

      // Simulate 10 successful requests
      for (let i = 0; i < 10; i++) {
        await aiGenerationRateLimiter(mockReq, mockRes, nextMock);
      }
      expect(nextMock).toHaveBeenCalledTimes(10);
      expect(statusMock).not.toHaveBeenCalled();

      // 11th request (should trigger 429)
      await aiGenerationRateLimiter(mockReq, mockRes, nextMock);

      expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', '60');
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          retryAfter: 60,
          error: expect.stringContaining('AI generation rate limit exceeded'),
        })
      );
    });

    it('should trigger HTTP 429 and Retry-After header when Global IP rate limit (60 req/min) is exceeded', async () => {
      const { getRedisClient } = await import('../config/redis');
      const redis = getRedisClient();

      vi.mocked(redis.eval).mockResolvedValue([0, 61]); // Blocked on 61st request

      const mockReq = {
        ip: '203.0.113.195',
        socket: { remoteAddress: '203.0.113.195' },
      } as unknown as Request;

      const setHeaderMock = vi.fn();
      const statusMock = vi.fn().mockReturnThis();
      const jsonMock = vi.fn();

      const mockRes = {
        setHeader: setHeaderMock,
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;

      const nextMock = vi.fn();

      await globalIpRateLimiter(mockReq, mockRes, nextMock);

      expect(setHeaderMock).toHaveBeenCalledWith('Retry-After', '60');
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          retryAfter: 60,
          error: expect.stringContaining('Global IP rate limit exceeded'),
        })
      );
      expect(nextMock).not.toHaveBeenCalled();
    });
  });
});
