import { performVectorSearch, getEmbedding } from './vector-search.service';
import { performBM25Search } from './bm25.service';
import { expandContextWithGraph } from './graph-traversal.service';
import { buildContextString } from './context-builder.service';
import { logger } from '../../utils/logger';
import { getOrSet, CacheTTL } from '../../api/common/cache';
import crypto from 'crypto';

export interface RrfOptions {
  rrfK?: number;
  semanticWeight?: number;
  keywordWeight?: number;
}

export interface RagSourceCitation {
  chunkId: string;
  documentId: string;
  filename: string;
  topic?: string;
  subject?: string;
  chunkType?: string;
  excerpt: string;
  score: number;
}

interface FusedRetrievalResult {
  context: string;
  sources: RagSourceCitation[];
}

function hashQuery(query: string): string {
  return crypto.createHash('sha256').update(query.trim().toLowerCase()).digest('hex').substring(0, 16);
}

// Reciprocal Rank Fusion (RRF) algorithm merging vector similarity and full-text keyword ranks
export function performRRF(
  vectorResults: Array<{ chunk: any; score: number }>,
  keywordResults: Array<{ chunk: any; score: number }>,
  options: RrfOptions = {}
): Array<{ chunk: any; rrfScore: number }> {
  const rrfK = options.rrfK ?? 60;
  const semanticWeight = options.semanticWeight ?? 1.0;
  const keywordWeight = options.keywordWeight ?? 1.0;

  const scoreMap = new Map<string, { chunk: any; rrfScore: number }>();

  // 1. Process Semantic Vector Search Ranks (1-indexed)
  vectorResults.forEach((v, index) => {
    const rank = index + 1;
    const rrfContribution = semanticWeight / (rrfK + rank);
    const existing = scoreMap.get(v.chunk.id);
    if (existing) {
      existing.rrfScore += rrfContribution;
    } else {
      scoreMap.set(v.chunk.id, { chunk: v.chunk, rrfScore: rrfContribution });
    }
  });

  // 2. Process Full-Text Keyword Search Ranks (1-indexed)
  keywordResults.forEach((k, index) => {
    const rank = index + 1;
    const rrfContribution = keywordWeight / (rrfK + rank);
    const existing = scoreMap.get(k.chunk.id);
    if (existing) {
      existing.rrfScore += rrfContribution;
    } else {
      scoreMap.set(k.chunk.id, { chunk: k.chunk, rrfScore: rrfContribution });
    }
  });

  // 3. Sort merged candidates by RRF score descending
  return Array.from(scoreMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);
}

async function fuseAndBuildContext(
  query: string,
  organizationId: string,
  limit: number
): Promise<FusedRetrievalResult> {
  const queryVector = await getEmbedding(query);

  const candidateLimit = Math.max(limit * 10, 50);
  const [vectorResults, bm25Results] = await Promise.all([
    queryVector ? performVectorSearch(query, organizationId, queryVector, candidateLimit) : Promise.resolve([]),
    performBM25Search(query, organizationId, candidateLimit),
  ]);

  const fusedResults = performRRF(vectorResults, bm25Results).slice(0, limit);

  if (fusedResults.length === 0) {
    return { context: '', sources: [] };
  }

  const topChunkIds = fusedResults.map((r) => r.chunk.id);
  const expandedChunks = await expandContextWithGraph(topChunkIds);
  const finalContext = buildContextString(expandedChunks);

  const sources: RagSourceCitation[] = fusedResults.map(({ chunk, rrfScore }) => {
    const metadata = (chunk.metadata ?? {}) as Record<string, unknown>;
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      filename: chunk.document?.filename ?? 'Institution document',
      topic: typeof metadata.topic === 'string' ? metadata.topic : undefined,
      subject: typeof metadata.subject === 'string' ? metadata.subject : undefined,
      chunkType: typeof metadata.chunkType === 'string' ? metadata.chunkType : undefined,
      excerpt: String(chunk.content ?? '').slice(0, 180),
      score: rrfScore,
    };
  });

  return { context: finalContext, sources };
}

export async function advancedRetrieveContext(query: string, organizationId: string, limit = 5): Promise<string> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}`;
  try {
    return await getOrSet(cacheKey, async () => {
      const { context } = await fuseAndBuildContext(query, organizationId, limit);
      return context;
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in advancedRetrieveContext: ${error}`);
    return '';
  }
}

export async function retrieveContextWithSources(
  query: string,
  organizationId: string,
  limit = 5
): Promise<FusedRetrievalResult> {
  const cacheKey = `rag:${organizationId}:${hashQuery(query)}:sources`;
  try {
    return await getOrSet(cacheKey, async () => {
      return fuseAndBuildContext(query, organizationId, limit);
    }, CacheTTL.SHORT);
  } catch (error) {
    logger.error(`Error in retrieveContextWithSources: ${error}`);
    return { context: '', sources: [] };
  }
}
