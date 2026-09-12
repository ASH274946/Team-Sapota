import type {
  AdminDashboardDto,
  AdminUserDto,
  AdminOrganizationDto,
  AuditLogDto,
  SystemSettingsDto,
  SubscriptionDto,
  PlatformUsageDto,
} from './dto';

export function serializeDashboard(stats: any): AdminDashboardDto {
  return {
    totalUsers: stats.totalUsers ?? 0,
    totalOrganizations: stats.totalOrganizations ?? 0,
    activeUsers: stats.activeUsers ?? 0,
    totalRevenue: stats.totalRevenue ?? 0,
    subscriptions: stats.subscriptions ?? 0,
    pendingInvites: stats.pendingInvites ?? 0,
  };
}

export function serializeUser(user: any): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status ?? 'ACTIVE',
    organizationId: user.organizationId,
    organizationName: user.organization?.name,
    departmentName: user.department?.name,
    createdAt: user.createdAt,
  };
}

export function serializeOrganization(org: any): AdminOrganizationDto {
  return {
    id: org.id,
    name: org.name,
    code: org.code,
    email: org.email,
    status: org.status ?? 'ACTIVE',
    userCount: org._count?.users ?? 0,
    departmentCount: org._count?.departments ?? 0,
    createdAt: org.createdAt,
  };
}

export function serializeAuditLog(log: any): AuditLogDto {
  return {
    id: log.id,
    userId: log.userId,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    metadata: log.metadata,
    createdAt: log.createdAt,
  };
}

export function serializeSystemSettings(settings: any): SystemSettingsDto {
  return {
    allowRegistration: settings.allowRegistration ?? true,
    maxUploadSizeMb: settings.maxUploadSizeMb ?? 50,
    maintenanceMode: settings.maintenanceMode ?? false,
    defaultLanguage: settings.defaultLanguage ?? 'en',
    features: settings.features ?? {},
  };
}

export function serializeSubscription(sub: any): SubscriptionDto {
  return {
    id: sub.id,
    organizationId: sub.organizationId,
    organizationName: sub.organization?.name ?? '',
    plan: sub.plan,
    status: sub.status,
    expiresAt: sub.expiresAt,
    createdAt: sub.createdAt,
  };
}

export function serializePlatformUsage(data: any): PlatformUsageDto {
  return {
    totalRequests: data.totalRequests ?? 0,
    activeUsers: data.activeUsers ?? 0,
    totalOrganizations: data.totalOrganizations ?? 0,
    storageUsedGb: data.storageUsedGb ?? 0,
    aiTokensUsed: data.aiTokensUsed ?? 0,
    apiCallsByEndpoint: data.apiCallsByEndpoint ?? {},
  };
}
