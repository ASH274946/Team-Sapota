import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string | null;
        activeOrganizationId?: string | null;
        departmentId?: string | null;
      };
    }
  }
}

/**
 * Authentication middleware that validates JWT token from Authorization header or cookie.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = '';

    // 1. Extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2. Extract from cookie
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // 3. Extract from query parameter (for direct file downloads/views)
    if (!token && req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Token exists, verify it
    const decodedPayload = verifyAccessToken(token);

    req.user = {
      id: decodedPayload.userId,
      email: decodedPayload.email,
      role: decodedPayload.role,
      organizationId: decodedPayload.organizationId || '00000000-0000-0000-0000-000000000000',
      activeOrganizationId: decodedPayload.activeOrganizationId,
      departmentId: decodedPayload.departmentId,
    };
    return next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: err.message || 'Invalid authentication credentials' });
  }
};

/**
 * Middleware to enforce ownership or admin overrides
 */
export const requireOwnership = (_resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }
    
    // We attach a flag to the request so the controller knows to enforce ownership filtering
    req.body._requireOwnership = true; 
    return next();
  }
};

/**
 * Middleware to enforce organization-level data isolation
 */
export const requireOrganizationScope = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    
    const orgId = req.user.activeOrganizationId || req.user.organizationId;
    if (!orgId) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'User does not belong to an organization' });
    }

    // Attach flag for controllers to filter by organization
    req.body._requireOrganizationScope = orgId;
    return next();
  }
};

/**
 * Middleware to enforce strict role-based access control (RBAC).
 * Allows access if the user's role is in the allowedRoles array or if they are a SUPER_ADMIN.
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    let role = req.user.role.toUpperCase();
    if (role === 'ORG_ADMIN') role = 'ADMIN';
    if (role === 'FACULTY') role = 'TEACHER';

    // Super Admins bypass role restrictions
    if (role === 'SUPER_ADMIN') {
      return next();
    }

    const normalizedAllowedRoles = allowedRoles.map(r => {
      let norm = r.toUpperCase();
      if (norm === 'ORG_ADMIN') norm = 'ADMIN';
      if (norm === 'FACULTY') norm = 'TEACHER';
      return norm;
    });

    if (normalizedAllowedRoles.includes(role)) {
      return next();
    }

    // Role is not authorized
    logger.warn({ userId: req.user.id, role: req.user.role, normalizedRole: role, allowedRoles: normalizedAllowedRoles, url: req.originalUrl }, '[Authorize] Insufficient privileges');
    
    const errorMsg = process.env.NODE_ENV !== 'production' 
      ? `Forbidden: Insufficient privileges (User role '${req.user.role}' does not match required roles: ${allowedRoles.join(', ')})`
      : 'Forbidden: Insufficient privileges';
      
    return res.status(403).json({ success: false, error: errorMsg });
  };
};
