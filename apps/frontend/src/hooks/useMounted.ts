'use client';

import { useState, useEffect } from 'react';

/** True only after the component has mounted on the client (avoids SSR/client UI drift). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
