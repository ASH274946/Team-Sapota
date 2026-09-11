import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { AuditService } from '../services/audit.service';
import {
  hashPassword,
  verifyPassword,
  createRefreshToken,
  generateAccessToken,
  rotateRefreshToken,
  revokeSession,
} from '../services/auth.service';
import { validateInvitationToken } from '../services/invitation.service';
import { getRedisClient } from '../config/redis';

const REFRESH_COOKIE_NAME = 'refresh_token';

function getUserId(req: Request): string {
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

// Helper to set HttpOnly secure cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

// Clear refresh token cookie
function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
}

// ── POST /auth/signup ──
export const signup = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(String(password))) {
      res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
      return;
    }

    // Role validation
    const assignedRole = role === 'STUDENT' ? 'STUDENT' : 'TEACHER';

    const normalizedEmail = String(email).trim().toLowerCase();
    // Intentionally using generic message to prevent user enumeration
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Registration failed. Please check your details and try again.' });
      return;
    }

    const pwdHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: pwdHash,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
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
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'SIGNUP_SUCCESS',
      },
    });

    await AuditService.logAuditEvent({
      action: 'SIGNUP_SUCCESS',
      userId: user.id,
      organizationId: user.organizationId || undefined,
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent
    });

    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: user.organizationId,
          activeOrganizationId: user.activeOrganizationId,
          departmentId: user.departmentId,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });
  } catch (error: any) {
    logger.error(`[signup] ${error}`);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again later.' });
  }
};

// ── POST /auth/accept-invite ──
export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, firstName, lastName } = req.body;

    if (!token || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    if (String(password).length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(String(password))) {
      res.status(400).json({ success: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' });
      return;
    }

    const invitation = await validateInvitationToken(token);

    const pwdHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: String(invitation.email).trim().toLowerCase(),
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
      data: { status: 'ACCEPTED', acceptedAt: new Date() }
    });

    await AuditService.logAuditEvent({
      action: 'INVITATION_ACCEPTED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      organizationId: user.organizationId || undefined,
      ipAddress: req.ip || '0.0.0.0',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    logger.error(`[acceptInvite] ${error}`);
    res.status(400).json({ success: false, error: error.message || 'Failed to accept invitation' });
  }
};

// ── POST /auth/login ──
export const login = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // ── Brute-force / account-lockout protection ──
    const loginKey = `login:attempts:${normalizedEmail}:${ipAddress}`;
    const lockKey = `login:locked:${normalizedEmail}:${ipAddress}`;
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION = 15 * 60; // 15 minutes
    try {
      const redis = getRedisClient();
      const isLocked = await redis.get(lockKey);
      if (isLocked) {
        logger.warn({ email: normalizedEmail, ip: ipAddress }, '[login] Account temporarily locked');
        res.status(429).json({ success: false, error: 'Too many failed login attempts. Try again in 15 minutes.' });
        return;
      }
    } catch (redisErr) {
      logger.warn({ redisErr }, '[login] Redis brute-force check unavailable — proceeding');
    }
    const user = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      include: { organization: true }
    });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ success: false, error: 'Account disabled' });
      return;
    }

    if (user.organization && user.organization.status !== 'ACTIVE') {
      res.status(403).json({ success: false, error: 'Organization is not active' });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ success: false, error: 'Please sign in with Google.' });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      // Record login failure
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          status: 'FAILED_PASSWORD',
        },
      });

      await AuditService.logAuditEvent({
        action: 'LOGIN_FAILED',
        userId: user.id,
        organizationId: user.organizationId || undefined,
        ipAddress,
        userAgent,
        metadata: { reason: 'FAILED_PASSWORD' }
      });

      // Increment brute-force counter
      try {
        const redis = getRedisClient();
        const attempts = await redis.incr(loginKey);
        if (attempts === 1) await redis.expire(loginKey, LOCK_DURATION);
        if (attempts >= MAX_ATTEMPTS) {
          await redis.set(lockKey, '1', 'EX', LOCK_DURATION);
          await redis.del(loginKey);
          logger.warn({ email: normalizedEmail, ip: ipAddress }, '[login] Account locked after max failed attempts');
        }
      } catch { /* non-critical — continue even if Redis unavailable */ }

      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    // Clear brute-force counter on successful login
    try {
      const redis = getRedisClient();
      await Promise.all([redis.del(loginKey), redis.del(lockKey)]);
    } catch { /* non-critical */ }

    const refreshToken = await createRefreshToken(user.id);

    // Save success history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    await AuditService.logAuditEvent({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      organizationId: user.organizationId || undefined,
      ipAddress,
      userAgent
    });

    // Create session record
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });
  } catch (error) {
    logger.error(`[login] ${error}`);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// ── POST /auth/google ──
export const googleSignin = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { token, role, isSignUp } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Google token is required' });
      return;
    }

    if (!role || !['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      res.status(400).json({ success: false, error: 'Valid role is required' });
      return;
    }

    // Verify Google token
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      res.status(400).json({ success: false, error: 'Invalid Google token' });
      return;
    }

    const payload: any = await response.json();
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, error: 'Invalid Google token payload' });
      return;
    }

    const { email, given_name, family_name, picture } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists by email
    let user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail
      },
      include: { organization: true }
    });

    if (user) {
      // User exists. Update authProvider and avatar if needed
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
        res.status(403).json({ success: false, error: 'Account disabled' });
        return;
      }

      if (user.organization && user.organization.status !== 'ACTIVE') {
        res.status(403).json({ success: false, error: 'Organization is not active' });
        return;
      }

    } else {
      if (!isSignUp) {
        res.status(404).json({ success: false, error: 'Account not found. Please sign up first.', code: 'ACCOUNT_NOT_FOUND' });
        return;
      }
      // User does not exist, create a fresh profile for the requested role
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
        metadata: { provider: 'GOOGLE' }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    // Save success history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });

    await AuditService.logAuditEvent({
      action: 'LOGIN_SUCCESS',
      userId: user.id,
      organizationId: user.organizationId || undefined,
      ipAddress,
      userAgent,
      metadata: { provider: 'GOOGLE' }
    });

    // Create session record
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });

  } catch (error: any) {
    logger.error(`[googleSignin] ${error}`);
    res.status(500).json({ success: false, error: 'Google authentication failed' });
  }
};


// ── POST /auth/refresh ──
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      res.status(401).json({ success: false, error: 'Refresh token missing' });
      return;
    }

    const { accessToken, newRefreshToken } = await rotateRefreshToken(rawToken);
    setRefreshCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error: any) {
    logger.error(`[refresh] ${error.message}`);
    clearRefreshCookie(res);
    res.status(error.status || 401).json({ success: false, error: error.message || 'Token refresh failed' });
  }
};

// ── POST /auth/logout ──
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await revokeSession(rawToken);
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`[logout] ${error}`);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// ── GET /auth/me ──
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true, department: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    let activeOrgName = user.organization?.name || null;
    let activeOrgCode = user.organization?.code || null;
    if (user.activeOrganizationId && user.activeOrganizationId !== user.organizationId) {
      const activeOrg = await prisma.organization.findUnique({
        where: { id: user.activeOrganizationId },
        select: { name: true, code: true }
      });
      if (activeOrg) {
        activeOrgName = activeOrg.name;
        activeOrgCode = activeOrg.code;
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        activeOrganizationId: user.activeOrganizationId,
        organizationName: activeOrgName,
        organizationCode: activeOrgCode,
        departmentName: user.department?.name || null,
        preferences: user.preferences || {},
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error(`[getMe] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

// ── POST /auth/onboarding/complete ──
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    });
  } catch (error) {
    logger.error(`[completeOnboarding] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
};

// ── PUT /auth/me ──
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { firstName, lastName, email, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { organization: true },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        organizationName: user.organization?.name || '',
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error(`[updateProfile] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

// ── PUT /auth/me/preferences ──
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences: preferences as any },
    });

    res.json({
      success: true,
      data: { preferences: user.preferences },
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    logger.error(`[updatePreferences] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
};

// ── GET /auth/me/organizations ──
export const getAvailableOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    let orgs: { id: string; name: string; code: string; email: string | null }[] = [];
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

    res.json({
      success: true,
      data: orgs.map((org) => ({
        id: org.id,
        name: org.name,
        code: org.code,
        role: user.role,
        email: org.email,
      })),
    });
  } catch (error) {
    logger.error(`[getAvailableOrganizations] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch organizations' });
  }
};

// ── GET /auth/public-organizations ──
export const getPublicOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true },
    });

    res.json({
      success: true,
      data: orgs,
    });
  } catch (error) {
    logger.error(`[getPublicOrganizations] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch public organizations' });
  }
};

// ── POST /auth/me/switch-organization ──
export const switchOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { organizationId } = req.body;

    if (!organizationId) {
      res.status(400).json({ success: false, error: 'organizationId is required' });
      return;
    }

    // Verify user belongs to this organization (or is SUPER_ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    // Check if user belongs to this org
    const userOrg = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: organizationId,
      },
    });

    if (!userOrg && (req as any).user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, error: 'Access denied to this organization' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
      include: { organization: true },
    });

    // Re-issue tokens for new active org
    const accessToken = generateAccessToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      organizationId: updatedUser.organizationId,
      activeOrganizationId: updatedUser.activeOrganizationId,
      departmentId: updatedUser.departmentId,
    });

    res.json({
      success: true,
      message: 'Switched organization successfully',
      data: {
        accessToken,
        organizationName: updatedUser.organization?.name,
      },
    });
  } catch (error) {
    logger.error(`[switchOrganization] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to switch organization' });
  }
};

// ── GET /auth/me/sessions ──
export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: sessions });
  } catch (error) {
    logger.error(`[getSessions] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

// ── DELETE /auth/me/sessions/:id ──
export const revokeSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId: userId
      }
    });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    logger.error(`[revokeSessionById] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to revoke session' });
  }
};

// ── PUT /auth/me/password ──
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current password and new password are required' });
      return;
    }
    if (String(newPassword).length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters long' });
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(String(newPassword))) {
      res.status(400).json({ success: false, error: 'New password must contain at least one uppercase letter, one lowercase letter, and one number' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ success: false, error: 'Account uses Google Sign-In, so you cannot change the password.' });
      return;
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, error: 'Incorrect current password' });
      return;
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.error(`[changePassword] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// ── GET /auth/me/storage ──
export const getStorageUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
    
    if (!user?.organizationId) {
      res.json({ success: true, data: { used: 0, limit: 104857600 } }); // 100MB in bytes
      return;
    }

    const orgId = user.organizationId;
    
    // Calculate approximate storage used based on records (dummy calculation for realistic data)
    // In a real scenario with Supabase storage, we'd query the bucket size.
    // For DB rows, we'll estimate:
    const usersCount = await prisma.user.count({ where: { organizationId: orgId } });
    const studentsCount = await prisma.student.count({ where: { group: { organizationId: orgId } } });
    const filesCount = await prisma.generatedPaper.count({ where: { organizationId: orgId } });
    const logsCount = await prisma.auditLog.count({ where: { organizationId: orgId } });

    // Assuming ~5KB per user, ~2KB per student, ~500KB per generated paper, ~1KB per log
    const estimatedBytes = (usersCount * 5000) + (studentsCount * 2000) + (filesCount * 500000) + (logsCount * 1000);
    const usedBytes = Math.max(1024 * 1024, estimatedBytes); // Floor at 1MB if there's any data
    const limitBytes = 100 * 1024 * 1024; // 100MB

    res.json({ 
      success: true, 
      data: { 
        used: usedBytes,
        limit: limitBytes,
        formattedUsed: (usedBytes / (1024 * 1024)).toFixed(1) + ' MB',
        formattedLimit: '100 MB',
        percentage: Math.min(100, Math.round((usedBytes / limitBytes) * 100))
      } 
    });
  } catch (error) {
    logger.error(`[getStorageUsage] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to calculate storage' });
  }
};

// ── PUT /auth/me/organization ──
export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);

    const { organizationName, academicYear, department } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (organizationName) {
      if (user.organizationId) {
        await prisma.organization.update({
          where: { id: user.organizationId },
          data: { name: organizationName },
        });
      } else {
        const org = await prisma.organization.create({
          data: {
            name: organizationName,
            code: organizationName.substring(0, 4).toUpperCase(),
            email: user.email,
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id },
        });
        user.organizationId = org.id;
      }
    }

    if (department && user.organizationId) {
      let dept = await prisma.department.findFirst({
        where: { name: department, organizationId: user.organizationId },
      });
      if (!dept) {
        dept = await prisma.department.create({
          data: {
            name: department,
            organizationId: user.organizationId,
          },
        });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { departmentId: dept.id },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    let accessToken = null;
    if (updatedUser) {
      accessToken = generateAccessToken({
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId,
        activeOrganizationId: updatedUser.activeOrganizationId,
        departmentId: updatedUser.departmentId,
      });
    }

    res.json({
      success: true,
      message: 'Organization settings updated',
      data: { organizationName, department, academicYear, accessToken },
    });
  } catch (error) {
    logger.error(`[updateOrganization] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};

// ── POST /auth/sso ──
export const ssoLogin = async (req: Request, res: Response): Promise<void> => {
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { email, firstName, lastName, provider, role, isSignUp } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    if (!role || !['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      res.status(400).json({ success: false, error: 'Valid role is required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Attempt to find user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (user) {
      if (user.status !== 'ACTIVE') {
        res.status(403).json({ success: false, error: 'Account disabled' });
        return;
      }
      
      // Allow role sync from toggle if user hasn't completed onboarding yet
      if (!user.hasCompletedOnboarding && role && user.role !== role) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: role as any },
        });
      }
    } else {
      if (!isSignUp) {
        res.status(404).json({ success: false, error: 'Account not found. Please sign up first.', code: 'ACCOUNT_NOT_FOUND' });
        return;
      }
      // If user does not exist, create a new one
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const pwdHash = await hashPassword(randomPassword);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: pwdHash,
          firstName: firstName || 'SSO',
          lastName: lastName || 'User',
          role: role as any,
          hasCompletedOnboarding: false,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      activeOrganizationId: user.activeOrganizationId,
      departmentId: user.departmentId,
    });

    const refreshToken = await createRefreshToken(user.id);

    // Save success history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        status: `SSO_${String(provider).toUpperCase()}_SUCCESS`,
      },
    });

    // Create session record
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);
    await prisma.session.create({
      data: {
        userId: user.id,
        userAgent,
        ipAddress,
        expiresAt: sessionExpiry,
      },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      message: 'SSO Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });
  } catch (error: any) {
    logger.error(`[ssoLogin] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'SSO Authentication failed' });
  }
};
