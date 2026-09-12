import { api } from '@/lib/api';
import type { GeneratedPaper, GeneratePaperData, GenerationJob, AnswerKey } from '@/types/question-paper.types';

export interface PaperListResponse {
  data: GeneratedPaper[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function generatePaper(data: GeneratePaperData): Promise<{ jobId: string }> {
  const res = await api.post('/question-paper/generate', data);
  return res.data.data;
}

export async function checkGenerationJob(jobId: string): Promise<GenerationJob> {
  const res = await api.get(`/question-paper/generate/${jobId}`);
  return res.data.data;
}

export async function listPapers(page = 1, limit = 20, status?: string): Promise<PaperListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const res = await api.get(`/question-paper?${params}`);
  return res.data;
}

export async function getPaperById(id: string): Promise<GeneratedPaper> {
  const res = await api.get(`/question-paper/${id}`);
  return res.data.data;
}

export async function deletePaper(id: string): Promise<void> {
  await api.delete(`/question-paper/${id}`);
}

export async function publishPaper(id: string): Promise<GeneratedPaper> {
  const res = await api.post(`/question-paper/${id}/publish`);
  return res.data.data;
}

export async function archivePaper(id: string): Promise<GeneratedPaper> {
  const res = await api.post(`/question-paper/${id}/archive`);
  return res.data.data;
}

export async function getPaperDownloadUrl(id: string): Promise<{ url: string }> {
  const res = await api.get(`/question-paper/${id}/download`);
  return res.data.data;
}

export async function getAnswerKey(id: string): Promise<AnswerKey> {
  const res = await api.get(`/question-paper/${id}/answer-key`);
  return res.data.data;
}
