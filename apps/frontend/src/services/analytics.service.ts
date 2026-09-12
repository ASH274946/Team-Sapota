import { api } from '@/lib/api';
import type { DashboardStats, AssignmentAnalytics, QuizAnalytics, StudentPerformance, TeacherPerformance, UsageStats, AiUsageStats, TrendData } from '@/types/analytics.types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get('/analytics/dashboard');
  return res.data.data;
}

export async function getAssignmentAnalytics(): Promise<AssignmentAnalytics> {
  const res = await api.get('/analytics/assignments');
  return res.data.data;
}

export async function getQuizAnalytics(): Promise<QuizAnalytics> {
  const res = await api.get('/analytics/quizzes');
  return res.data.data;
}

export async function getStudentPerformance(): Promise<StudentPerformance[]> {
  const res = await api.get('/analytics/students');
  return res.data.data;
}

export async function getTeacherPerformance(): Promise<TeacherPerformance[]> {
  const res = await api.get('/analytics/teachers');
  return res.data.data;
}

export async function getUsageStats(): Promise<UsageStats> {
  const res = await api.get('/analytics/usage');
  return res.data.data;
}

export async function getAiUsage(): Promise<AiUsageStats> {
  const res = await api.get('/analytics/ai-usage');
  return res.data.data;
}

export async function getTrends(days = 30): Promise<TrendData> {
  const res = await api.get(`/analytics/trends?days=${days}`);
  return res.data.data;
}

export async function exportAnalytics(type: string): Promise<Blob> {
  const res = await api.get(`/analytics/export/${type}`, { responseType: 'blob' });
  return res.data;
}
