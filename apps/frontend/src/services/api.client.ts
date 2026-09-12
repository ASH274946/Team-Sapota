import { api as apiClient } from '@/lib/api';

const inFlightRequests = new Map<string, Promise<unknown>>();

export { apiClient };

export function deduplicateRequest<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
}
