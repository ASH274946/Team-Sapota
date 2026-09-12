'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

/**
 * A wrapper component that conditionally renders its children based on the current user's role.
 * 
 * @example
 * <RoleGate allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
 *   <button>Approve</button>
 * </RoleGate>
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  if (hasPermission(allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
