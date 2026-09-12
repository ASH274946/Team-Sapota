import OpenAI from 'openai';
import crypto from 'crypto';
import { env } from '../../config/env';
import prisma from '../../config/prisma';
import { getCached, setCached } from '../../api/common/cache';
import { logger } from '../../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || '' });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

export interface VectorSearchResult {
  chunk: {
    id: string;
    content: string;
    metadata: any;
    documentId: string;
    document: { filename: string } | null;
  };
  score: number;
}

export function normalizeQuery(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function getEmbeddingCacheKey(text: string): string {
  const normalized = normalizeQuery(text);
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return `rag:embedding:v1:${EMBEDDING_MODEL}:${hash}`;
}

// Compute an embedding for the given text using the configured embedding model with 1-hour Redis TTL cache.
export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!env.OPENAI_API_KEY) return null;
  
  const normalized = normalizeQuery(text);
  if (!normalized) return null;

  const cacheKey = getEmbeddingCacheKey(normalized);

  // 1. Try fetching from Redis cache
  try {
    const cached = await getCached<number[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length === EMBEDDING_DIM) {
      return cached;
    }
  } catch (err) {
    logger.warn(`Redis getEmbedding cache lookup failed: ${err}`);
  }

  // 2. Cache miss: generate embedding via OpenAI API
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalized,
    });
    
    const embedding = response.data[0]?.embedding ?? null;

    if (embedding && Array.isArray(embedding) && embedding.length === EMBEDDING_DIM) {
      // 3. Cache embedding in Redis for 1 hour (3600 seconds)
      try {
        await setCached(cacheKey, embedding, 3600);
      } catch (err) {
        logger.warn(`Redis setCached embedding failed: ${err}`);
      }
      return embedding;
    }
    return null;
  } catch (err) {
    logger.error(`OpenAI embedding generation failed: ${err}`);
    return null;
  }
}

// Native pgvector similarity search. Replaces the previous brute-force
// in-JS cosine computation (load ALL chunks then O(N) per query) with a
// single indexed distance query on the `vector` column.
export async function performVectorSearch(
  query: string,
  organizationId: string,
  queryVector?: number[],
  limit = 200,
): Promise<VectorSearchResult[]> {
  if (!env.OPENAI_API_KEY) return [];

  const embedding = queryVector ?? (await getEmbedding(query));
  if (!embedding || embedding.length !== EMBEDDING_DIM) return [];

  // pgvector accepts the text literal `[0.1,0.2,...]`; the value is passed
  // as a bound parameter below (parameterized, not string-concatenated).
  const vectorLiteral = `[${embedding.join(',')}]`;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    content: string;
    metadata: any;
    documentId: string;
    documentFilename: string | null;
    score: number;
  }>>`
    SELECT
      kc."id",
      kc."content",
      kc."metadata",
      kc."documentId",
      kd."filename" AS "documentFilename",
      1 - (kc."vector" <=> ${vectorLiteral}::vector) AS "score"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd."id" = kc."documentId"
    WHERE kd."organizationId" = ${organizationId}
      AND kc."vector" IS NOT NULL
    ORDER BY kc."vector" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    chunk: {
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      documentId: r.documentId,
      document: r.documentFilename ? { filename: r.documentFilename } : null,
    },
    score: typeof r.score === 'string' ? parseFloat(r.score) : r.score,
  }));
}
