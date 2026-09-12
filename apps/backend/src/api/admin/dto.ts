export interface CreateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  organizationId?: string;
  departmentId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  organizationId?: string;
  departmentId?: string;
  status?: string;
}

export interface ChangeRoleDto {
  role: string;
}

export interface CreateOrganizationDto {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  adminEmail?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  code?: string;
  email?: string;
  address?: string;
  phone?: string;
  status?: string;
  adminEmail?: string;
}

export interface UpdateSystemSettingsDto {
  allowRegistration?: boolean;
  maxUploadSizeMb?: number;
  maintenanceMode?: boolean;
  defaultLanguage?: string;
  features?: Record<string, boolean>;
}

export interface AdminDashboardDto {
  totalUsers: number;
  totalOrganizations: number;
  activeUsers: number;
  totalRevenue: number;
  subscriptions: number;
  pendingInvites: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  organizationId?: string | null;
  organizationName?: string;
  departmentName?: string;
  createdAt: Date;
}

export interface AdminOrganizationDto {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  status: string;
  userCount: number;
  departmentCount: number;
  createdAt: Date;
}

export interface AuditLogDto {
  id: string;
  userId?: string | null;
  action: string;
  entity?: string | null;
  entityId?: string | null;
  ipAddress: string;
  userAgent: string;
  metadata?: unknown;
  createdAt: Date;
}

export interface SystemSettingsDto {
  allowRegistration: boolean;
  maxUploadSizeMb: number;
  maintenanceMode: boolean;
  defaultLanguage: string;
  features: Record<string, boolean>;
}

export interface SubscriptionDto {
  id: string;
  organizationId: string;
  organizationName: string;
  plan: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface PlatformUsageDto {
  totalRequests: number;
  activeUsers: number;
  totalOrganizations: number;
  storageUsedGb: number;
  aiTokensUsed: number;
  apiCallsByEndpoint: Record<string, number>;
}
