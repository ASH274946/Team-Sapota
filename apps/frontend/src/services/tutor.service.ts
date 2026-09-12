import { api } from '@/lib/api';
import type { TutorSession, TutorSessionDetail, ChatResponse, TutorConfig } from '@/types/tutor.types';

export async function createSession(data: { subject: string; tutorMode?: string }): Promise<TutorSession> {
  const res = await api.post('/tutor/sessions', data);
  return res.data.data;
}

export async function listSessions(): Promise<TutorSession[]> {
  const res = await api.get('/tutor/sessions');
  return res.data.data || res.data.data?.data || [];
}

export async function getSession(sessionId: string): Promise<TutorSessionDetail> {
  const res = await api.get(`/tutor/sessions/${sessionId}`);
  return res.data.data;
}

export async function sendChatMessage(sessionId: string, message: string, mode?: string): Promise<ChatResponse> {
  const res = await api.post(`/tutor/sessions/${sessionId}/chat`, { message, mode });
  return res.data.data;
}

export async function closeSession(sessionId: string): Promise<void> {
  await api.patch(`/tutor/sessions/${sessionId}/close`);
}

export async function restartSession(sessionId: string): Promise<void> {
  await api.patch(`/tutor/sessions/${sessionId}/restart`);
}

export async function generateFlashcards(sessionId: string): Promise<{ front: string; back: string }[]> {
  const res = await api.get(`/tutor/sessions/${sessionId}/flashcards`);
  return res.data.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/tutor/sessions/${sessionId}`);
}

export async function renameSession(sessionId: string, title: string): Promise<void> {
  await api.patch(`/tutor/sessions/${sessionId}/title`, { title });
}

export async function getTutorConfig(): Promise<TutorConfig> {
  const res = await api.get('/tutor/config');
  return res.data.data;
}

export async function updateTutorConfig(data: { allowDirectAnswers?: boolean; maxExplanationDepth?: number }): Promise<TutorConfig> {
  const res = await api.put('/tutor/config', data);
  return res.data.data;
}
