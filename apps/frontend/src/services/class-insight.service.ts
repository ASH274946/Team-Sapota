import { api } from '@/lib/api';

export const classInsightService = {
  getAssignedClasses: async () => {
    const response = await api.get('/insights/classes');
    return response.data.data;
  },

  getDashboardInsights: async (classId: string) => {
    const response = await api.get('/insights/dashboard?classId=' + classId);
    return response.data.data;
  },

  generateProactiveInsights: async (subject: string) => {
    const response = await api.post('/insights/class', { subject });
    return response.data.data;
  },

  listReports: async () => {
    const response = await api.get('/insights/reports');
    return response.data.data;
  },
};

