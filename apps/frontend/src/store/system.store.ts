import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from './auth.store';
import { useAdminAuthStore } from './admin-auth.store';

export interface SystemSettings {
  platformName: string;
  brandColor: string;
  logoUrl?: string;
  maintenanceMode: boolean;
  defaultTimezone: string;
  dataRetentionDays: number;
  enableAiAnalytics: boolean;
  notifyApiSpikes: boolean;
  forceMfa: boolean;
}

interface SystemStore {
  settings: SystemSettings | null;
  loading: boolean;
  initialized: boolean;
  fetchSettings: () => Promise<void>;
  updateLocalSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  settings: null,
  loading: false,
  initialized: false,

  fetchSettings: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { isAuthenticated, user } = useAuthStore.getState();

      if (!isAuthenticated) {
        set({ loading: false, initialized: true });
        return;
      }

      let res;
      try {
        if (user?.role === 'SUPER_ADMIN') {
          const { activeOrganizationId } = useAdminAuthStore.getState();
          if (activeOrganizationId) {
            res = await api.get('/admin/organization/settings');
          } else {
            res = await api.get('/super-admin/settings');
          }
        } else if (user?.role === 'ADMIN' || user?.role === 'ORG_ADMIN') {
          res = await api.get('/admin/organization/settings');
        } else {
          // Normal users (students, teachers) don't have a settings endpoint yet.
          // Skip to prevent 403 errors.
          set({ loading: false, initialized: true });
          return;
        }
      } catch (e: any) {
        // Suppress expected authorization or missing scope errors
        if (
          e.message?.includes('Forbidden') ||
          e.message?.includes('403') ||
          e.message?.includes('401') ||
          e.message?.includes('Organization not found') ||
          e.message?.includes('404')
        ) {
          res = null;
        } else {
          throw e;
        }
      }

      if (res?.data?.success) {
        set({ settings: res.data.data, initialized: true });
        
        // Apply CSS variables dynamically based on brand color
        if (typeof window !== 'undefined' && res.data.data.brandColor) {
          document.documentElement.style.setProperty('--brand-color', res.data.data.brandColor);
        }
      }
    } catch (e) {
      console.error('Failed to fetch system settings', e);
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  updateLocalSettings: (newSettings) => {
    const current = get().settings;
    if (current) {
      const updated = { ...current, ...newSettings };
      set({ settings: updated });
      if (typeof window !== 'undefined' && newSettings.brandColor) {
        document.documentElement.style.setProperty('--brand-color', newSettings.brandColor);
      }
    }
  }
}));
