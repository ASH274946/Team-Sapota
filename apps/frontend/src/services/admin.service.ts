import { api } from '@/lib/api';

export const adminService = {
  getOverviewMetrics: async () => {
    const response = await api.get('/admin/overview');
    return response.data.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data.data;
  },

  getProviders: async () => {
    const response = await api.get('/admin/providers');
    return response.data.data;
  },
  
  getKnowledgeStats: async () => {
    const response = await api.get('/admin/knowledge/stats');
    return response.data.data;
  }
};
