import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { OrganizationService } from '../../services/admin/organization.service';
import { DepartmentService } from '../../services/admin/department.service';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendBadRequest } from '../common/response';
import { createOrganizationSchema, updateOrganizationSchema, createDepartmentSchema } from './validators';
import { serializeOrganization, serializeOrganizationDetail, serializeDepartment, serializeOrganizationUsage } from './serializers';

export const listOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orgs = await OrganizationService.getOrganizations();
    sendSuccess(res, { data: orgs.map(serializeOrganization) });
  } catch (error: any) {
    logger.error({ err: error }, '[listOrganizations]');
    sendError(res, { error: 'Failed to fetch organizations', statusCode: 500 });
  }
};

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendBadRequest(res, 'Organization ID is required');
      return;
    }
    const org = await OrganizationService.getOrganizationById(id);
    if (!org) {
      sendNotFound(res, 'Organization not found');
      return;
    }
    sendSuccess(res, { data: serializeOrganizationDetail(org) });
  } catch (error: any) {
    logger.error({ err: error }, '[getOrganization]');
    sendError(res, { error: 'Failed to fetch organization', statusCode: 500 });
  }
};

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = createOrganizationSchema.parse({ body: req.body });
    const org = await OrganizationService.createOrganization(body);
    sendCreated(res, serializeOrganization(org as Record<string, unknown>), 'Organization created successfully');
  } catch (error: any) {
    logger.error({ err: error }, '[createOrganization]');
    sendError(res, { error: 'Failed to create organization', statusCode: 500 });
  }
};

export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, body } = updateOrganizationSchema.parse({ params: req.params, body: req.body });
    const org = await OrganizationService.getOrganizationById(params.id);
    if (!org) {
      sendNotFound(res, 'Organization not found');
      return;
    }
    const updated = await OrganizationService.updateOrganization(params.id, body);
    sendSuccess(res, { data: serializeOrganization(updated as Record<string, unknown>), message: 'Organization updated successfully' });
  } catch (error: any) {
    logger.error({ err: error }, '[updateOrganization]');
    sendError(res, { error: 'Failed to update organization', statusCode: 500 });
  }
};

export const deactivateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendBadRequest(res, 'Organization ID is required');
      return;
    }
    const org = await OrganizationService.getOrganizationById(id);
    if (!org) {
      sendNotFound(res, 'Organization not found');
      return;
    }
    await OrganizationService.suspendOrganization(id, true);
    sendSuccess(res, { data: null, message: 'Organization deactivated successfully' });
  } catch (error: any) {
    logger.error({ err: error }, '[deactivateOrganization]');
    sendError(res, { error: 'Failed to deactivate organization', statusCode: 500 });
  }
};

export const listDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendBadRequest(res, 'Organization ID is required');
      return;
    }
    const departments = await DepartmentService.getDepartments(id);
    sendSuccess(res, { data: departments.map(serializeDepartment) });
  } catch (error: any) {
    logger.error({ err: error }, '[listDepartments]');
    sendError(res, { error: 'Failed to fetch departments', statusCode: 500 });
  }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params, body } = createDepartmentSchema.parse({ params: req.params, body: req.body });
    const org = await OrganizationService.getOrganizationById(params.id);
    if (!org) {
      sendNotFound(res, 'Organization not found');
      return;
    }
    const dept = await DepartmentService.createDepartment({
      ...body,
      organizationId: params.id,
    });
    sendCreated(res, serializeDepartment(dept as Record<string, unknown>), 'Department created successfully');
  } catch (error: any) {
    logger.error({ err: error }, '[createDepartment]');
    sendError(res, { error: 'Failed to create department', statusCode: 500 });
  }
};

export const getOrganizationUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      sendBadRequest(res, 'Organization ID is required');
      return;
    }
    const org = await OrganizationService.getOrganizationById(id);
    if (!org) {
      sendNotFound(res, 'Organization not found');
      return;
    }
    const usage = await OrganizationService.getOrganizationAnalytics(id);
    sendSuccess(res, { data: serializeOrganizationUsage(usage as Record<string, unknown>) });
  } catch (error: any) {
    logger.error({ err: error }, '[getOrganizationUsage]');
    sendError(res, { error: 'Failed to fetch organization usage', statusCode: 500 });
  }
};
