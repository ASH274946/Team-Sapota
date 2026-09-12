import type { PaginationDto } from '../common/dto';

export interface CreateOrganizationRequestDto {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  adminEmail?: string;
}

export interface UpdateOrganizationRequestDto {
  name?: string;
  code?: string;
  email?: string;
  address?: string;
  phone?: string;
  status?: string;
  adminEmail?: string;
}

export interface OrganizationResponseDto {
  id: string;
  name: string;
  code: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  adminEmail?: string | null;
  usersCount?: number;
  departmentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationDetailResponseDto extends OrganizationResponseDto {
  departments: Record<string, unknown>[];
}

export interface CreateDepartmentRequestDto {
  name: string;
  code: string;
  hodId?: string;
}

export interface DepartmentResponseDto {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  hodId?: string | null;
  status: string;
  usersCount?: number;
  organizationName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationUsageResponseDto {
  totalUsers: number;
  facultyCount: number;
  studentCount: number;
  papersGenerated: number;
  aiUsage: {
    tokensUsed: number;
    estimatedCost: number;
  };
}

export interface OrganizationListDto {
  data: OrganizationResponseDto[];
  pagination: PaginationDto;
}
