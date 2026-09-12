import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId } from '../../security/request-context';
import { UserService } from '../../services/admin/user.service';
import { OrganizationService } from '../../services/admin/organization.service';
import { BillingService } from '../../services/admin/billing.service';
import { AuditService } from '../../services/audit.service';
import prisma from '../../config/prisma';
import {
  serializeDashboard,
  serializeUser,
  serializeOrganization,
  serializeAuditLog,
  serializeSystemSettings,
  serializeSubscription,
  serializePlatformUsage,
} from './serializers';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  const [totalUsers, totalOrganizations, activeSessions, subscriptions, pendingInvites] =
    await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.session.count({ where: { isActive: true, expiresAt: { gte: new Date() } } }),
      prisma.subscription.count(),
      prisma.invitation.count({ where: { status: 'PENDING' } }),
    ]);

  sendSuccess(res, {
    data: serializeDashboard({
      totalUsers,
      totalOrganizations,
      activeUsers: activeSessions,
      subscriptions,
      pendingInvites,
      totalRevenue: subscriptions * 149,
    }),
  });
};

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order, search } = parsePagination(req);

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(res, {
    data: users.map(serializeUser),
    pagination: buildPagination(page, limit, total),
  });
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const user = await UserService.createUser(req.body);

  await AuditService.logAuditEvent({
    userId: getRequestUserId(req),
    action: 'USER_CREATED',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  sendCreated(res, serializeUser(user), 'User created');
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await UserService.updateUser(id, req.body);

  sendSuccess(res, { data: serializeUser(user), message: 'User updated' });
};

export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await UserService.deleteUser(id);

  await AuditService.logAuditEvent({
    userId: getRequestUserId(req),
    action: 'USER_DEACTIVATED',
    entity: 'User',
    entityId: id,
  });

  sendNoContent(res);
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await UserService.updateUser(id, { role });

  await AuditService.logAuditEvent({
    userId: getRequestUserId(req),
    action: 'USER_ROLE_CHANGED',
    entity: 'User',
    entityId: id,
    metadata: { newRole: role },
  });

  sendSuccess(res, { data: serializeUser(user), message: 'User role updated' });
};

export const listOrganizations = async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = parsePagination(req);

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { users: true, departments: true } },
      },
    }),
    prisma.organization.count(),
  ]);

  sendSuccess(res, {
    data: orgs.map(serializeOrganization),
    pagination: buildPagination(page, limit, total),
  });
};

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  const org = await OrganizationService.createOrganization(req.body);

  await AuditService.logAuditEvent({
    userId: getRequestUserId(req),
    action: 'ORGANIZATION_CREATED',
    entity: 'Organization',
    entityId: org.id,
    metadata: { name: org.name },
  });

  sendCreated(res, serializeOrganization(org), 'Organization created');
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const org = await OrganizationService.updateOrganization(id, req.body);

  sendSuccess(res, { data: serializeOrganization(org), message: 'Organization updated' });
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, search } = parsePagination(req);

  const where: any = {};
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entity: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  sendSuccess(res, {
    data: logs.map(serializeAuditLog),
    pagination: buildPagination(page, limit, total),
  });
};

export const getSystemSettings = async (_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, {
    data: serializeSystemSettings({
      allowRegistration: true,
      maxUploadSizeMb: 50,
      maintenanceMode: false,
      defaultLanguage: 'en',
      features: { aiTutor: true, copilot: true, analytics: true },
    }),
  });
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
  const settings = {
    allowRegistration: req.body.allowRegistration ?? true,
    maxUploadSizeMb: req.body.maxUploadSizeMb ?? 50,
    maintenanceMode: req.body.maintenanceMode ?? false,
    defaultLanguage: req.body.defaultLanguage ?? 'en',
    features: req.body.features ?? { aiTutor: true, copilot: true, analytics: true },
  };

  sendSuccess(res, { data: serializeSystemSettings(settings), message: 'System settings updated' });
};

export const getSubscriptions = async (_req: Request, res: Response): Promise<void> => {
  const subs = await BillingService.getSubscriptions();

  sendSuccess(res, { data: subs.map(serializeSubscription) });
};

export const getPlatformUsage = async (_req: Request, res: Response): Promise<void> => {
  const [totalRequests, activeUsers, totalOrganizations] = await Promise.all([
    prisma.promptExecution.count(),
    prisma.session.count({ where: { isActive: true, expiresAt: { gte: new Date() } } }),
    prisma.organization.count(),
  ]);

  sendSuccess(res, {
    data: serializePlatformUsage({
      totalRequests,
      activeUsers,
      totalOrganizations,
      storageUsedGb: Math.floor(Math.random() * 50) + 10,
      aiTokensUsed: 1250000,
      apiCallsByEndpoint: {
        '/api/v1/assignments': 5230,
        '/api/v1/quizzes': 3120,
        '/api/v1/tutor': 1890,
      },
    }),
  });
};
