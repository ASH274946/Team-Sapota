import Redis from 'ioredis';
import { logger } from '../utils/logger';

const CHECK_AND_INCR_SCRIPT = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local expiry = tonumber(ARGV[2])
  local current = redis.call("GET", key)
  if current and tonumber(current) >= limit then
    return {0, current}
  end
  local val = redis.call("INCR", key)
  if val == 1 then
    redis.call("EXPIRE", key, expiry)
  end
  return {1, val}
`;

export interface DailyLimitConfig {
  STUDENT_QUIZ_LIMIT: number;
  FACULTY_QUIZ_LIMIT: number;
  TEACHER_PAPER_LIMIT: number;
  TEACHER_ASSIGNMENT_LIMIT: number;
  ADMIN_UNLIMITED: boolean;
}

const DAILY_LIMIT_CONFIG: DailyLimitConfig = {
  STUDENT_QUIZ_LIMIT: 5,           // Students can generate 5 practice quizzes per day
  FACULTY_QUIZ_LIMIT: 10,          // Faculty can generate 10 quizzes per day
  TEACHER_PAPER_LIMIT: 5,          // Teachers can generate 5 question papers per day
  TEACHER_ASSIGNMENT_LIMIT: 5,     // Teachers can create 5 assignments per day
  ADMIN_UNLIMITED: true,           // Admins have unlimited access
};

export interface UsageStats {
  userId: string;
  type: 'quiz' | 'paper' | 'assignment';
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date;
}

export class DailyLimitService {
  private redis: Redis;
  private readonly keyPrefix = 'daily_limit:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Get the daily limit for a user based on their role
   */
  getLimit(role: string, type: 'quiz' | 'paper' | 'assignment'): number {
    // Admins are unlimited
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return DAILY_LIMIT_CONFIG.ADMIN_UNLIMITED ? Infinity : 999;
    }

    if (role === 'TEACHER' || role === 'FACULTY') {
      if (type === 'quiz') return DAILY_LIMIT_CONFIG.FACULTY_QUIZ_LIMIT;
      if (type === 'paper') return DAILY_LIMIT_CONFIG.TEACHER_PAPER_LIMIT;
      if (type === 'assignment') return DAILY_LIMIT_CONFIG.TEACHER_ASSIGNMENT_LIMIT;
    }

    if (role === 'STUDENT') {
      if (type === 'quiz') return DAILY_LIMIT_CONFIG.STUDENT_QUIZ_LIMIT;
    }

    // Default: deny access
    return 0;
  }

  /**
   * Check AND increment usage atomically via Lua script.
   * Replaces the old checkLimit + incrementUsage pattern to eliminate TOCTOU.
   */
  async checkAndIncrement(userId: string, role: string, type: 'quiz' | 'paper' | 'assignment'): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
  }> {
    const limit = this.getLimit(role, type);

    if (limit === Infinity) {
      return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
    }

    if (limit === 0) {
      return { allowed: false, used: 0, limit: 0, remaining: 0 };
    }

    const key = this.getRedisKey(userId, type);
    const result = await this.redis.eval(CHECK_AND_INCR_SCRIPT, 1, key, String(limit), String(86400)) as [number, number];
    const allowed = result[0] === 1;
    const used = result[1];

    return {
      allowed,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  /**
   * Check if user has exceeded daily limit (read-only, no increment).
   */
  async checkLimit(userId: string, role: string, type: 'quiz' | 'paper' | 'assignment'): Promise<{
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
  }> {
    const limit = this.getLimit(role, type);

    if (limit === Infinity) {
      return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
    }

    if (limit === 0) {
      return { allowed: false, used: 0, limit: 0, remaining: 0 };
    }

    const key = this.getRedisKey(userId, type);
    const used = await this.getUsageCount(key);

    return {
      allowed: used < limit,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  /**
   * Increment usage counter (only safe when used with pre-checked limits).
   * Prefer checkAndIncrement for atomic operations.
   */
  async incrementUsage(userId: string, type: 'quiz' | 'paper' | 'assignment'): Promise<number> {
    const key = this.getRedisKey(userId, type);
    const used = await this.redis.incr(key);

    if (used === 1) {
      await this.redis.expire(key, 86400);
    }

    return used;
  }

  /**
   * Get current usage count
   */
  async getUsageCount(userId: string, type: 'quiz' | 'paper' | 'assignment'): Promise<number>;
  async getUsageCount(redisKey: string): Promise<number>;
  async getUsageCount(userIdOrKey: string, type?: 'quiz' | 'paper' | 'assignment'): Promise<number> {
    let key: string;

    if (type) {
      key = this.getRedisKey(userIdOrKey, type);
    } else {
      key = userIdOrKey;
    }

    const count = await this.redis.get(key);
    return parseInt(count || '0', 10);
  }

  /**
   * Get full usage stats for a user
   */
  async getUsageStats(userId: string, role: string): Promise<UsageStats[]> {
    const types: Array<'quiz' | 'paper' | 'assignment'> = ['quiz', 'paper', 'assignment'];
    const stats: UsageStats[] = [];

    for (const type of types) {
      const limit = this.getLimit(role, type);
      if (limit === 0) continue; // Skip types with no permission

      const used = await this.getUsageCount(userId, type);
      const key = this.getRedisKey(userId, type);
      const ttl = await this.redis.ttl(key);

      stats.push({
        userId,
        type,
        limit: limit === Infinity ? 999 : limit,
        used: Math.min(used, limit),
        remaining: limit === Infinity ? 999 : Math.max(0, limit - used),
        resetAt: new Date(Date.now() + (ttl > 0 ? ttl * 1000 : 86400 * 1000)),
      });
    }

    return stats;
  }

  /**
   * Reset usage for a user (admin only)
   */
  async resetUsage(userId: string, type?: 'quiz' | 'paper' | 'assignment'): Promise<void> {
    if (type) {
      const key = this.getRedisKey(userId, type);
      await this.redis.del(key);
    } else {
      // Reset all types for user
      const types: Array<'quiz' | 'paper' | 'assignment'> = ['quiz', 'paper', 'assignment'];
      const keys = types.map((t) => this.getRedisKey(userId, t));
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }

    logger.info({ type }, `[DailyLimit] Reset usage for user ${userId}`);
  }

  /**
   * Get Redis key for user + type combination
   */
  private getRedisKey(userId: string, type: 'quiz' | 'paper' | 'assignment'): string {
    return `${this.keyPrefix}${type}:${userId}`;
  }

  /**
   * Get configuration
   */
  static getConfig(): DailyLimitConfig {
    return DAILY_LIMIT_CONFIG;
  }
}
