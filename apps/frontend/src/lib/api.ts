'use client';

import axios from 'axios';
import { joinUrl, resolveApiOrigin } from '@/utils/url';

const isApiDebugEnabled =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_API_DEBUG === 'true';

function getBaseURL(): string {
  const origin = resolveApiOrigin();
  return origin.endsWith('/api/v1') ? origin : `${origin}/api/v1`;
}

export const api = axios.create({
  withCredentials: true,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-Token',
});

let _accessToken: string | null = null;
export const setApiToken = (token: string | null) => {
  _accessToken = token;
};
export const getApiToken = () => _accessToken;

let csrfPromise: Promise<any> | null = null;
async function ensureCsrfToken() {
  if (typeof document !== 'undefined' && !document.cookie.includes('XSRF-TOKEN=')) {
    if (!csrfPromise) {
      // Make a GET request to obtain the CSRF cookie
      csrfPromise = axios.get(joinUrl(getBaseURL(), '/auth/public-organizations'), { withCredentials: true })
        .catch(() => {}) // Ignore errors, the cookie is set by middleware regardless
        .finally(() => { csrfPromise = null; });
    }
    await csrfPromise;
  }
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}


api.interceptors.request.use(async (config) => {
  config.baseURL = getBaseURL();

  if (typeof document !== 'undefined' && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    await ensureCsrfToken();
    const token = getCsrfTokenFromCookie();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }

  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }


  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  const endpoint = config.url ?? '';
  const finalURL = config.baseURL ? joinUrl(config.baseURL, endpoint) : endpoint;
  (config as typeof config & { metadata?: { startedAt: number } }).metadata = {
    startedAt: Date.now(),
  };

  if (isApiDebugEnabled) {
    console.log('[API REQUEST]', {
      method: config.method?.toUpperCase() ?? 'GET',
      baseURL: config.baseURL,
      endpoint,
      finalURL,
    });
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (isApiDebugEnabled) {
      const startedAt = (
        response.config as typeof response.config & { metadata?: { startedAt?: number } }
      ).metadata?.startedAt;
      const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
      console.log('[API RESPONSE]', {
        method: response.config.method?.toUpperCase() ?? 'GET',
        status: response.status,
        url: response.config.url,
        durationMs,
      });
    }
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const backendMessage =
        (error.response?.data as { error?: string; message?: string } | undefined)?.error ??
        (error.response?.data as { error?: string; message?: string } | undefined)?.message;
      let message = backendMessage ?? error.message ?? 'An unexpected error occurred';

      if (error.code === 'ERR_NETWORK' || message === 'Network Error') {
        message = 'Server unavailable. Please check your internet connection or try again later.';
      }

      if (isApiDebugEnabled) {
        // Suppress expected 401 errors for auth/refresh (when user is simply not logged in)
        const isExpectedAuthCheckError = status === 401 && error.config?.url?.includes('/auth/refresh');
        
        if (!isExpectedAuthCheckError) {
          console.warn('[API ERROR]', {
            status,
            method: error.config?.method?.toUpperCase(),
            baseURL: error.config?.baseURL,
            endpoint: error.config?.url,
            finalURL:
              error.config?.baseURL && error.config?.url
                ? joinUrl(error.config.baseURL, error.config.url)
                : error.config?.url,
            code: error.code,
            message: error.message,
            response: error.response?.data,
          });
        }
      }

      const originalRequest = error.config;

      // Handle unauthorized errors automatically with token refresh
      if (status === 401 && originalRequest && !originalRequest.url?.includes('/auth/refresh') && !originalRequest.url?.includes('/auth/login')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await ensureCsrfToken();
            // Attempt to refresh the token using a clean axios instance to avoid interceptor loops
            const refreshUrl = originalRequest.baseURL ? joinUrl(originalRequest.baseURL, '/auth/refresh') : '/auth/refresh';
            const csrfToken = getCsrfTokenFromCookie();
            const res = await axios.post(refreshUrl, {}, { 
              withCredentials: true,
              headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
              xsrfCookieName: 'XSRF-TOKEN',
              xsrfHeaderName: 'X-CSRF-Token',
            });
            const token = res.data?.data?.accessToken;
            
            if (token) {
              setApiToken(token);
              const { useAuthStore } = await import('@/store/auth.store');
              const user = useAuthStore.getState().user;
              if (user) {
                useAuthStore.getState().setAuth(user, token);
              }
              
              processQueue(null, token);
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            } else {
              throw new Error('No access token returned from refresh');
            }
            } catch (refreshError) {
            processQueue(refreshError, null);
            try {
              const { useAuthStore } = await import('@/store/auth.store');
              useAuthStore.getState().clearAuth();
            } catch {
              // ignore
            }
            if (typeof window !== 'undefined') {
              const publicPaths = ['/login', '/register', '/forgot-password', '/'];
              if (!publicPaths.includes(window.location.pathname)) {
                window.location.href = '/login';
              }
            }
            return Promise.reject(new Error('Session expired. Please log in again.'));
          } finally {
            isRefreshing = false;
          }
        } else {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
      } else if (status === 401) {
        // If the refresh token itself expired or failed, clear auth
        try {
          const { useAuthStore } = await import('@/store/auth.store');
          useAuthStore.getState().clearAuth();
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          const publicPaths = ['/login', '/register', '/forgot-password', '/'];
          if (!publicPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
      }

      return Promise.reject(new Error(message));
    }

    if (isApiDebugEnabled) {
      console.warn('[API ERROR]', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return Promise.reject(error);
  }
);

export function getApiOrigin(): string {
  return resolveApiOrigin();
}

export function getApiBaseUrl(): string {
  return getBaseURL();
}
