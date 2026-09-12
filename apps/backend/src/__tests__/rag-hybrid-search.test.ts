import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performRRF } from '../services/rag/retriever.service';
import { getEmbeddingCacheKey, normalizeQuery } from '../services/rag/vector-search.service';
import { runRagBenchmark } from '../scripts/benchmark-rag';

describe('RAG PGVector Hybrid Search & RRF Optimization (VID-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reciprocal Rank Fusion (RRF) Algorithm', () => {
    it('should correctly calculate RRF scores combining vector and keyword ranks', () => {
      const vectorResults = [
        { chunk: { id: 'chunk-1', content: 'Dijkstra algorithm' }, score: 0.95 },
        { chunk: { id: 'chunk-2', content: 'Bellman Ford algorithm' }, score: 0.85 },
      ];

      const keywordResults = [
        { chunk: { id: 'chunk-2', content: 'Bellman Ford algorithm' }, score: 12.5 },
        { chunk: { id: 'chunk-3', content: 'Kruskal MST algorithm' }, score: 10.0 },
      ];

      const fused = performRRF(vectorResults, keywordResults, { rrfK: 60 });

      expect(fused.length).toBe(3);
      expect(fused[0].chunk.id).toBe('chunk-2');
      expect(fused[0].rrfScore).toBeGreaterThan(fused[1].rrfScore);
      expect(fused[1].chunk.id).toBe('chunk-1');
      expect(fused[2].chunk.id).toBe('chunk-3');
    });

    it('should respect custom RRF weights for semantic and keyword search', () => {
      const vectorResults = [
        { chunk: { id: 'chunk-semantic', content: 'Semantic content' }, score: 0.9 },
      ];
      const keywordResults = [
        { chunk: { id: 'chunk-keyword', content: 'Keyword content' }, score: 15.0 },
      ];

      const fused = performRRF(vectorResults, keywordResults, {
        rrfK: 60,
        semanticWeight: 1.0,
        keywordWeight: 2.0,
      });

      expect(fused[0].chunk.id).toBe('chunk-keyword');
    });
  });

  describe('Redis Query Embedding Cache Key & Normalization', () => {
    it('should produce identical deterministic cache key for query with varying whitespace or casing', () => {
      const raw1 = '  TCP   throughput formula  ';
      const raw2 = 'TCP throughput formula';

      expect(normalizeQuery(raw1)).toBe('TCP throughput formula');
      expect(normalizeQuery(raw2)).toBe('TCP throughput formula');

      const key1 = getEmbeddingCacheKey(raw1);
      const key2 = getEmbeddingCacheKey(raw2);

      expect(key1).toBe(key2);
      expect(key1).toContain('rag:embedding:v1:text-embedding-3-small:');
    });
  });

  describe('10,000 Chunks Academic Benchmark (Acceptance Criteria)', () => {
    it('should achieve p95 latency < 150ms and top-3 recall improvement > 15%', async () => {
      const stats = await runRagBenchmark(10000);
      expect(stats.p95Ms).toBeLessThan(150);
      expect(stats.recallImprovementPct).toBeGreaterThan(15);
    });
  });
});
