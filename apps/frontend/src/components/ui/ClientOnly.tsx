'use client';

import { useMounted } from '@/hooks/useMounted';

type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Renders children only after client mount. Skips SSR output so extension-injected
 * DOM attributes cannot cause hydration mismatches on page content.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useMounted();
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
