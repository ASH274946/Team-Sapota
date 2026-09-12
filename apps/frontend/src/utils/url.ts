import { DEFAULT_API_ORIGIN, PUBLIC_API_URL, PUBLIC_SOCKET_URL } from '@/config/public-env';

function isLocalDevHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function normalizeEnvUrl(raw: string | undefined): string | undefined {
  if (!raw || raw === 'undefined' || !raw.trim()) return undefined;
  return normalizeBaseUrl(raw.trim());
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function normalizeBaseUrl(value: string): string {
  let normalized = value.trim().replace(/\/+$/, '');
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
}

/**
 * API origin (no /api suffix).
 * Uses literal NEXT_PUBLIC_* inlining via public-env.ts — never dynamic process.env[key].
 */
export function resolveApiOrigin(): string {
  const fromEnv = normalizeEnvUrl(PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (!isLocalDevHost(hostname)) {
      return normalizeBaseUrl(origin);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    const localFallback = `http://localhost:3001/api/v1`;
    console.info('[VidyaAI] No API origin configured — using local fallback:', localFallback);
    return localFallback;
  }

  return DEFAULT_API_ORIGIN;
}

export function resolveSocketUrl(): string {
  const fromEnv =
    normalizeEnvUrl(PUBLIC_SOCKET_URL) ?? normalizeEnvUrl(PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (!isLocalDevHost(hostname)) {
      return normalizeBaseUrl(origin);
    }
  }

  return DEFAULT_API_ORIGIN;
}

export function resolveAssetUrl(path: string, apiOrigin?: string): string {
  const origin = apiOrigin ?? resolveApiOrigin();
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (isLocalDevHost(url.hostname)) {
        return joinUrl(origin, url.pathname + url.search);
      }
    } catch {
      return path;
    }
    return path;
  }
  return joinUrl(origin, path);
}
