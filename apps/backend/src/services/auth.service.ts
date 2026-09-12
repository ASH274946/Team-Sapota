import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string | null;
  activeOrganizationId?: string | null;
  departmentId?: string | null;
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Hash password with Argon2
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    logger.error(`[verifyPassword] Error: ${err}`);
    return false;
  }
}

/**
 * Generate cryptographic random token hash
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Generate Access Token (JWT)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      activeOrganizationId: payload.activeOrganizationId,
      departmentId: payload.departmentId,
    },
    env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Verify Access Token (JWT)
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as any;
    return {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
      activeOrganizationId: decoded.activeOrganizationId,
      departmentId: decoded.departmentId,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthError(401, 'Access token has expired');
    }
    throw new AuthError(401, 'Invalid access token');
  }
}

/**
 * Create a new Refresh Token in the database
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRandomToken();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Rotate Refresh Token (implements reuse detection)
 */
export async function rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) {
    throw new AuthError(401, 'Invalid refresh token');
  }

  // REUSE DETECTION: If token is already revoked, revoke all tokens for this user!
  if (record.isRevoked || record.expiresAt < new Date()) {
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId },
      data: { isRevoked: true },
    });
    await prisma.session.updateMany({
      where: { userId: record.userId },
      data: { isActive: false },
    });
    logger.warn(`[REUSE_DETECTION] Revoked refresh token reuse detected for userId=${record.userId}. Revoking all sessions.`);
    throw new AuthError(401, 'Refresh token reuse detected. All sessions terminated.');
  }

  // Revoke current token
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { isRevoked: true },
  });

  // Create new refresh token and access token
  const newRefreshToken = await createRefreshToken(record.userId);
  const accessToken = generateAccessToken({
    userId: record.userId,
    email: record.user.email,
    role: record.user.role,
      organizationId: record.user.organizationId,
      activeOrganizationId: record.user.activeOrganizationId,
      departmentId: record.user.departmentId,
  });

  return { accessToken, newRefreshToken };
}

/**
 * Terminate Session
 */
export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { isRevoked: true },
  });
}
