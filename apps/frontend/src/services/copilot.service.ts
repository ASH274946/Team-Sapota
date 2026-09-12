import { api } from '@/lib/api';

export interface LessonPlanRequest {
  subject: string;
  topic: string;
  duration: number;
  learningOutcomes?: string[];
}

export interface CopilotWorkflowRequest {
  workflowName: string;
  tasks: any[];
}

export interface LessonPlanPdfJobStatus {
  status: 'queued' | 'completed' | 'failed';
  pdfUrl?: string | null;
  error?: string;
}

export const copilotService = {
  getLessonPlans: async () => {
    const response = await api.get('/copilot/lesson-plans');
    return response.data.data;
  },

  generateLessonPlan: async (data: LessonPlanRequest) => {
    const response = await api.post('/copilot/lesson-plan', data);
    return response.data.data;
  },

  deleteLessonPlan: async (id: string) => {
    const response = await api.delete(`/copilot/lesson-plan/${id}`);
    return response.data;
  },

  updateLessonPlan: async (id: string, data: any) => {
    const response = await api.put(`/copilot/lesson-plan/${id}`, data);
    return response.data;
  },

  executeWorkflow: async (data: CopilotWorkflowRequest) => {
    const response = await api.post('/copilot/workflow', data);
    return response.data.data;
  },

  listWorkflows: async () => {
    const response = await api.get('/copilot/workflows');
    return response.data.data;
  },

  /**
   * Enqueue a BullMQ lesson-plan PDF generation job.
   * Returns the jobId to be used for polling.
   */
  requestLessonPlanPdf: async (lessonPlanId: string): Promise<{ jobId: string }> => {
    const response = await api.post(`/lessons/${lessonPlanId}/export-pdf`);
    return response.data.data;
  },

  /**
   * Poll the Redis job result for a lesson plan PDF job.
   */
  pollLessonPlanPdfJob: async (jobId: string): Promise<LessonPlanPdfJobStatus> => {
    const response = await api.get(`/lessons/pdf-job/${jobId}`);
    return response.data.data;
  },

  /**
   * Generate an end-to-end academic test / exam paper with marking scheme.
   */
  generateTestPaper: async (data: {
    subject: string;
    topic: string;
    grade?: string;
    duration?: number;
    totalMarks?: number;
    difficulty?: string;
    customInstructions?: string;
  }) => {
    const response = await api.post('/copilot/test-paper', data);
    return response.data.data;
  },

  /**
   * Get all generated test papers.
   */
  getTestPapers: async () => {
    const response = await api.get('/copilot/test-papers');
    return response.data.data;
  },

  /**
   * Get a single test paper by ID.
   */
  getTestPaperById: async (id: string) => {
    const response = await api.get(`/copilot/test-paper/${id}`);
    return response.data.data;
  },

  /**
   * Delete a test paper.
   */
  deleteTestPaper: async (id: string) => {
    const response = await api.delete(`/copilot/test-paper/${id}`);
    return response.data;
  },
};
