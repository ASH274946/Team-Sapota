import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface BM25SearchResult {
  chunk: {
    id: string;
    content: string;
    metadata: any;
    documentId: string;
    document: { filename: string } | null;
  };
  score: number;
}

// PostgreSQL Full-Text Search (FTS) keyword ranking using GIN index & ts_rank_cd cover-density algorithm.
export async function performBM25Search(
  query: string,
  organizationId: string,
  limit = 200
): Promise<BM25SearchResult[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  try {
    // 1. Primary FTS query using websearch_to_tsquery for user query strings (handles operators, exact terms, academic identifiers)
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
        ts_rank_cd(to_tsvector('english', kc."content"), websearch_to_tsquery('english', ${normalizedQuery})) AS "score"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kd."id" = kc."documentId"
      WHERE kd."organizationId" = ${organizationId}
        AND to_tsvector('english', kc."content") @@ websearch_to_tsquery('english', ${normalizedQuery})
      ORDER BY "score" DESC
      LIMIT ${limit}
    `;

    if (rows.length > 0) {
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

    // 2. Fallback to plainto_tsquery if websearch_to_tsquery yielded 0 hits
    const fallbackRows = await prisma.$queryRaw<Array<{
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
        ts_rank_cd(to_tsvector('english', kc."content"), plainto_tsquery('english', ${normalizedQuery})) AS "score"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kd."id" = kc."documentId"
      WHERE kd."organizationId" = ${organizationId}
        AND to_tsvector('english', kc."content") @@ plainto_tsquery('english', ${normalizedQuery})
      ORDER BY "score" DESC
      LIMIT ${limit}
    `;

    return fallbackRows.map((r) => ({
      chunk: {
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        documentId: r.documentId,
        document: r.documentFilename ? { filename: r.documentFilename } : null,
      },
      score: typeof r.score === 'string' ? parseFloat(r.score) : r.score,
    }));
  } catch (error) {
    logger.warn(`Full-text search query failed for query "${normalizedQuery}": ${error}`);
    return [];
  }
}
