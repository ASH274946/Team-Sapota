import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; classrooms: number; assignments: number };
}

interface OrgStore {
  organizations: Organization[];
  currentOrg: Organization | null;
  loading: boolean;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (data: Partial<Organization>) => Promise<boolean>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<boolean>;
  deleteOrganization: (id: string) => Promise<boolean>;
  suspendOrganization: (id: string) => Promise<boolean>;
  setCurrentOrg: (org: Organization | null) => void;
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  organizations: [],
  currentOrg: null,
  loading: false,

  fetchOrganizations: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/v1/super-admin/organizations');
      if (res.data?.success) {
        set({ organizations: res.data.data, loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createOrganization: async (data) => {
    try {
      const res = await api.post('/v1/super-admin/organizations', data);
      if (res.data?.success) {
        await get().fetchOrganizations();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateOrganization: async (id, data) => {
    try {
      const res = await api.put(`/v1/super-admin/organizations/${id}`, data);
      if (res.data?.success) {
        await get().fetchOrganizations();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  deleteOrganization: async (id) => {
    try {
      const res = await api.delete(`/v1/super-admin/organizations/${id}`);
      if (res.data?.success) {
        await get().fetchOrganizations();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  suspendOrganization: async (id) => {
    try {
      const res = await api.post(`/v1/super-admin/organizations/${id}/suspend`);
      if (res.data?.success) {
        await get().fetchOrganizations();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setCurrentOrg: (org) => {
    set({ currentOrg: org });
  },
}));
