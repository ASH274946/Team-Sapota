import { api } from '@/lib/api';
import type {
  QuizSession, CreateQuizSessionData, UpdateQuizSessionData,
  GenerateQuizData, ShareQuizData, SharedQuiz,
  AdaptiveQuizStartData, AdaptiveQuizNextData, AdaptiveQuizCompleteData,
  QuizHistory,
} from '@/types/quiz.types';

export async function generateQuiz(data: GenerateQuizData): Promise<QuizSession> {
  const res = await api.post('/quizzes/generate', data);
  return res.data.data;
}

export async function listSessions(page = 1, limit = 10): Promise<{ data: QuizSession[]; pagination: any }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await api.get(`/quizzes/sessions?${params}`);
  return res.data;
}

export async function createSession(data: CreateQuizSessionData): Promise<QuizSession> {
  const res = await api.post('/quizzes/sessions', data);
  return res.data.data;
}

export async function getSession(id: string): Promise<QuizSession> {
  const res = await api.get(`/quizzes/sessions/${id}`);
  return res.data.data;
}

export async function updateSession(id: string, data: UpdateQuizSessionData): Promise<QuizSession> {
  const res = await api.put(`/quizzes/sessions/${id}`, data);
  return res.data.data;
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/quizzes/sessions/${id}`);
}

export async function getHistory(): Promise<QuizHistory[]> {
  const res = await api.get('/quizzes/history');
  return res.data.data;
}

export async function clearHistory(): Promise<void> {
  await api.delete('/quizzes/history');
}

export async function shareQuiz(data: ShareQuizData): Promise<SharedQuiz> {
  const res = await api.post('/quizzes/share', data);
  return res.data.data;
}

export async function getSharedQuiz(id: string): Promise<SharedQuiz> {
  const res = await api.get(`/quizzes/shared/${id}`);
  return res.data.data;
}

export async function startAdaptiveQuiz(data: AdaptiveQuizStartData): Promise<QuizSession> {
  const res = await api.post('/quizzes/adaptive/start', data);
  return res.data.data;
}

export async function getNextAdaptiveQuestion(data: AdaptiveQuizNextData): Promise<QuizSession> {
  const res = await api.post('/quizzes/adaptive/next', data);
  return res.data.data;
}

export async function completeAdaptiveQuiz(data: AdaptiveQuizCompleteData): Promise<QuizSession> {
  const res = await api.post('/quizzes/adaptive/complete', data);
  return res.data.data;
}
