import { apiClient } from './api.client';
import { getApiToken } from '@/lib/api';

export interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  resourceType: string;
  subject?: string;
  className?: string;
  fileUrl: string;
  fileSize?: number;
  uploadedById: string;
  uploadedBy?: { firstName: string; lastName: string };
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export const LibraryService = {
  uploadResource: async (formData: FormData): Promise<LibraryResource> => {
    // Note: apiClient uses axios, so we can post FormData directly
    // Also, normally you might have a different header for multipart/form-data
    // but axios sets it automatically when passing FormData
    const response = await apiClient.post<{ success: boolean; data: LibraryResource }>('/library', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  getResources: async (params?: { subject?: string; className?: string; resourceType?: string; search?: string }): Promise<LibraryResource[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: LibraryResource[] }>('/library', { params });
      if (Array.isArray(response.data?.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data as unknown as LibraryResource[];
      }
      return [];
    } catch (err) {
      console.warn('LibraryService.getResources warning:', err);
      return [];
    }
  },

  updateResource: async (id: string, data: Partial<LibraryResource>): Promise<LibraryResource> => {
    const response = await apiClient.put<{ success: boolean; data: LibraryResource }>(`/library/${id}`, data);
    return response.data.data;
  },

  deleteResource: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/${id}`);
  },

  downloadResource: async (resource: LibraryResource) => {
    if (resource.fileUrl?.startsWith('http://') || resource.fileUrl?.startsWith('https://')) {
      window.open(resource.fileUrl, '_blank');
      return;
    }
    const token = getApiToken();
    const tokenQuery = token ? `?token=${token}` : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.open(`${apiUrl}/library/${resource.id}/download${tokenQuery}`, '_blank');
  },

  viewResource: async (resource: LibraryResource) => {
    if (resource.fileUrl?.startsWith('http://') || resource.fileUrl?.startsWith('https://')) {
      window.open(resource.fileUrl, '_blank');
      return;
    }
    const token = getApiToken();
    const tokenQuery = token ? `?token=${token}` : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.open(`${apiUrl}/library/${resource.id}/view${tokenQuery}`, '_blank');
  },
};
