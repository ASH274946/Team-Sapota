export interface SignupRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  organizationId?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshRequestDto {
  refreshToken?: string;
}

export interface SsoRequestDto {
  email: string;
  firstName?: string;
  lastName?: string;
  provider: string;
}

export interface AcceptInviteRequestDto {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileRequestDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
}

export interface UpdatePreferencesRequestDto {
  preferences: Record<string, unknown>;
}

export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}

export interface SwitchOrganizationRequestDto {
  organizationId: string;
}

export interface AuthUserResponseDto {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId?: string | null;
  activeOrganizationId?: string | null;
  departmentId?: string | null;
  hasCompletedOnboarding: boolean;
  avatar?: string | null;
}

export interface AuthTokensResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: AuthUserResponseDto;
}

export interface ProfileResponseDto {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId?: string | null;
  activeOrganizationId?: string | null;
  organizationName?: string | null;
  departmentName?: string | null;
  preferences: Record<string, unknown>;
  hasCompletedOnboarding: boolean;
  avatar?: string | null;
}

export interface StorageUsageResponseDto {
  used: number;
  limit: number;
  formattedUsed?: string;
  formattedLimit?: string;
  percentage?: number;
}

export interface OrganizationRefDto {
  id: string;
  name: string;
  code: string;
  role?: string;
  email?: string | null;
}

export interface SessionResponseDto {
  id: string;
  userId: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
}
