import { api } from '@/lib/api';
import type { KnowledgeDocument, DocumentJobStatus } from '@/types/document.types';

export interface DocumentListResponse {
  data: KnowledgeDocument[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listDocuments(page = 1, limit = 20, status?: string): Promise<DocumentListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const res = await api.get(`/documents?${params}`);
  return res.data;
}

export async function getDocument(id: string): Promise<KnowledgeDocument> {
  const res = await api.get(`/documents/${id}`);
  return res.data.data;
}

export async function uploadDocument(file: File): Promise<KnowledgeDocument> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function parseDocument(documentId: string): Promise<{ jobId: string; documentId: string; status: string }> {
  const res = await api.post('/documents/parse', { documentId });
  return res.data.data;
}

export async function processDocument(id: string): Promise<{ jobId: string; documentId: string; status: string }> {
  const res = await api.post(`/documents/${id}/process`);
  return res.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`);
}

export async function checkDocumentJob(id: string, jobId: string): Promise<DocumentJobStatus> {
  const res = await api.get(`/documents/${id}/jobs/${jobId}`);
  return res.data.data;
}
