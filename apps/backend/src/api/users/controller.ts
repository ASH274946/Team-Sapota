import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { UserService } from '../../services/admin/user.service';
import { RoleService } from '../../services/admin/role.service';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { requireRequestOrgId } from '../../security/request-context';
import { createUserSchema, updateUserSchema, changeUserRoleSchema, idParamSchema } from './validators';
import { serializeUser, serializeUserPermissions } from './serializers';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, sort, order, search } = parsePagination(req);
    const orgId = requireRequestOrgId(req);

    const where: Record<string, unknown> = { organizationId: orgId, status: { not: 'DELETED' } };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const selectFields = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      organizationId: true,
      departmentId: true,
      status: true,
      forcePasswordReset: true,
      hasCompletedOnboarding: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      organization: { select: { name: true } },
      department: { select: { name: true } },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: selectFields,
      }),
      prisma.user.count({ where: where as any }),
    ]);

    sendSuccess(res, {
      data: users.map(serializeUser),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[listUsers]');
    sendError(res, { error: 'Failed to fetch users', statusCode: 500 });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const selectFields = {
      id: true, email: true, firstName: true, lastName: true, role: true, phone: true,
      organizationId: true, departmentId: true, status: true, forcePasswordReset: true,
      hasCompletedOnboarding: true, avatar: true, createdAt: true, updatedAt: true,
      organization: { select: { name: true } }, department: { select: { name: true } },
    };
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: selectFields,
    });
    if (!user || user.status === 'DELETED') {
      sendNotFound(res, 'User not found');
      return;
    }
    sendSuccess(res, { data: serializeUser(user as Record<string, unknown>) });
  } catch (error: any) {
    logger.error({ err: error }, '[getUser]');
    sendError(res, { error: 'Failed to fetch user', statusCode: 500 });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = createUserSchema.parse({ body: req.body });
    const orgId = requireRequestOrgId(req);
    const user = await UserService.createUser({ ...body, organizationId: orgId });
    sendCreated(res, serializeUser({ ...user, organization: null, department: null }), 'User created successfully');
  } catch (error: any) {
    logger.error({ err: error }, '[createUser]');
    sendError(res, { error: 'Failed to create user', statusCode: 500 });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, body } = updateUserSchema.parse({ params: req.params, body: req.body });
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing || existing.status === 'DELETED') {
      sendNotFound(res, 'User not found');
      return;
    }
    const user = await UserService.updateUser(params.id, body);
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { organization: { select: { name: true } }, department: { select: { name: true } } },
    });
    sendSuccess(res, { data: serializeUser((full || user) as Record<string, unknown>), message: 'User updated successfully' });
  } catch (error: any) {
    logger.error({ err: error }, '[updateUser]');
    sendError(res, { error: 'Failed to update user', statusCode: 500 });
  }
};

export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      sendNotFound(res, 'User not found');
      return;
    }
    await UserService.suspendUser(params.id, true);
    sendSuccess(res, { data: null, message: 'User deactivated successfully' });
  } catch (error: any) {
    logger.error({ err: error }, '[deactivateUser]');
    sendError(res, { error: 'Failed to deactivate user', statusCode: 500 });
  }
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, body } = changeUserRoleSchema.parse({ params: req.params, body: req.body });
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing || existing.status === 'DELETED') {
      sendNotFound(res, 'User not found');
      return;
    }
    const user = await UserService.updateUser(params.id, { role: body.role });
    sendSuccess(res, { data: serializeUser(user as Record<string, unknown>), message: 'User role updated successfully' });
  } catch (error: any) {
    logger.error({ err: error }, '[changeUserRole]');
    sendError(res, { error: 'Failed to change user role', statusCode: 500 });
  }
};

export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      sendNotFound(res, 'User not found');
      return;
    }
    const rolesData = await RoleService.getRoles();
    const roleRecord = rolesData.find((r: Record<string, unknown>) => r.name === user.role);
    const permissions = roleRecord ? (roleRecord.permissions as { name: string }[]).map((p) => p.name) : [];
    sendSuccess(res, {
      data: serializeUserPermissions({ userId: user.id, role: user.role, permissions }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getUserPermissions]');
    sendError(res, { error: 'Failed to fetch user permissions', statusCode: 500 });
  }
};
