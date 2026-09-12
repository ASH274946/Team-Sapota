import { apiClient, deduplicateRequest } from './api.client';
import type { Syllabus, SyllabusTopic, SyllabusListResponse, SyllabusDetailResponse } from '@/types/syllabus.types';

export async function fetchSyllabuses(): Promise<Syllabus[]> {
  const res = await apiClient.get<SyllabusListResponse>('/syllabus');
  return res.data.data;
}

export async function fetchSyllabus(id: string): Promise<Syllabus> {
  return deduplicateRequest(`syllabus-${id}`, async () => {
    const res = await apiClient.get<SyllabusDetailResponse>(`/syllabus/${id}`);
    return res.data.data;
  });
}

export async function createSyllabus(data: { title: string; subject: string; grade: string }): Promise<Syllabus> {
  const res = await apiClient.post<{ success: boolean; data: Syllabus }>('/syllabus', data);
  return res.data.data;
}

export async function updateSyllabus(id: string, data: Partial<Syllabus>): Promise<Syllabus> {
  const res = await apiClient.put<{ success: boolean; data: Syllabus }>(`/syllabus/${id}`, data);
  return res.data.data;
}

export async function deleteSyllabus(id: string): Promise<void> {
  await apiClient.delete(`/syllabus/${id}`);
}

export async function addTopic(syllabusId: string, data: { title: string; duration?: number; description?: string }): Promise<SyllabusTopic> {
  const res = await apiClient.post<{ success: boolean; data: SyllabusTopic }>(`/syllabus/${syllabusId}/topics`, data);
  return res.data.data;
}

export async function updateTopic(syllabusId: string, topicId: string, completed: boolean): Promise<void> {
  await apiClient.patch(`/syllabus/${syllabusId}/topics/${topicId}`, { completed });
}
