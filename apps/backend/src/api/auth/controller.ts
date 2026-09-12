import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/prisma';
import { getRedisClient } from '../../config/redis';
import { logger } from '../../utils/logger';
import { AuditService } from '../../services/audit.service';
import {
  hashPassword,
  verifyPassword,
  createRefreshToken,
  generateAccessToken,
  rotateRefreshToken,
  revokeSession,
} from '../../services/auth.service';
import { validateInvitationToken } from '../../services/invitation.service';
import { sendSuccess, sendCreated, sendError, sendUnauthorized, sendNotFound, sendBadRequest, sendConflict, sendForbidden } from '../common/response';
import { getRequestUserId } from '../../security/request-context';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  ssoSchema,
  acceptInviteSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
  switchOrganizationSchema,
  sessionIdParamSchema,
} from './validators';
import {
  serializeAuthTokens,
  serializeProfile,
  serializeStorageUsage,
  serializeOrganizationRef,
  serializeSession,
} from './serializers';

const REFRESH_COOKIE_NAME = 'refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = signupSchema.parse({ body: req.body });
    const { email, password, firstName, lastName, role, organizationId } = body;
    const ipAddress = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendConflict(res, 'Registration failed. Please check your details and try again.');
      return;
    }

    const assignedRole = role === 'STUDENT' ? 'STUDENT' : 'TEACHER';
    const pwdHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: pwdHash,
        firstName,
        lastName,
        role: assignedRole,
        organizationId: organizationId || null,
        activeOrganizationId: organizationId || null,
        hasCompletedOnboarding: false,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, status: 'SIGNUP_SUCCESS' },
    }).catch(() => {});

    await AuditService.logAuditEvent({
      action: 'SIGNUP_SUCCESS',
      userId: user.id,
      organizationId: user.organizationId || undefined,
      entity: 'User', entityId: user.id, ipAddress, userAgent,
    });

    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: { userId: user.id, userAgent, ipAddress, expiresAt: sessionExpiry },
    }).catch(() => {});

    setRefreshCookie(res, refreshToken);

    sendCreated(res, serializeAuthTokens(accessToken, user, refreshToken), 'Account created successfully');
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[signup]');
    sendError(res, { error: 'Registration failed. Please try again later.', statusCode: 500 });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const { email, password } = body;
    const ipAddress = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const loginKey = `login:attempts:${email}:${ipAddress}`;
    const lockKey = `login:locked:${email}:${ipAddress}`;
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION = 15 * 60;

    try {
      const redis = getRedisClient();
      const isLocked = await redis.get(lockKey);
      if (isLocked) {
        sendError(res, { error: 'Too many failed login attempts. Try again in 15 minutes.', code: 'RATE_LIMITED', statusCode: 429 });
        return;
      }
    } catch { /* ignore */ }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    if (!user.passwordHash) {
      sendUnauthorized(res, 'Please sign in with Google.');
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      await prisma.loginHistory.create({
        data: { userId: user.id, ipAddress, userAgent, status: 'FAILED_PASSWORD' },
      }).catch(() => {});
      await AuditService.logAuditEvent({
        action: 'LOGIN_FAILED', userId: user.id,
        organizationId: user.organizationId || undefined, ipAddress, userAgent,
        metadata: { reason: 'FAILED_PASSWORD' },
      });
      try {
        const redis = getRedisClient();
        const attempts = await redis.incr(loginKey);
        if (attempts === 1) await redis.expire(loginKey, LOCK_DURATION);
        if (attempts >= MAX_ATTEMPTS) {
          await redis.set(lockKey, '1', 'EX', LOCK_DURATION);
          await redis.del(loginKey);
        }
      } catch { /* ignore */ }
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id, email: user.email, role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    try {
      const redis = getRedisClient();
      await Promise.all([redis.del(loginKey), redis.del(lockKey)]);
    } catch { /* ignore */ }

    const refreshToken = await createRefreshToken(user.id);

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, status: 'SUCCESS' },
    }).catch(() => {});
    await AuditService.logAuditEvent({
      action: 'LOGIN_SUCCESS', userId: user.id,
      organizationId: user.organizationId || undefined, ipAddress, userAgent,
    });

    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: { userId: user.id, userAgent, ipAddress, expiresAt: sessionExpiry },
    }).catch(() => {});

    setRefreshCookie(res, refreshToken);

    sendSuccess(res, { data: serializeAuthTokens(accessToken, user, refreshToken), message: 'Login successful' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[login]');
    sendError(res, { error: 'Authentication failed', statusCode: 500 });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    refreshSchema.parse({ body: req.body });
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;
    if (!rawToken) {
      sendUnauthorized(res, 'Refresh token missing');
      return;
    }
    const { accessToken, newRefreshToken } = await rotateRefreshToken(rawToken);
    setRefreshCookie(res, newRefreshToken);
    sendSuccess(res, { data: { accessToken } });
  } catch (error: any) {
    clearRefreshCookie(res);
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[refresh]');
    sendError(res, { error: 'Token refresh failed', code: 'INVALID_REFRESH_TOKEN', statusCode: error.status || 401 });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await revokeSession(rawToken).catch(() => {});
    }
    clearRefreshCookie(res);
    sendSuccess(res, { data: null, message: 'Logged out successfully' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[logout]');
    sendError(res, { error: 'Logout failed', statusCode: 500 });
  }
};

export const ssoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = ssoSchema.parse({ body: req.body });
    const { email, firstName, lastName, provider } = body;
    const ipAddress = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const pwdHash = await hashPassword(randomPassword);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: pwdHash,
          firstName: firstName || 'SSO',
          lastName: lastName || 'User',
          role: 'TEACHER',
          hasCompletedOnboarding: false,
        },
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id, email: user.email, role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, status: `SSO_${provider.toUpperCase()}_SUCCESS` },
    }).catch(() => {});

    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: { userId: user.id, userAgent, ipAddress, expiresAt: sessionExpiry },
    }).catch(() => {});

    setRefreshCookie(res, refreshToken);

    sendSuccess(res, { data: serializeAuthTokens(accessToken, user, refreshToken), message: 'SSO Login successful' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[ssoLogin]');
    sendError(res, { error: 'SSO Authentication failed', code: 'SSO_AUTH_FAILED', statusCode: 500 });
  }
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = acceptInviteSchema.parse({ body: req.body });
    const { token, password, firstName, lastName } = body;

    const invitation = await validateInvitationToken(token);
    const pwdHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: invitation.email.trim().toLowerCase(),
        passwordHash: pwdHash,
        firstName,
        lastName,
        role: invitation.role,
        organizationId: invitation.organizationId,
        hasCompletedOnboarding: false,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    await AuditService.logAuditEvent({
      action: 'INVITATION_ACCEPTED', entity: 'User', entityId: user.id,
      userId: user.id, organizationId: user.organizationId || undefined,
      ipAddress: req.ip || '0.0.0.0', userAgent: req.headers['user-agent'] || 'unknown',
    });

    sendCreated(res, { id: user.id, email: user.email }, 'Account created successfully');
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[acceptInvite]');
    sendBadRequest(res, 'Failed to accept invitation');
  }
};

export const getPublicOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });
    sendSuccess(res, { data: orgs });
  } catch (error: any) {
    ((_req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[getPublicOrganizations]');
    sendError(res, { error: 'Failed to fetch public organizations', statusCode: 500 });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getRequestUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true, department: true },
    });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }
    sendSuccess(res, {
      data: serializeProfile(user, user.organization?.name, user.department?.name),
    });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[getMe]');
    sendError(res, { error: 'Failed to fetch profile', statusCode: 500 });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = updateProfileSchema.parse({ body: req.body });
    const userId = getRequestUserId(req);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.email && { email: body.email }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      },
      include: { organization: true },
    });

    sendSuccess(res, { data: serializeProfile(user, user.organization?.name), message: 'Profile updated successfully' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[updateProfile]');
    sendError(res, { error: 'Failed to update profile', statusCode: 500 });
  }
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = updatePreferencesSchema.parse({ body: req.body });
    const userId = getRequestUserId(req);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences: body.preferences as any },
    });

    sendSuccess(res, { data: { preferences: user.preferences }, message: 'Preferences updated successfully' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[updatePreferences]');
    sendError(res, { error: 'Failed to update preferences', statusCode: 500 });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = changePasswordSchema.parse({ body: req.body });
    const userId = getRequestUserId(req);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    if (!user.passwordHash) {
      sendBadRequest(res, 'Account uses Google Sign-In, so you cannot change the password.');
      return;
    }

    const isMatch = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!isMatch) {
      sendBadRequest(res, 'Incorrect current password');
      return;
    }

    const newPasswordHash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    sendSuccess(res, { data: null, message: 'Password changed successfully' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[changePassword]');
    sendError(res, { error: 'Failed to change password', statusCode: 500 });
  }
};

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getRequestUserId(req);
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { data: sessions.map(serializeSession) });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[getSessions]');
    sendError(res, { error: 'Failed to fetch sessions', statusCode: 500 });
  }
};

export const revokeSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = sessionIdParamSchema.parse({ params: req.params });
    const userId = getRequestUserId(req);

    await prisma.session.deleteMany({
      where: { id: params.id, userId },
    });

    sendSuccess(res, { data: null, message: 'Session revoked successfully' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[revokeSessionById]');
    sendError(res, { error: 'Failed to revoke session', statusCode: 500 });
  }
};

export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = switchOrganizationSchema.parse({ body: req.body });
    const userId = getRequestUserId(req);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    if (user.role !== 'SUPER_ADMIN') {
      const belongs = await prisma.user.findFirst({
        where: { id: userId, organizationId: body.organizationId },
      });
      if (!belongs) {
        sendForbidden(res, 'Access denied to this organization');
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: body.organizationId },
      include: { organization: true },
    });

    const accessToken = generateAccessToken({
      userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role,
      organizationId: updatedUser.organizationId,
      activeOrganizationId: updatedUser.activeOrganizationId,
      departmentId: updatedUser.departmentId,
    });

    sendSuccess(res, {
      data: { accessToken, organizationName: updatedUser.organization?.name },
      message: 'Switched organization successfully',
    });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[switchOrganization]');
    sendError(res, { error: 'Failed to switch organization', statusCode: 500 });
  }
};

export const getUserOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getRequestUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }

    let orgs: Record<string, unknown>[] = [];
    if (user.role === 'SUPER_ADMIN') {
      orgs = await prisma.organization.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true, email: true },
      });
    } else if (user.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { id: true, name: true, code: true, email: true },
      });
      if (org) orgs = [org];
    }

    sendSuccess(res, { data: orgs.map((o) => serializeOrganizationRef(o, user.role)) });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[getUserOrganizations]');
    sendError(res, { error: 'Failed to fetch organizations', statusCode: 500 });
  }
};

export const getStorageUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getRequestUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user?.organizationId) {
      sendSuccess(res, { data: serializeStorageUsage(0, 104857600) });
      return;
    }

    const orgId = user.organizationId;
    const [usersCount, studentsCount, filesCount, logsCount] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.student.count({ where: { group: { organizationId: orgId } } }).catch(() => 0),
      prisma.generatedPaper.count({ where: { organizationId: orgId } }).catch(() => 0),
      prisma.auditLog.count({ where: { organizationId: orgId } }).catch(() => 0),
    ]);

    const estimatedBytes = (usersCount * 5000) + (studentsCount * 2000) + (filesCount * 500000) + (logsCount * 1000);
    const usedBytes = Math.max(1024 * 1024, estimatedBytes);
    const limitBytes = 100 * 1024 * 1024;

    sendSuccess(res, { data: serializeStorageUsage(usedBytes, limitBytes) });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[getStorageUsage]');
    sendError(res, { error: 'Failed to calculate storage', statusCode: 500 });
  }
};

export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getRequestUserId(req);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true, onboardingCompletedAt: new Date() },
    });
    sendSuccess(res, {
      data: { hasCompletedOnboarding: user.hasCompletedOnboarding },
      message: 'Onboarding completed successfully',
    });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[completeOnboarding]');
    sendError(res, { error: 'Failed to complete onboarding', statusCode: 500 });
  }
};

export const googleSignin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, role, isSignUp } = req.body;
    const ipAddress = req.ip || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!token) {
      sendBadRequest(res, 'Google token is required');
      return;
    }

    if (!role || !['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      sendBadRequest(res, 'Valid role is required');
      return;
    }

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      sendBadRequest(res, 'Invalid Google token');
      return;
    }

    const payload: any = await response.json();
    if (!payload || !payload.email) {
      sendBadRequest(res, 'Invalid Google token payload');
      return;
    }

    const { email, given_name, family_name, picture } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: { organization: true }
    });

    if (user) {
      if (user.role !== role) {
        sendForbidden(res, `This Google account is already linked to a ${user.role} profile. You cannot sign in to the ${role} portal.`);
        return;
      }

      const updateData: any = {};
      if (user.authProvider === 'LOCAL') {
        updateData.authProvider = 'GOOGLE';
      }
      if (picture && !user.avatar) {
        updateData.avatar = picture;
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: { organization: true }
        });
      }

      if (user.status !== 'ACTIVE') {
        sendForbidden(res, 'Account disabled');
        return;
      }

      if (user.organization && user.organization.status !== 'ACTIVE') {
        sendForbidden(res, 'Organization is not active');
        return;
      }
    } else {
      if (!isSignUp) {
        res.status(404).json({ success: false, error: 'Account not found. Please sign up first.', code: 'ACCOUNT_NOT_FOUND' });
        return;
      }
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          authProvider: 'GOOGLE',
          firstName: given_name || 'Unknown',
          lastName: family_name || 'Unknown',
          avatar: picture || null,
          role: role as any,
          hasCompletedOnboarding: true,
        },
        include: { organization: true }
      });
      
      await AuditService.logAuditEvent({
        action: 'SIGNUP_SUCCESS',
        userId: user.id,
        organizationId: user.organizationId || undefined,
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id, email: user.email, role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress, userAgent, status: 'SUCCESS' },
    }).catch(() => {});

    await AuditService.logAuditEvent({
      action: 'LOGIN_SUCCESS', userId: user.id,
      organizationId: user.organizationId || undefined, ipAddress, userAgent,
    });

    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: { userId: user.id, userAgent, ipAddress, expiresAt: sessionExpiry },
    }).catch(() => {});

    setRefreshCookie(res, refreshToken);

    sendSuccess(res, { data: serializeAuthTokens(accessToken, user, refreshToken), message: 'Google Sign-In successful' });
  } catch (error: any) {
    ((req as any).logger ?? logger).error({ err: error, stack: error.stack }, '[googleSignin]');
    sendError(res, { error: 'Google Authentication failed', statusCode: 500 });
  }
};
