import { Request, Response, NextFunction } from 'express';
import { normalizeRole } from './request-context';

/**
 * Restrict route to one or more system roles (FACULTY is treated as TEACHER).
 */
export const requireRole = (...allowedRoles: string[]) => {
  const normalizedAllowed = new Set(allowedRoles.map((r) => (r.toUpperCase() === 'FACULTY' ? 'TEACHER' : r.toUpperCase())));

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const role = normalizeRole(req.user.role);
    if (role === 'SUPER_ADMIN' || normalizedAllowed.has(role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'Insufficient role for this action',
    });
  };
};
