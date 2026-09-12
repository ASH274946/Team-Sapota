import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// ── General-purpose Redis (caching, sessions, pub/sub) ──

let redisClient: Redis | null = null;

function buildRedisOptions(): RedisOptions {
  const isTls =
    env.REDIS_URL.startsWith('rediss://') || env.REDIS_URL.startsWith('redis+tls://');

  if (isTls && env.NODE_ENV === 'production') {
    logger.warn('[REDIS] TLS certificate validation is disabled (rejectUnauthorized: false) — this is insecure in production');
  }

  return {
    maxRetriesPerRequest: 20,
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis: max reconnection attempts reached');
        return null;
      }
      return Math.min(times * 200, 3_000);
    },
    reconnectOnError: (err: Error) => {
      const shouldReconnect =
        err.message.includes('READONLY') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT');
      return shouldReconnect ? 1 : false;
    },
    ...(isTls
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };
}

export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, buildRedisOptions());

  redisClient.on('connect', () => logger.info('[REDIS] General client connected'));
  redisClient.on('ready', () => logger.info('[REDIS] General client ready'));
  redisClient.on('error', (err: Error) => {
    if (err.message.includes('ECONNREFUSED')) {
      logger.warn('[REDIS] Connection refused — workers will be unavailable');
    } else {
      logger.error(err, '[REDIS] Error');
    }
  });
  redisClient.on('close', () => logger.warn('[REDIS] Connection closed'));
  redisClient.on('reconnecting', (delay: number) =>
    logger.info(`[REDIS] Reconnecting in ${delay}ms...`)
  );

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}

export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready';
}

// ── BullMQ-dedicated Redis (requires TCP-compatible Redis, e.g., Upstack TCP endpoint) ──

let bullRedisClient: Redis | null = null;

/**
 * BullMQ connection — uses REDIS_BULLMQ_URL.
 *
 * REQUIREMENTS:
 * - Must be a TCP-compatible Redis endpoint (redis:// or rediss://)
 * - Upstash REST API does NOT work (no BLPOP support)
 * - Upstash Redis TCP endpoint DOES work — use the UPSTASH_REDIS_URL directly
 * - MaxRetriesPerRequest: null is REQUIRED by BullMQ
 */
function buildBullRedisOptions(): RedisOptions {
  const url = env.REDIS_BULLMQ_URL;
  const isTls = url.startsWith('rediss://') || url.startsWith('redis+tls://');
  const isUpstash = url.includes('.upstash.io');

  if ((isTls || isUpstash) && env.NODE_ENV === 'production') {
    logger.warn('[REDIS:BullMQ] TLS certificate validation is disabled (rejectUnauthorized: false) — this is insecure in production');
  }

  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: true,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      if (times > 20) {
        logger.error('[REDIS:BullMQ] Max reconnection attempts reached');
        return null;
      }
      return Math.min(times * 200, 5_000);
    },
    reconnectOnError: (err: Error) => {
      const shouldReconnect =
        err.message.includes('READONLY') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('CLUSTERDOWN');
      return shouldReconnect ? 2 : false;
    },
    // Upstash TCP connections with TLS require keepalive to avoid idle disconnects
    ...(isTls || isUpstash
      ? {
          tls: {
            rejectUnauthorized: false,
          },
          keepAlive: 30000,
          keepAliveInterval: 15000,
        }
      : {}),
  };
}

export interface BullRedisDiagnostics {
  connected: boolean;
  status: string;
  connectCount: number;
  reconnectCount: number;
  errorCount: number;
  lastError: string | null;
  url: string;
}

const bullRedisDiag: BullRedisDiagnostics = {
  connected: false,
  status: 'initializing',
  connectCount: 0,
  reconnectCount: 0,
  errorCount: 0,
  lastError: null,
  url: 'not-connected',
};

export function getBullRedisDiagnostics(): BullRedisDiagnostics {
  return { ...bullRedisDiag, connected: isBullRedisConnected(), status: bullRedisClient?.status ?? 'disconnected' };
}

export function getBullRedisClient(): Redis {
  if (bullRedisClient) return bullRedisClient;

  const url = env.REDIS_BULLMQ_URL;
  bullRedisDiag.url = url;
  bullRedisClient = new Redis(url, buildBullRedisOptions());

  bullRedisClient.on('connect', () => {
    bullRedisDiag.connectCount++;
    logger.info(`[REDIS:BullMQ] Connected to BullMQ Redis`);
  });
  bullRedisClient.on('ready', () => {
    logger.info('[REDIS:BullMQ] Client ready (blocking commands OK)');
  });
  bullRedisClient.on('error', (err: Error) => {
    bullRedisDiag.errorCount++;
    bullRedisDiag.lastError = err.message;
    if (err.message.includes('ECONNREFUSED')) {
      logger.error(`[REDIS:BullMQ] Connection REFUSED. Workers UNAVAILABLE.`);
    } else {
      logger.error(err, '[REDIS:BullMQ] Error');
    }
  });
  bullRedisClient.on('close', () => logger.warn('[REDIS:BullMQ] Connection closed'));
  bullRedisClient.on('reconnecting', (delay: number) => {
    bullRedisDiag.reconnectCount++;
    logger.info(`[REDIS:BullMQ] Reconnecting in ${delay}ms... (attempt ${bullRedisDiag.reconnectCount})`);
  });

  return bullRedisClient;
}

export async function closeBullRedis(): Promise<void> {
  if (bullRedisClient) {
    try {
      await bullRedisClient.quit();
    } catch {
      bullRedisClient.disconnect();
    } finally {
      bullRedisClient = null;
    }
  }
}

export function isBullRedisConnected(): boolean {
  return bullRedisClient?.status === 'ready';
}
