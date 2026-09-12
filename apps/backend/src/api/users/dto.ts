import type { PaginationDto } from '../common/dto';

export interface CreateUserRequestDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  organizationId?: string;
  departmentId?: string;
}

export interface UpdateUserRequestDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  organizationId?: string;
  departmentId?: string;
  status?: string;
}

export interface ChangeUserRoleRequestDto {
  role: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string | null;
  organizationId?: string | null;
  departmentId?: string | null;
  organizationName?: string | null;
  departmentName?: string | null;
  status: string;
  forcePasswordReset: boolean;
  hasCompletedOnboarding: boolean;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListDto {
  data: UserResponseDto[];
  pagination: PaginationDto;
}

export interface UserPermissionsResponseDto {
  userId: string;
  role: string;
  permissions: string[];
}
