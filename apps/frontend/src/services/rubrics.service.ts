import { api } from '@/lib/api';
import type { Rubric, CreateRubricData, UpdateRubricData, ImportRubricData } from '@/types/rubric.types';

export interface RubricListResponse {
  data: Rubric[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function listRubrics(page = 1, limit = 20, search?: string): Promise<RubricListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  const res = await api.get(`/rubrics?${params}`);
  return res.data;
}

export async function getRubric(id: string): Promise<Rubric> {
  const res = await api.get(`/rubrics/${id}`);
  return res.data.data;
}

export async function createRubric(data: CreateRubricData): Promise<Rubric> {
  const res = await api.post('/rubrics', data);
  return res.data.data;
}

export async function updateRubric(id: string, data: UpdateRubricData): Promise<Rubric> {
  const res = await api.put(`/rubrics/${id}`, data);
  return res.data.data;
}

export async function deleteRubric(id: string): Promise<void> {
  await api.delete(`/rubrics/${id}`);
}

export async function duplicateRubric(id: string): Promise<Rubric> {
  const res = await api.post(`/rubrics/${id}/duplicate`);
  return res.data.data;
}

export async function exportRubric(id: string): Promise<Record<string, unknown>> {
  const res = await api.get(`/rubrics/export/${id}`);
  return res.data.data;
}

export async function importRubric(data: ImportRubricData): Promise<Rubric> {
  const res = await api.post('/rubrics/import', data);
  return res.data.data;
}
