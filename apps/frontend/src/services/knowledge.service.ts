import { api } from '@/lib/api';
import type { KnowledgeQualityScore, KnowledgeEvaluationJob, ChunkQualityMetrics, QualityReport } from '@/types/knowledge.types';

export interface QualityScoreListResponse {
  data: KnowledgeQualityScore[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function getQualityScores(page = 1, limit = 20, minScore?: number, maxScore?: number): Promise<QualityScoreListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (minScore !== undefined) params.set('minScore', String(minScore));
  if (maxScore !== undefined) params.set('maxScore', String(maxScore));
  const res = await api.get(`/knowledge/quality?${params}`);
  return res.data;
}

export async function getDocumentQuality(documentId: string): Promise<KnowledgeQualityScore[]> {
  const res = await api.get(`/knowledge/quality/${documentId}`);
  return res.data.data;
}

export async function triggerEvaluation(documentId?: string, organizationId?: string): Promise<{ evaluated: number; chunks: any[] }> {
  const res = await api.post('/knowledge/evaluate', { documentId, organizationId });
  return res.data.data;
}

export async function checkEvaluationJob(jobId: string): Promise<KnowledgeEvaluationJob> {
  const res = await api.get(`/knowledge/evaluate/${jobId}`);
  return res.data.data;
}

export async function getChunkQuality(chunkId: string): Promise<ChunkQualityMetrics> {
  const res = await api.get(`/knowledge/chunks/${chunkId}/quality`);
  return res.data.data;
}

export async function generateQualityReport(): Promise<QualityReport> {
  const res = await api.get('/knowledge/reports');
  return res.data.data;
}
