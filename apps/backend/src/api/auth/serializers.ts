import type { AuthUserResponseDto, ProfileResponseDto, StorageUsageResponseDto, OrganizationRefDto, SessionResponseDto, AuthTokensResponseDto } from './dto';

export function serializeAuthUser(user: Record<string, unknown>): AuthUserResponseDto {
  return {
    id: user.id as string,
    email: user.email as string,
    role: user.role as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    organizationId: user.organizationId as string | null | undefined,
    activeOrganizationId: user.activeOrganizationId as string | null | undefined,
    departmentId: user.departmentId as string | null | undefined,
    hasCompletedOnboarding: user.hasCompletedOnboarding as boolean,
    avatar: user.avatar as string | null | undefined,
  };
}

export function serializeAuthTokens(
  accessToken: string,
  user: Record<string, unknown>,
  refreshToken?: string,
): AuthTokensResponseDto {
  return {
    accessToken,
    ...(refreshToken && { refreshToken }),
    user: serializeAuthUser(user),
  };
}

export function serializeProfile(
  user: Record<string, unknown>,
  organizationName?: string | null,
  departmentName?: string | null,
): ProfileResponseDto {
  return {
    id: user.id as string,
    email: user.email as string,
    role: user.role as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    organizationId: user.organizationId as string | null | undefined,
    activeOrganizationId: user.activeOrganizationId as string | null | undefined,
    organizationName: organizationName ?? null,
    departmentName: departmentName ?? null,
    preferences: (user.preferences as Record<string, unknown>) ?? {},
    hasCompletedOnboarding: user.hasCompletedOnboarding as boolean,
    avatar: user.avatar as string | null | undefined,
  };
}

export function serializeStorageUsage(used: number, limit: number): StorageUsageResponseDto {
  return {
    used,
    limit,
    formattedUsed: (used / (1024 * 1024)).toFixed(1) + ' MB',
    formattedLimit: (limit / (1024 * 1024)).toFixed(0) + ' MB',
    percentage: Math.min(100, Math.round((used / limit) * 100)),
  };
}

export function serializeOrganizationRef(org: Record<string, unknown>, role?: string): OrganizationRefDto {
  return {
    id: org.id as string,
    name: org.name as string,
    code: org.code as string,
    ...(role && { role }),
    email: org.email as string | null | undefined,
  };
}

export function serializeSession(session: Record<string, unknown>): SessionResponseDto {
  return {
    id: session.id as string,
    userId: session.userId as string,
    userAgent: session.userAgent as string,
    ipAddress: session.ipAddress as string,
    createdAt: session.createdAt as Date,
    expiresAt: session.expiresAt as Date,
  };
}
