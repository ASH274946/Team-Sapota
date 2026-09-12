import type { Request } from 'express';

export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'FACULTY' | 'STUDENT';

/** Normalize role aliases used in JWT / frontend to permission keys. */
export function normalizeRole(role: string | undefined | null): string {
  if (!role) return '';
  const upper = role.toUpperCase();
  if (upper === 'FACULTY') return 'TEACHER';
  if (upper === 'ORG_ADMIN') return 'ADMIN';
  return upper;
}

export function getRequestUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) throw new Error('Authentication required');
  return userId;
}

export function getRequestOrgId(req: Request): string | undefined {
  if (req.user?.role === 'SUPER_ADMIN') {
    return (
      (req.body?._requireOrganizationScope as string | undefined) ||
      req.user?.activeOrganizationId ||
      req.user?.organizationId ||
      undefined
    );
  }
  return req.user?.organizationId || req.user?.activeOrganizationId || undefined;
}

export function requireRequestOrgId(req: Request): string {
  const orgId = getRequestOrgId(req);
  if (!orgId) throw new Error('Organization scope required');
  return orgId;
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'SUPER_ADMIN';
}

export function isAdminRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === 'SUPER_ADMIN' || r === 'ADMIN';
}

export function isFacultyRole(role: string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === 'TEACHER';
}

export function isStudentRole(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'STUDENT';
}
