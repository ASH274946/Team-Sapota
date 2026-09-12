import type { OrganizationResponseDto, OrganizationDetailResponseDto, DepartmentResponseDto, OrganizationUsageResponseDto } from './dto';

export function serializeOrganization(org: Record<string, unknown>): OrganizationResponseDto {
  const count = org._count as Record<string, number> | undefined;
  return {
    id: org.id as string,
    name: org.name as string,
    code: org.code as string,
    slug: org.slug as string,
    email: org.email as string | null | undefined,
    phone: org.phone as string | null | undefined,
    address: org.address as string | null | undefined,
    status: org.status as string,
    adminEmail: org.adminEmail as string | null | undefined,
    usersCount: count?.users ?? (org.usersCount as number | undefined),
    departmentsCount: count?.departments ?? (org.departmentsCount as number | undefined),
    createdAt: org.createdAt as Date,
    updatedAt: org.updatedAt as Date,
  };
}

export function serializeOrganizationDetail(org: Record<string, unknown>): OrganizationDetailResponseDto {
  return {
    ...serializeOrganization(org),
    departments: org.departments as Record<string, unknown>[],
  };
}

export function serializeDepartment(dept: Record<string, unknown>): DepartmentResponseDto {
  const count = dept._count as Record<string, number> | undefined;
  const org = dept.organization as Record<string, unknown> | undefined;
  return {
    id: dept.id as string,
    name: dept.name as string,
    code: dept.code as string,
    organizationId: dept.organizationId as string,
    hodId: dept.hodId as string | null | undefined,
    status: dept.status as string,
    usersCount: count?.users as number | undefined,
    organizationName: org?.name as string | undefined,
    createdAt: dept.createdAt as Date,
    updatedAt: dept.updatedAt as Date,
  };
}

export function serializeOrganizationUsage(usage: Record<string, unknown>): OrganizationUsageResponseDto {
  return {
    totalUsers: usage.totalUsers as number,
    facultyCount: usage.facultyCount as number,
    studentCount: usage.studentCount as number,
    papersGenerated: usage.papersGenerated as number,
    aiUsage: usage.aiUsage as { tokensUsed: number; estimatedCost: number },
  };
}
