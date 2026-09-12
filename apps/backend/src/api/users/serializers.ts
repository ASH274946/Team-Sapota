import type { UserResponseDto, UserPermissionsResponseDto } from './dto';

export function serializeUser(user: Record<string, unknown>): UserResponseDto {
  const org = user.organization as Record<string, unknown> | undefined;
  const dept = user.department as Record<string, unknown> | undefined;
  return {
    id: user.id as string,
    email: user.email as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    role: user.role as string,
    phone: user.phone as string | null | undefined,
    organizationId: user.organizationId as string | null | undefined,
    departmentId: user.departmentId as string | null | undefined,
    organizationName: org?.name as string | null | undefined,
    departmentName: dept?.name as string | null | undefined,
    status: user.status as string,
    forcePasswordReset: user.forcePasswordReset as boolean,
    hasCompletedOnboarding: user.hasCompletedOnboarding as boolean,
    avatar: user.avatar as string | null | undefined,
    createdAt: user.createdAt as Date,
    updatedAt: user.updatedAt as Date,
  };
}

export function serializeUserPermissions(data: Record<string, unknown>): UserPermissionsResponseDto {
  return {
    userId: data.userId as string,
    role: data.role as string,
    permissions: data.permissions as string[],
  };
}
