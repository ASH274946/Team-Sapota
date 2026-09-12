import { api } from '@/lib/api';

export const learningService = {
  getStudentProfile: async (studentId: string) => {
    const response = await api.get(`/learning/students/${studentId}/profile`);
    return response.data.data;
  },

  getStudyPlan: async (studentId: string) => {
    const response = await api.get(`/learning/students/${studentId}/study-plan`);
    return response.data.data;
  },
};
