import crypto from 'crypto';
import { getRedisClient } from '../../config/redis';

export const CacheTTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  VERY_LONG: 7200,
  DAY: 86400,
} as const;

export const CacheKeys = {
  STUDENT_PROFILE: (id: string) => `profile:student:${id}`,
  TEACHER_CONFIG: (id: string) => `config:teacher:${id}`,
  RUBRIC: (id: string) => `rubric:${id}`,
  QUESTION_BANK: (orgId: string) => `qbank:${orgId}`,
  KNOWLEDGE_META: (docId: string) => `knowledge:meta:${docId}`,
  PROMPT_TEMPLATE: (name: string) => `prompt:template:${name}`,
  MODEL_REGISTRY: `model:registry`,
  SUBJECT_META: (id: string) => `subject:${id}`,
  ANALYTICS: (orgId: string, type: string) => `analytics:${orgId}:${type}`,
  RAG_RESULTS: (query: string) => `rag:${hashQuery(query)}`,
} as const;

function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const raw = await client.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number = CacheTTL.MEDIUM): Promise<void> {
  const client = getRedisClient();
  const serialized = JSON.stringify(value);
  await client.set(key, serialized, 'EX', ttlSeconds);
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const client = getRedisClient();
  await client.del(keys);
}

export async function invalidateByPattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  let cursor = '0';
  do {
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    if (keys.length > 0) {
      await client.del(keys);
    }
    cursor = nextCursor;
  } while (cursor !== '0');
}

export async function getOrSet<T>(
  key: string,
  fetch: () => Promise<T>,
  ttlSeconds: number = CacheTTL.MEDIUM
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;
  const value = await fetch();
  await setCached(key, value, ttlSeconds);
  return value;
}

export function fingerprint(obj: Record<string, unknown>): string {
  const sorted = Object.keys(obj).sort().reduce((acc, k) => {
    acc[k] = obj[k];
    return acc;
  }, {} as Record<string, unknown>);
  return crypto.createHash('md5').update(JSON.stringify(sorted)).digest('hex');
}
