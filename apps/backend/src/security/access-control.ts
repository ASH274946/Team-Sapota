import { Request, Response, NextFunction } from 'express';
import { Permission } from './permissions';
import { hasPermission } from './roles';

/**
 * Middleware to enforce granular RBAC permissions.
 * Fails with 403 FORBIDDEN if the user's role lacks the specified permission.
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
      requiredPermission: permission,
    });
  };
};

/**
 * Validates ownership of a specific resource.
 * If the user is an ADMIN or SUPER_ADMIN, they can bypass ownership checks.
 * Otherwise, it validates that req.user.id matches the owner field of the resource.
 */
export const validateOwnership = (resourceOwnerId: string | null | undefined, userId: string, role: string): boolean => {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
  if (!resourceOwnerId) return false;
  return resourceOwnerId === userId;
};

/**
 * Validates organization scope.
 * If the user is a SUPER_ADMIN, they can access any organization.
 * Otherwise, the resource's organizationId must match the user's organizationId.
 */
export const validateOrganizationScope = (resourceOrganizationId: string | null | undefined, userOrganizationId: string | null | undefined, role: string): boolean => {
  if (role === 'SUPER_ADMIN') return true;
  if (!resourceOrganizationId || !userOrganizationId) return false;
  return resourceOrganizationId === userOrganizationId;
};
