import { apiClient, deduplicateRequest } from './api.client';
import axios from 'axios';
import type { Assignment, CanonicalGenerationState } from '../types/assignment.types';
import type { CreateAssignmentFormValues } from '../schemas/create-assignment.schema';

export interface AssignmentListResponse {
  data: Assignment[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function fetchAssignments(
  page = 1,
  limit = 10,
  status?: string
): Promise<AssignmentListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const endpoint = `/assignments?${params}`;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await apiClient.get<AssignmentListResponse>(endpoint, { timeout: 30000 });
      return res.data;
    } catch (error) {
      const isLast = attempt === maxAttempts;
      const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
      const isRetriable = statusCode === undefined || statusCode >= 500;

      if (isLast || !isRetriable) {
        throw error;
      }

      const delayMs = 1000 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Failed to load assignments');
}

export async function fetchAssignment(id: string): Promise<Assignment> {
  return deduplicateRequest(`fetch-assignment-${id}`, async () => {
    const res = await apiClient.get<{ data: { assignment: Assignment; generationState?: CanonicalGenerationState } }>(`/assignments/${id}`);
    (res.data.data.assignment as Assignment & { generationState?: CanonicalGenerationState }).generationState = res.data.data.generationState;
    return res.data.data.assignment;
  });
}

export async function createAssignment(
  data: CreateAssignmentFormValues & { typeBreakdown?: string },
  files: File[]
): Promise<{ assignment: Assignment; jobId: string; position?: number; jobRecordId?: string; generationSeq?: number }> {
  const formData = new FormData();

  formData.append('title', data.title);
  formData.append('subject', data.subject);
  formData.append('description', data.description ?? '');
  formData.append('dueDate', data.dueDate);
  formData.append('duration', String(data.duration));
  formData.append('totalMarks', String(data.totalMarks));
  formData.append('questionConfig', JSON.stringify(data.questionConfig));
  formData.append('additionalInstructions', data.additionalInstructions ?? '');
  if (data.typeBreakdown) {
    formData.append('typeBreakdown', data.typeBreakdown);
  }

  files.forEach((file) => formData.append('files', file));

  const res = await apiClient.post<{ data: { assignment: Assignment; jobId: string; position?: number; jobRecordId?: string; generationSeq?: number } }>(
    '/assignments',
    formData,
  );
  return res.data.data;
}

export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete(`/assignments/${id}`);
}

export async function generateAssignment(id: string, force = false): Promise<{ jobId: string; position: number; jobRecordId: string; generationSeq: number }> {
  const endpoint = `/assignments/${id}/generate${force ? '?force=true' : ''}`;
  const res = await apiClient.post<{ data: { jobId: string; position: number; jobRecordId: string; generationSeq: number } }>(endpoint);
  return res.data.data;
}

export interface JobStatusResponse {
  status: string;
  progress: number;
  error?: string | null;
  jobRecordId?: string | null;
  generationSeq?: number;
  version?: number;
  paperId?: string | null;
  ts?: number;
  stage?: string;
  generatedQuestions?: number;
  requestedQuestions?: number;
  generatedMarks?: number;
  requestedMarks?: number;
  completionPercentage?: number;
  answerKeyReady?: boolean;
  pdfReady?: boolean;
  generationStatus?: string;
}

export async function fetchJobStatus(id: string): Promise<JobStatusResponse | null> {
  return deduplicateRequest(`job-status-${id}`, async () => {
    const res = await apiClient.get<{ success: boolean; data: JobStatusResponse }>(`/papers/job/${id}`);
    return res.data.data;
  });
}

export async function fetchAssignmentHistory(assignmentId: string): Promise<any[]> {
  try {
    const res = await apiClient.get<{ data: { papers: any[] } }>(`/assignments/${assignmentId}/history`);
    return res.data.data.papers;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || 'Failed to fetch assignment history');
  }
}
