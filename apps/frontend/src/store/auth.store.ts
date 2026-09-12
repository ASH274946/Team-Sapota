import { create } from 'zustand';
import { api, setApiToken } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  organizationId: string | null;
  activeOrganizationId?: string | null;
  organizationName: string | null;
  organizationCode?: string | null;
  departmentName: string | null;
  departmentId: string | null;
  forcePasswordReset?: boolean;
  preferences: {
    emailNotifications?: boolean;
    inAppAlerts?: boolean;
    autoSave?: boolean;
    weeklyDigest?: boolean;
    [key: string]: any;
  };
  hasCompletedOnboarding?: boolean;
}

export const hasRole = (userRole: string | undefined, requiredRoles: string[]): boolean => {
  if (!userRole) return false;
  let normalized = userRole.toUpperCase();
  if (normalized === 'ORG_ADMIN') normalized = 'ADMIN';
  if (normalized === 'FACULTY') normalized = 'TEACHER';
  
  if (normalized === 'SUPER_ADMIN') return true;
  
  const normalizedRequired = requiredRoles.map(r => {
    let n = r.toUpperCase();
    if (n === 'ORG_ADMIN') n = 'ADMIN';
    if (n === 'FACULTY') n = 'TEACHER';
    return n;
  });
  
  return normalizedRequired.includes(normalized);
};

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (roles: string[]) => boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initialize: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, token: string, role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN') => Promise<{ success: boolean; error?: string }>;
  ssoLogin: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    provider: string;
    token?: string;
    role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
    isSignUp?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (data: {
    token: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
    isSignUp?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'TEACHER';
    organizationId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  updateOrganization: (data: { organizationName: string; department: string; academicYear?: string }) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: {
    firstName: string;
    lastName: string;
    organizationName: string;
    department: string;
    className: string;
    subject: string;
    students: Array<{ name: string; rollNo: string; email: string }>;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  hasPermission: (roles: string[]) => {
    const user = get().user;
    return hasRole(user?.role, roles);
  },

  setAuth: (user, token) => {
    setApiToken(token);
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    setApiToken(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    try {
      if (!get().isAuthenticated) {
        set({ isLoading: true });
      }

      // Check active Supabase session
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = session.user;
          setApiToken(session.access_token);

          // Fetch full backend profile to retrieve persistent avatar & preferences from DB
          try {
            const meRes = await api.get('/auth/me');
            if (meRes.data?.data) {
              set({
                user: meRes.data.data,
                accessToken: session.access_token,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            }
          } catch {
            // If backend /auth/me fails, fallback to session metadata
          }

          const userObj: User = {
            id: u.id,
            email: u.email || '',
            firstName: u.user_metadata?.first_name || u.user_metadata?.full_name?.split(' ')[0] || 'User',
            lastName: u.user_metadata?.last_name || u.user_metadata?.full_name?.split(' ')[1] || 'Account',
            role: (u.user_metadata?.role as string) || 'STUDENT',
            avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
            avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
            organizationId: null,
            organizationName: null,
            departmentId: null,
            departmentName: null,
            preferences: {},
            hasCompletedOnboarding: false,
          };
          set({
            user: userObj,
            accessToken: session.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      } catch (sbErr) {
        // Continue to backend refresh check
      }

      const refreshRes = await api.post('/auth/refresh');
      const token = refreshRes.data?.data?.accessToken;

      if (token) {
        setApiToken(token);
        set({ accessToken: token });
        const meRes = await api.get('/auth/me');
        const user = meRes.data?.data;

        if (user) {
          set({
            user,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      }
      if (!get().isAuthenticated) get().clearAuth();
      else set({ isLoading: false });
      return false;
    } catch (err) {
      if (!get().isAuthenticated) get().clearAuth();
      else set({ isLoading: false });
      return false;
    }
  },

  signInWithOtp: async (email: string) => {
    try {
      set({ isLoading: true });
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      set({ isLoading: false });
      if (error) {
        if (error.status === 500 || error.message?.includes('500') || error.message?.includes('magic link')) {
          return {
            success: false,
            error: 'Custom SMTP Error: Your SMTP credentials in the Supabase Dashboard are invalid or failing. Please verify your SMTP Host, Port, Username, and App Password.',
          };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Failed to send OTP code.' };
    }
  },

  verifyOtp: async (email: string, token: string, role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN') => {
    try {
      set({ isLoading: true });
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        set({ isLoading: false });
        return { success: false, error: error.message };
      }

      if (data?.session && data?.user) {
        try {
          await get().ssoLogin({
            email: data.user.email || email,
            firstName: data.user.user_metadata?.first_name || 'User',
            lastName: data.user.user_metadata?.last_name || 'Account',
            provider: 'supabase_otp',
            token: data.session.access_token,
            role: role || 'STUDENT',
            isSignUp: true,
          });
        } catch {
          const userObj: User = {
            id: data.user.id,
            email: data.user.email || email,
            firstName: data.user.user_metadata?.first_name || 'User',
            lastName: data.user.user_metadata?.last_name || 'Account',
            role: role || 'STUDENT',
            organizationId: null,
            organizationName: null,
            departmentId: null,
            departmentName: null,
            preferences: {},
            hasCompletedOnboarding: false,
          };
          get().setAuth(userObj, data.session.access_token);
        }
        set({ isLoading: false });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Verification failed.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'OTP Verification failed.' };
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data?.data || {};
      if (accessToken && user) {
        setApiToken(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'Invalid response from auth server.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Login failed.' };
    }
  },

  ssoLogin: async (data) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/sso', data);
      const { accessToken, user } = res.data?.data || {};
      if (accessToken && user) {
        setApiToken(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'Invalid response from auth server.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'SSO Login failed.' };
    }
  },

  googleLogin: async (data) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/google', data);
      const { accessToken, user } = res.data?.data || {};
      if (accessToken && user) {
        setApiToken(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'Invalid response from auth server.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Google Login failed.' };
    }
  },

  signup: async (data) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/auth/signup', data);
      const { accessToken, user } = res.data?.data || {};
      if (accessToken && user) {
        setApiToken(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, error: 'Invalid response from auth server.' };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: err.message || 'Signup failed.' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore failures on logout endpoint and proceed to clear client auth
    } finally {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (e) {}
      get().clearAuth();
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await api.put('/auth/me/profile', data);
      const updatedUser = res.data?.data;
      if (updatedUser) {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Profile update failed.' };
    }
  },

  updateOrganization: async (data) => {
    try {
      const res = await api.put('/auth/me/organization', data);
      if (res.data?.success) {
        const meRes = await api.get('/auth/me');
        const user = meRes.data?.data;
        if (user) {
          set({ user });
        }
        return { success: true };
      }
      return { success: false, error: 'Failed to update organization settings.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Organization update failed.' };
    }
  },

  completeOnboarding: async (data) => {
    try {
      await api.put('/auth/me/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
      });

      const orgRes = await api.put('/auth/me/organization', {
        organizationName: data.organizationName,
        department: data.department,
        academicYear: '2026-2027',
      });

      if (orgRes.data?.data?.accessToken) {
        setApiToken(orgRes.data.data.accessToken);
      }

      const groupRes = await api.post('/groups', {
        name: data.className,
        subject: data.subject,
      });
      const group = groupRes.data?.data;

      if (group?.id && data.students.length > 0) {
        await api.post(`/groups/${group.id}/students/bulk`, {
          students: data.students,
        });
      }

      await api.post('/auth/onboarding/complete');

      const meRes = await api.get('/auth/me');
      const user = meRes.data?.data;
      if (user) {
        set({ user });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Onboarding failed.' };
    }
  },
}));
