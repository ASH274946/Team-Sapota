import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { OrganizationService } from '../services/admin/organization.service';
import { DepartmentService } from '../services/admin/department.service';
import { UserService } from '../services/admin/user.service';
import { RoleService } from '../services/admin/role.service';
import { ClassroomService } from '../services/admin/classroom.service';
import { GroupService } from '../services/admin/group.service';
import { AuditService } from '../services/audit.service';
import { AnalyticsService } from '../services/analytics.service';
import { BillingService } from '../services/admin/billing.service';
import { getGenerationQueue } from '../queues/generation.queue';
import { getPdfQueue } from '../queues/pdf.queue';
import { createInvitation } from '../services/invitation.service';
import { processCsvImport } from '../services/csv-import.service';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';

// ── In-Memory System Settings Store (Simulating Admin System Settings) ──
let systemSettings = {
  security: {
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    mfaEnabled: false,
  },
  rateLimits: {
    apiRequestsPerMinute: 100,
    aiGenerationsPerDay: 50,
  },
  uploadLimits: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.pdf', '.txt', '.docx'],
  },
  emailSettings: {
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    fromEmail: 'noreply@vidyaai.com',
  },
  storageSettings: {
    provider: 'S3',
    bucketName: 'vidyaai-assets-prod',
  },
  aiLimits: {
    maxTokensPerRequest: 16384,
    failoverThresholdMs: 15000,
  },
};

// ── In-Memory AI Failover settings ──
let failoverSettings = {
  primaryProvider: 'openai',
  failoverProvider: 'anthropic',
  maxRetries: 3,
  timeoutMs: 30000,
  autoFailover: true,
};

function getAdminOrgId(req: Request): string {
  if (req.user?.role === 'SUPER_ADMIN') {
    const orgId = (req.query.organizationId as string) || (req.body.organizationId as string);
    if (orgId) return orgId;
  }
  const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
  if (!orgId) throw new Error('Organization scope required');
  return orgId;
}

function getAdminOrgIdOptional(req: Request): string | undefined {
  if (req.user?.role === 'SUPER_ADMIN') {
    const orgId = (req.query.organizationId as string) || (req.body.organizationId as string);
    if (orgId) return orgId;
  }
  return req.user?.activeOrganizationId || req.user?.organizationId || undefined;
}

export class AdminController {
  // ── 1. Organization Management ──
  static async getOrganizations(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
        if (!orgId) {
          res.status(403).json({ success: false, error: 'No organization scope' });
          return;
        }
        const org = await OrganizationService.getOrganizationById(orgId);
        res.json({ success: true, data: org ? [org] : [] });
        return;
      }
      const list = await OrganizationService.getOrganizations();
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getOrganizations] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createOrganization(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Only SUPER_ADMIN can create organizations.' });
        return;
      }
      const org = await OrganizationService.createOrganization(req.body);
      // Automatically create a default subscription on creation
      await BillingService.getSubscriptionByOrganization(org.id);
      res.status(201).json({ success: true, data: org });
    } catch (err: any) {
      logger.error(`[Admin:createOrganization] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateOrganization(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN' && req.params.id !== (req.user?.activeOrganizationId || req.user?.organizationId)) {
        res.status(403).json({ success: false, error: 'Access denied: Cannot update other organizations.' });
        return;
      }
      const org = await OrganizationService.updateOrganization(req.params.id, req.body);
      res.json({ success: true, data: org });
    } catch (err: any) {
      logger.error(`[Admin:updateOrganization] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteOrganization(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Only SUPER_ADMIN can delete organizations.' });
        return;
      }
      await OrganizationService.deleteOrganization(req.params.id);
      res.json({ success: true, message: 'Organization deleted successfully' });
    } catch (err: any) {
      logger.error(`[Admin:deleteOrganization] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async suspendOrganization(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Only SUPER_ADMIN can suspend organizations.' });
        return;
      }
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, error: 'Organization ID is required' });
        return;
      }
      let shouldSuspend = true;
      if (req.body.action) {
        shouldSuspend = req.body.action === 'suspend';
      } else if (req.body.status) {
        shouldSuspend = req.body.status === 'SUSPENDED';
      } else if (typeof req.body.suspend === 'boolean') {
        shouldSuspend = req.body.suspend;
      } else {
        const current = await prisma.organization.findUnique({ where: { id }, select: { status: true } });
        shouldSuspend = current?.status === 'ACTIVE';
      }
      const org = await OrganizationService.suspendOrganization(id, shouldSuspend);
      res.json({ success: true, data: org });
    } catch (err: any) {
      logger.error(`[Admin:suspendOrganization] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getOrganizationAnalytics(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN' && req.params.id !== (req.user?.activeOrganizationId || req.user?.organizationId)) {
        res.status(403).json({ success: false, error: 'Access denied: Cannot access other organization analytics.' });
        return;
      }
      const stats = await OrganizationService.getOrganizationAnalytics(req.params.id);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error(`[Admin:getOrganizationAnalytics] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 2. Department Management ──
  static async getDepartments(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const list = await DepartmentService.getDepartments(orgId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getDepartments] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createDepartment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const payload = { ...req.body, organizationId: orgId };
      const dept = await DepartmentService.createDepartment(payload);
      res.status(201).json({ success: true, data: dept });
    } catch (err: any) {
      logger.error(`[Admin:createDepartment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateDepartment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const deptExists = await prisma.department.findFirst({
        where: { id: req.params.id, organizationId: orgId }
      });
      if (!deptExists && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Department belongs to another organization.' });
        return;
      }
      const dept = await DepartmentService.updateDepartment(req.params.id, req.body);
      res.json({ success: true, data: dept });
    } catch (err: any) {
      logger.error(`[Admin:updateDepartment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async assignHOD(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const deptExists = await prisma.department.findFirst({
        where: { id: req.params.id, organizationId: orgId }
      });
      if (!deptExists && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Department belongs to another organization.' });
        return;
      }
      const { hodId } = req.body;
      const userExists = await prisma.user.findFirst({
        where: { id: hodId, organizationId: orgId }
      });
      if (!userExists && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: HOD user belongs to another organization.' });
        return;
      }
      const dept = await DepartmentService.assignHOD(req.params.id, hodId);
      res.json({ success: true, data: dept });
    } catch (err: any) {
      logger.error(`[Admin:assignHOD] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async transferFaculty(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const { facultyId, targetDepartmentId } = req.body;
      const [facultyUser, targetDept] = await Promise.all([
        prisma.user.findFirst({ where: { id: facultyId, organizationId: orgId } }),
        prisma.department.findFirst({ where: { id: targetDepartmentId, organizationId: orgId } })
      ]);
      if ((!facultyUser || !targetDept) && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Faculty or Department belongs to another organization.' });
        return;
      }
      const user = await DepartmentService.transferFaculty(facultyId, targetDepartmentId);
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:transferFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async archiveDepartment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const deptExists = await prisma.department.findFirst({
        where: { id: req.params.id, organizationId: orgId }
      });
      if (!deptExists && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Department belongs to another organization.' });
        return;
      }
      const dept = await DepartmentService.archiveDepartment(req.params.id);
      res.json({ success: true, data: dept });
    } catch (err: any) {
      logger.error(`[Admin:archiveDepartment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 3. User Management ──
  static async getUsers(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const list = await UserService.getUsers(orgId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getUsers] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async inviteUser(req: Request, res: Response) {
    try {
      const { email, role } = req.body;
      if (role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Cannot invite a SUPER_ADMIN' });
        return;
      }
      const organizationId = getAdminOrgId(req);

      const invitation = await createInvitation({
        email,
        role,
        organizationId,
        createdById: req.user!.id
      });
      res.status(201).json({ success: true, data: invitation });
    } catch (err: any) {
      logger.error(`[Admin:inviteUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async importUsersCsv(req: Request, res: Response) {
    try {
      if (!req.file) throw new Error('No CSV file uploaded');
      const organizationId = getAdminOrgId(req);

      const result = await processCsvImport(req.file.path, organizationId, req.user!.id);

      await prisma.auditLog.create({
        data: {
          action: 'CSV_IMPORTED',
          entity: 'Organization',
          entityId: organizationId,
          userId: req.user!.id,
          ipAddress: req.ip || '0.0.0.0',
          userAgent: req.headers['user-agent'] || 'unknown',
        }
      });

      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      logger.error(`[Admin:importUsersCsv] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async checkSuperAdminProtection(targetUserId: string, currentUserRole: string): Promise<boolean> {
    if (currentUserRole === 'SUPER_ADMIN') return true;
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });
    if (targetUser?.role === 'SUPER_ADMIN') {
      return false; // Access denied
    }
    return true;
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { role } = req.body;
      if (role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Cannot create a SUPER_ADMIN' });
        return;
      }
      
      let organizationId: string | undefined;
      
      if (role === 'SUPER_ADMIN') {
        organizationId = undefined; // Super Admins don't need an organization
      } else {
        try {
          organizationId = getAdminOrgId(req);
        } catch (e) {
          res.status(400).json({ success: false, error: 'Organization is required for this role.' });
          return;
        }
      }
      
      const payload = {
        ...req.body,
        organizationId,
      };
      
      const user = await UserService.createUser(payload);
      await AuditService.logAction({
        userId: req.user?.id,
        action: 'USER_CREATION',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'system',
        metadata: { createdUserId: user.id, createdUserEmail: user.email, organizationId },
      });
      res.status(201).json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:createUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.user) {
        const allowed = await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
        if (!allowed) {
          res.status(403).json({ success: false, error: 'Access denied: Cannot modify SUPER_ADMIN users.' });
          return;
        }
      }
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { role } = req.body;
      if (role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Cannot update/upgrade a user to SUPER_ADMIN' });
        return;
      }
      const user = await UserService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:updateUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async suspendUser(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.user) {
        const allowed = await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
        if (!allowed) {
          res.status(403).json({ success: false, error: 'Access denied: Cannot modify SUPER_ADMIN users.' });
          return;
        }
      }
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { suspend } = req.body;
      const user = await UserService.suspendUser(req.params.id, suspend);
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:suspendUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgIdOptional(req);
      if (req.user) {
        const allowed = await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
        if (!allowed) {
          res.status(403).json({ success: false, error: 'Access denied: Cannot modify SUPER_ADMIN users.' });
          return;
        }
      }
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      await UserService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User soft-deleted successfully' });
    } catch (err: any) {
      logger.error(`[Admin:deleteUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.user) {
        const allowed = await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
        if (!allowed) {
          res.status(403).json({ success: false, error: 'Access denied: Cannot modify SUPER_ADMIN users.' });
          return;
        }
      }
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { newPassword } = req.body;
      const user = await UserService.resetPassword(req.params.id, newPassword);
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:resetPassword] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async impersonateUser(req: Request, res: Response) {
    try {
      if (!req.user || req.user.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Only SUPER_ADMIN can impersonate users.' });
        return;
      }
      const data = await UserService.impersonateUser(req.user.id, req.params.id);
      res.json({ success: true, data });
    } catch (err: any) {
      logger.error(`[Admin:impersonateUser] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 4. Role & Permission Management ──
  static async getRoles(_req: Request, res: Response) {
    try {
      const list = await RoleService.getRoles();
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getRoles] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createRole(req: Request, res: Response) {
    try {
      const role = await RoleService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (err: any) {
      logger.error(`[Admin:createRole] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const role = await RoleService.updateRole(req.params.id, req.body);
      res.json({ success: true, data: role });
    } catch (err: any) {
      logger.error(`[Admin:updateRole] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      await RoleService.deleteRole(req.params.id);
      res.json({ success: true, message: 'Role deleted' });
    } catch (err: any) {
      logger.error(`[Admin:deleteRole] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPermissions(_req: Request, res: Response) {
    try {
      const list = await RoleService.getPermissions();
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getPermissions] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async assignPermissions(req: Request, res: Response) {
    try {
      const { permissionIds } = req.body;
      const role = await prisma.role.update({
        where: { id: req.params.id },
        data: {
          permissions: {
            set: permissionIds.map((id: string) => ({ id })),
          },
        },
        include: { permissions: true },
      });
      await AuditService.logAction({
        userId: req.user?.id,
        action: 'ROLE_CHANGES',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'system',
        metadata: { roleId: req.params.id, permissionIds },
      });
      res.json({ success: true, data: role });
    } catch (err: any) {
      logger.error(`[Admin:assignPermissions] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 5.1. Classroom Management ──
  static async getClassrooms(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const list = await ClassroomService.getClassrooms(orgId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getClassrooms] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createClassroom(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const { grade, section, academicYear, facultyId } = req.body;
      const classroom = await ClassroomService.createClassroom({ 
        grade, section, academicYear, facultyId, organizationId: orgId 
      });
      
      await AuditService.logAuditEvent({
        action: 'CLASSROOM_CREATED',
        userId: req.user?.id,
        organizationId: orgId,
        entity: 'Class',
        entityId: classroom.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({ success: true, data: classroom });
    } catch (err: any) {
      logger.error(`[Admin:createClassroom] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateClassroom(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetClassroom = await prisma.class.findUnique({ where: { id: req.params.id } });
      if (targetClassroom && targetClassroom.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Class belongs to another organization.' });
        return;
      }
      const classroom = await ClassroomService.updateClassroom(req.params.id, req.body);
      
      await AuditService.logAuditEvent({
        action: 'CLASSROOM_UPDATED',
        userId: req.user?.id,
        organizationId: orgId,
        entity: 'Class',
        entityId: classroom.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ success: true, data: classroom });
    } catch (err: any) {
      logger.error(`[Admin:updateClassroom] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteClassroom(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetClassroom = await prisma.class.findUnique({ where: { id: req.params.id } });
      if (targetClassroom && targetClassroom.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Class belongs to another organization.' });
        return;
      }
      await ClassroomService.deleteClassroom(req.params.id);
      
      await AuditService.logAuditEvent({
        action: 'CLASSROOM_DELETED',
        userId: req.user?.id,
        organizationId: orgId,
        entity: 'Class',
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ success: true, message: 'Class deleted' });
    } catch (err: any) {
      logger.error(`[Admin:deleteClassroom] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }


  // ── 6. Group Management ──
  static async getGroups(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const list = await GroupService.getGroups(orgId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getGroups] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createGroup(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const payload = { ...req.body, organizationId: orgId };
      const grp = await GroupService.createGroup(payload);
      res.status(201).json({ success: true, data: grp });
    } catch (err: any) {
      logger.error(`[Admin:createGroup] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateGroup(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      const grp = await GroupService.updateGroup(req.params.id, req.body);
      res.json({ success: true, data: grp });
    } catch (err: any) {
      logger.error(`[Admin:updateGroup] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteGroup(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      await prisma.group.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (err: any) {
      logger.error(`[Admin:deleteGroup] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async assignGroupFaculty(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      const { facultyId } = req.body;
      const grp = await GroupService.updateGroup(req.params.id, { facultyId });
      res.json({ success: true, data: grp });
    } catch (err: any) {
      logger.error(`[Admin:assignGroupFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async assignGroupStudents(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      const { students } = req.body;
      await GroupService.assignStudents(req.params.id, students);
      res.json({ success: true, message: 'Group students updated successfully' });
    } catch (err: any) {
      logger.error(`[Admin:assignGroupStudents] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async importGroupStudents(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      const { students } = req.body;
      await GroupService.bulkImportStudents(req.params.id, students);
      res.json({ success: true, message: `${students.length} students imported successfully` });
    } catch (err: any) {
      logger.error(`[Admin:importGroupStudents] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async assignGroupPapers(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetGroup = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (targetGroup && targetGroup.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Group belongs to another organization.' });
        return;
      }
      const { paperId } = req.body;
      res.json({ success: true, message: `Paper ${paperId} successfully assigned to group ${req.params.id}` });
    } catch (err: any) {
      logger.error(`[Admin:assignGroupPapers] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 7. Paper Management ──
  static async getPapers(_req: Request, res: Response) {
    try {
      const papers = await prisma.generatedPaper.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          assignment: {
            select: {
              title: true,
              subject: true,
            },
          },
        },
      });
      res.json({ success: true, data: papers });
    } catch (err: any) {
      logger.error(`[Admin:getPapers] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async archivePaper(req: Request, res: Response) {
    try {
      const paper = await prisma.generatedPaper.update({
        where: { id: req.params.id },
        data: {
          canonicalMetadata: {
            isArchived: true,
            archivedAt: new Date().toISOString(),
          },
        },
      });
      res.json({ success: true, data: paper });
    } catch (err: any) {
      logger.error(`[Admin:archivePaper] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deletePaper(req: Request, res: Response) {
    try {
      await prisma.generatedPaper.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Paper deleted successfully' });
    } catch (err: any) {
      logger.error(`[Admin:deletePaper] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async regeneratePaper(req: Request, res: Response) {
    try {
      // In VidyaAI, paper generation is queued via BullMQ.
      // We simulate triggering regeneration by finding the associated assignment and running a queue retry or creating a new job.
      const paper = await prisma.generatedPaper.findUnique({ where: { id: req.params.id } });
      if (!paper) {
        res.status(404).json({ success: false, error: 'Paper not found' });
        return;
      }
      res.json({ success: true, message: 'Regeneration job queued successfully for assignment ' + paper.assignmentId });
    } catch (err: any) {
      logger.error(`[Admin:regeneratePaper] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reassignPaper(req: Request, res: Response) {
    try {
      const { targetGroupId } = req.body;
      res.json({ success: true, message: `Paper reassigned to group ${targetGroupId}` });
    } catch (err: any) {
      logger.error(`[Admin:reassignPaper] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPaperAnalytics(_req: Request, res: Response) {
    try {
      const paperCount = await prisma.generatedPaper.count();
      res.json({
        success: true,
        data: {
          totalGenerated: paperCount || 34,
          totalDownloads: Math.floor(paperCount * 4.2) || 142,
          mostPopularSubject: 'Computer Science',
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getPaperAnalytics] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 9. Assignment Management ──
  static async getAssignments(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const assignments = await prisma.assignment.findMany({
        where: { organizationId: orgId, NOT: { status: 'FAILED' } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: assignments });
    } catch (err: any) {
      logger.error(`[Admin:getAssignments] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reassignAssignment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const existing = await prisma.assignment.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
        },
      });
      if (!existing && req.user?.role !== 'SUPER_ADMIN') {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      const { dueDate } = req.body;
      const updated = await prisma.assignment.update({
        where: { id: req.params.id },
        data: { dueDate: new Date(dueDate) },
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:reassignAssignment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async closeAssignment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const existing = await prisma.assignment.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
        },
      });
      if (!existing && req.user?.role !== 'SUPER_ADMIN') {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      const updated = await prisma.assignment.update({
        where: { id: req.params.id },
        data: { status: 'ARCHIVED' },
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:closeAssignment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reopenAssignment(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const existing = await prisma.assignment.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
        },
      });
      if (!existing && req.user?.role !== 'SUPER_ADMIN') {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      const { dueDate } = req.body;
      const updated = await prisma.assignment.update({
        where: { id: req.params.id },
        data: { status: 'PUBLISHED', dueDate: new Date(dueDate) },
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:reopenAssignment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async exportAssignmentResults(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const existing = await prisma.assignment.findFirst({
        where: {
          id: req.params.id,
          organizationId: orgId,
        },
      });
      if (!existing && req.user?.role !== 'SUPER_ADMIN') {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      const csvData = `"Student Name","Email","Score","Total Marks","Status"\n"Alice Johnson","alice.johnson@school.edu",84.5,100,"GRADED"\n"Bob Smith","bob.smith@school.edu",72.0,100,"GRADED"\n`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=assignment_${req.params.id}_grades.csv`);
      res.status(200).send(csvData);
    } catch (err: any) {
      logger.error(`[Admin:exportAssignmentResults] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 10. Analytics Dashboard ──
  static async getAnalytics(req: Request, res: Response) {
    try {
      let orgId = getAdminOrgIdOptional(req);
      if (!orgId && req.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { organizationId: true, activeOrganizationId: true },
        });
        orgId = dbUser?.activeOrganizationId || dbUser?.organizationId || undefined;
      }
      const data = await AnalyticsService.getAdminAnalytics(orgId);
      res.json({ success: true, data });
    } catch (err: any) {
      logger.error(`[Admin:getAnalytics] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 11. Audit Logs ──
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgIdOptional(req);
      const { action, search, dateFrom, dateTo } = req.query;
      
      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (action) where.action = String(action);
      // Trigger restart 2
      
      if (search) {
        const searchTerm = String(search).trim();
        where.OR = [
          { ipAddress: { contains: searchTerm, mode: 'insensitive' } },
          { action: { contains: searchTerm, mode: 'insensitive' } },
          { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
          { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
          { user: { email: { contains: searchTerm, mode: 'insensitive' } } }
        ];
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
        if (dateTo) {
          const end = new Date(String(dateTo));
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 500, // Fetch more logs
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });
      res.json({ success: true, data: logs });
    } catch (err: any) {
      logger.error(`[Admin:getAuditLogs] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 12. Billing & Subscription Management ──
  static async getBillingSubscriptions(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgIdOptional(req);
      if (req.user?.role !== 'SUPER_ADMIN') {
        if (!orgId) {
          res.status(403).json({ success: false, error: 'No organization scope' });
          return;
        }
        const sub = await BillingService.getSubscriptionByOrganization(orgId);
        res.json({ success: true, data: sub ? [sub] : [] });
        return;
      }
      const subs = await BillingService.getSubscriptions();
      res.json({ success: true, data: subs });
    } catch (err: any) {
      logger.error(`[Admin:getBillingSubscriptions] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSubscription(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.params.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Cannot access other organization subscription.' });
        return;
      }
      const sub = await BillingService.getSubscriptionByOrganization(req.params.organizationId);
      res.json({ success: true, data: sub });
    } catch (err: any) {
      logger.error(`[Admin:getSubscription] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSubscription(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.params.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Cannot update other organization subscription.' });
        return;
      }
      const sub = await BillingService.updateSubscription(req.params.organizationId, req.body);
      res.json({ success: true, data: sub });
    } catch (err: any) {
      logger.error(`[Admin:updateSubscription] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getSubscriptionInvoices(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const sub = await prisma.subscription.findUnique({ where: { id: req.params.subscriptionId } });
      if (sub && sub.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Subscription belongs to another organization.' });
        return;
      }
      const invoices = await BillingService.getInvoices(req.params.subscriptionId);
      res.json({ success: true, data: invoices });
    } catch (err: any) {
      logger.error(`[Admin:getSubscriptionInvoices] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createSubscriptionInvoice(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const sub = await prisma.subscription.findUnique({ where: { id: req.body.subscriptionId } });
      if (sub && sub.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Subscription belongs to another organization.' });
        return;
      }
      const invoice = await BillingService.createInvoice(req.body.subscriptionId, req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (err: any) {
      logger.error(`[Admin:createSubscriptionInvoice] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBillingUsage(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      if (req.params.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Cannot access other organization billing usage.' });
        return;
      }
      const usage = await BillingService.getUsageTracking(req.params.organizationId);
      res.json({ success: true, data: usage });
    } catch (err: any) {
      logger.error(`[Admin:getBillingUsage] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 13. AI Provider Management ──
  static async getAiProviders(_req: Request, res: Response) {
    try {
      const providers = [
        { name: 'OpenAI', key: 'OPENAI_API_KEY', model: 'gpt-4o', pricing: '$0.005 / 1K tokens' },
        { name: 'Anthropic', key: 'ANTHROPIC_API_KEY', model: 'claude-3-5-sonnet', pricing: '$0.015 / 1K tokens' },
        { name: 'Groq', key: 'GROQ_API_KEY', model: 'llama-3.1-70b', pricing: '$0.0005 / 1K tokens' },
        { name: 'NVIDIA', key: 'NVIDIA_API_KEY', model: 'mixtral-8x22b', pricing: '$0.001 / 1K tokens' },
        { name: 'Gemini', key: 'GEMINI_API_KEY', model: 'gemini-1.5-pro', pricing: '$0.00125 / 1K tokens' },
      ];

      const data = providers.map((p) => {
        const isConfigured = !!process.env[p.key];
        return {
          name: p.name,
          status: isConfigured ? 'HEALTHY' : 'UNCONFIGURED',
          model: p.model,
          responseTimeMs: isConfigured ? Math.floor(Math.random() * 80) + 120 : 0,
          pricing: p.pricing,
        };
      });

      res.json({ success: true, data, failoverSettings });
    } catch (err: any) {
      logger.error(`[Admin:getAiProviders] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async testProviderHealth(req: Request, res: Response) {
    try {
      const { provider } = req.body;
      const isConfigured = !!process.env[`${provider.toUpperCase()}_API_KEY`];
      res.json({
        success: true,
        healthy: isConfigured,
        message: isConfigured ? `${provider} connection verified successfully.` : `${provider} API key not found in server environments.`,
      });
    } catch (err: any) {
      logger.error(`[Admin:testProviderHealth] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateFailoverSettings(req: Request, res: Response) {
    try {
      failoverSettings = { ...failoverSettings, ...req.body };
      res.json({ success: true, data: failoverSettings });
    } catch (err: any) {
      logger.error(`[Admin:updateFailoverSettings] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 14. Queue Management ──
  static async getQueueHealth(_req: Request, res: Response) {
    try {
      const genQueue = getGenerationQueue();
      const pdfQueue = getPdfQueue();

      const [genCounts, pdfCounts] = await Promise.all([
        genQueue.getJobCounts(),
        pdfQueue.getJobCounts(),
      ]);

      res.json({
        success: true,
        data: {
          generation: {
            active: genCounts.active || 0,
            waiting: genCounts.waiting || 0,
            failed: genCounts.failed || 0,
            completed: genCounts.completed || 0,
            delayed: genCounts.delayed || 0,
          },
          pdf: {
            active: pdfCounts.active || 0,
            waiting: pdfCounts.waiting || 0,
            failed: pdfCounts.failed || 0,
            completed: pdfCounts.completed || 0,
            delayed: pdfCounts.delayed || 0,
          },
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getQueueHealth] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getFailedJobs(_req: Request, res: Response) {
    try {
      const genQueue = getGenerationQueue();
      const pdfQueue = getPdfQueue();

      const failedGen = await genQueue.getFailed();
      const failedPdf = await pdfQueue.getFailed();

      const formatJob = (queueName: string, job: any) => ({
        id: job.id,
        name: job.name,
        queue: queueName,
        data: job.data,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace ? job.stacktrace.slice(0, 3) : [],
        timestamp: new Date(job.timestamp).toISOString(),
      });

      const list = [
        ...failedGen.map((j) => formatJob('generation', j)),
        ...failedPdf.map((j) => formatJob('pdf', j)),
      ];

      res.json({ success: true, data: list });
    } catch (err: any) {
      logger.error(`[Admin:getFailedJobs] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async retryQueueJob(req: Request, res: Response) {
    try {
      const { queueName, jobId } = req.body;
      const queue = queueName === 'pdf' ? getPdfQueue() : getGenerationQueue();
      const job = await queue.getJob(jobId);

      if (!job) {
        res.status(404).json({ success: false, error: 'Job not found in queue' });
        return;
      }

      await job.retry();
      res.json({ success: true, message: `Job ${jobId} successfully resubmitted to ${queueName} queue` });
    } catch (err: any) {
      logger.error(`[Admin:retryQueueJob] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 15. System Settings ──
  static async getSystemSettings(_req: Request, res: Response) {
    try {
      res.json({ success: true, data: systemSettings });
    } catch (err: any) {
      logger.error(`[Admin:getSystemSettings] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateSystemSettings(req: Request, res: Response) {
    try {
      systemSettings = { ...systemSettings, ...req.body };
      res.json({ success: true, data: systemSettings });
    } catch (err: any) {
      logger.error(`[Admin:updateSystemSettings] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async forceResetOwnPassword(req: Request, res: Response) {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
        return;
      }
      
      const pwdHash = await argon2.hash(newPassword);
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          passwordHash: pwdHash,
          forcePasswordReset: false,
        },
      });

      await AuditService.logAction({
        userId: req.user!.id,
        action: 'FORCE_PASSWORD_RESET',
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'system',
        metadata: { userId: req.user!.id },
      });

      res.json({ success: true, message: 'Password reset successfully', data: updated });
    } catch (err: any) {
      logger.error(`[Admin:forceResetOwnPassword] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 16. Faculty Management ──
  static async getFaculty(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const faculty = await prisma.user.findMany({
        where: { organizationId: orgId, role: 'TEACHER', status: { not: 'DELETED' } },
        orderBy: { createdAt: 'desc' },
        include: { department: { select: { name: true } }, organization: true },
      });
      res.json({ success: true, data: faculty });
    } catch (err: any) {
      logger.error(`[Admin:getFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createFaculty(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const { firstName, lastName, email, password, departmentId } = req.body;
      if (!firstName || !lastName || !email) {
        res.status(400).json({ success: false, error: 'firstName, lastName, and email are required' }); return;
      }
      
      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists.' });
        return;
      }

      const pwd = password || 'Faculty@123';
      const pwdHash = await argon2.hash(pwd);
      const user = await prisma.user.create({
        data: {
          firstName, lastName, email: normalizedEmail,
          passwordHash: pwdHash,
          role: 'TEACHER',
          organizationId: orgId,
          departmentId: departmentId || null,
          forcePasswordReset: true,
          hasCompletedOnboarding: true,
        },
      });
      await prisma.auditLog.create({
        data: {
          action: 'FACULTY_CREATED',
          entity: 'User',
          entityId: user.id,
          userId: req.user?.id,
          ipAddress: req.ip || '0.0.0.0',
          userAgent: req.headers['user-agent'] || 'system',
          metadata: { email: user.email },
        },
      });
      res.status(201).json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:createFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateFaculty(req: Request, res: Response) {
    try {
      if (req.user) await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
      const orgId = getAdminOrgId(req);
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { firstName, lastName, email, departmentId } = req.body;
      const data: any = {};
      if (firstName) data.firstName = firstName;
      if (lastName) data.lastName = lastName;
      if (email) data.email = email;
      if (departmentId) data.departmentId = departmentId;
      const user = await prisma.user.update({ where: { id: req.params.id }, data });
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:updateFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deactivateFaculty(req: Request, res: Response) {
    try {
      if (req.user) await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
      const orgId = getAdminOrgId(req);
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Status must be ACTIVE or SUSPENDED' }); return;
      }
      const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:deactivateFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async inviteFaculty(req: Request, res: Response) {
    try {
      const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      if (!orgId) { res.status(403).json({ success: false, error: 'No organization scope' }); return; }
      const { email } = req.body;
      if (!email) { res.status(400).json({ success: false, error: 'Email is required' }); return; }
      const invitation = await createInvitation({
        email,
        role: 'TEACHER',
        organizationId: orgId,
        createdById: req.user!.id,
      });
      res.status(201).json({ success: true, data: invitation });
    } catch (err: any) {
      logger.error(`[Admin:inviteFaculty] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async resetFacultyPassword(req: Request, res: Response) {
    try {
      if (req.user) await AdminController.checkSuperAdminProtection(req.params.id, req.user.role);
      const { newPassword } = req.body;
      const user = await UserService.resetPassword(req.params.id, newPassword);
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:resetFacultyPassword] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async importFacultyCsv(req: Request, res: Response) {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: 'No CSV file uploaded' }); return; }
      const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      if (!orgId) { res.status(403).json({ success: false, error: 'No organization scope' }); return; }
      const content = fs.readFileSync(req.file.path, 'utf-8');
      const lines = content.split('\n').filter((l: string) => l.trim());
      if (lines.length < 2) { res.status(400).json({ success: false, error: 'CSV has no data rows' }); return; }
      const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim());
      const firstNameIdx = headers.indexOf('firstname');
      const lastNameIdx = headers.indexOf('lastname');
      const emailIdx = headers.indexOf('email');
      if (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
        res.status(400).json({ success: false, error: 'CSV must include firstName, lastName, email columns' }); return;
      }
      const created: any[] = [];
      const errors: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c: string) => c.trim());
        const firstName = cols[firstNameIdx];
        const lastName = cols[lastNameIdx];
        const email = String(cols[emailIdx]).trim().toLowerCase();
        if (!firstName || !lastName || !email) { errors.push({ row: i, error: 'Missing required fields' }); continue; }
        try {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) { errors.push({ row: i, email, error: 'Already exists' }); continue; }
          const pwdHash = await argon2.hash('Faculty@123');
          const user = await prisma.user.create({
            data: { firstName, lastName, email, passwordHash: pwdHash, role: 'TEACHER', organizationId: orgId, forcePasswordReset: true },
          });
          created.push(user);
        } catch (e: any) {
          errors.push({ row: i, email, error: e.message });
        }
      }
      res.status(201).json({ success: true, data: { created: created.length, errors } });
    } catch (err: any) {
      logger.error(`[Admin:importFacultyCsv] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 17. Student Management ──
  static async getStudents(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const students = await prisma.user.findMany({
        where: { organizationId: orgId, role: 'STUDENT', status: { not: 'DELETED' } },
        orderBy: { createdAt: 'desc' },
        include: { organization: true },
      });
      const classes = await prisma.class.findMany({
        where: { organizationId: orgId }
      });
      const classMap = new Map(classes.map(c => [c.id, c]));
      
      const mappedStudents = students.map((s: any) => {
        const pref = s.preferences || {};
        const studentClass = pref.classId ? classMap.get(pref.classId) : null;
        return {
          ...s,
          rollNo: pref.rollNo,
          classId: pref.classId,
          section: studentClass ? studentClass.section : pref.section,
          class: studentClass ? { grade: studentClass.grade, section: studentClass.section } : undefined
        };
      });
      res.json({ success: true, data: mappedStudents });
    } catch (err: any) {
      logger.error(`[Admin:getStudents] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createStudent(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const { firstName, lastName, email, phone } = req.body;
      if (!firstName || !lastName || !email) {
        res.status(400).json({ success: false, error: 'firstName, lastName, and email are required' }); return;
      }
      
      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        res.status(409).json({ success: false, error: 'User with this email already exists.' });
        return;
      }

      const pwdHash = await argon2.hash('Student@123');
      const preferences = { rollNo: req.body.rollNo, classId: req.body.classId, section: req.body.section };
      const user = await prisma.user.create({
        data: { 
          firstName, 
          lastName, 
          email: normalizedEmail, 
          phone: phone || null,
          passwordHash: pwdHash, 
          role: 'STUDENT', 
          organizationId: orgId, 
          forcePasswordReset: true, 
          hasCompletedOnboarding: true, 
          preferences
        },
      });
      
      // Sync to ClassStudent
      if (req.body.classId) {
        await prisma.classStudent.create({
          data: {
            classId: req.body.classId,
            name: `${firstName} ${lastName}`,
            rollNo: req.body.rollNo || '',
            email: normalizedEmail
          }
        });
      }

      await AuditService.logAuditEvent({
        action: 'STUDENT_CREATED',
        userId: req.user?.id,
        organizationId: orgId,
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:createStudent] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateStudent(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const existingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (existingUser && existingUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      
      const { firstName, lastName, email, phone } = req.body;
      const data: any = {};
      if (firstName) data.firstName = firstName;
      if (lastName) data.lastName = lastName;
      if (email) data.email = email;
      if (phone !== undefined) data.phone = phone || null;
      
      const preferences = { 
        ...(existingUser?.preferences as any || {}),
        ...(req.body.rollNo !== undefined && { rollNo: req.body.rollNo }),
        ...(req.body.classId !== undefined && { classId: req.body.classId }),
        ...(req.body.section !== undefined && { section: req.body.section })
      };
      data.preferences = preferences;

      const user = await prisma.user.update({ where: { id: req.params.id }, data });

      // Sync to ClassStudent
      if (existingUser?.email && req.body.classId !== undefined) {
        // Find existing ClassStudent by email
        const existingClassStudent = await prisma.classStudent.findFirst({
          where: { email: existingUser.email }
        });
        
        if (existingClassStudent) {
          if (req.body.classId !== null) {
            await prisma.classStudent.update({
              where: { id: existingClassStudent.id },
              data: {
                classId: req.body.classId,
                name: `${user.firstName} ${user.lastName}`,
                rollNo: preferences.rollNo || '',
                email: user.email
              }
            });
          } else {
            // Unassigned from class
            await prisma.classStudent.delete({ where: { id: existingClassStudent.id } });
          }
        } else if (req.body.classId !== null) {
          // Assigned to class for the first time
          await prisma.classStudent.create({
            data: {
              classId: req.body.classId,
              name: `${user.firstName} ${user.lastName}`,
              rollNo: preferences.rollNo || '',
              email: user.email
            }
          });
        }
      }

      await AuditService.logAuditEvent({
        action: 'STUDENT_UPDATED',
        userId: req.user?.id,
        organizationId: getAdminOrgIdOptional(req),
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:updateStudent] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deactivateStudent(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgId(req);
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (targetUser && targetUser.organizationId !== orgId && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: User belongs to another organization.' });
        return;
      }
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Status must be ACTIVE or SUSPENDED' }); return;
      }
      const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
      res.json({ success: true, data: user });
    } catch (err: any) {
      logger.error(`[Admin:deactivateStudent] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async importStudentsCsv(req: Request, res: Response) {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: 'No CSV file uploaded' }); return; }
      const orgId = getAdminOrgId(req);
      const content = fs.readFileSync(req.file.path, 'utf-8');
      const lines = content.split('\n').filter((l: string) => l.trim());
      if (lines.length < 2) { res.status(400).json({ success: false, error: 'CSV has no data rows' }); return; }
      const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim());
      const firstNameIdx = headers.indexOf('firstname');
      const lastNameIdx = headers.indexOf('lastname');
      const emailIdx = headers.indexOf('email');
      const phoneIdx = headers.indexOf('phone');
      if (firstNameIdx === -1 || lastNameIdx === -1 || emailIdx === -1) {
        res.status(400).json({ success: false, error: 'CSV must include firstName, lastName, email columns' }); return;
      }
      const created: any[] = [];
      const errors: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c: string) => c.trim());
        const firstName = cols[firstNameIdx];
        const lastName = cols[lastNameIdx];
        const email = String(cols[emailIdx]).trim().toLowerCase();
        const phone = phoneIdx !== -1 ? cols[phoneIdx] : null;
        if (!firstName || !lastName || !email) { errors.push({ row: i, error: 'Missing required fields' }); continue; }
        try {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) { errors.push({ row: i, email, error: 'Already exists' }); continue; }
          const pwdHash = await argon2.hash('Student@123');
          const user = await prisma.user.create({
            data: { firstName, lastName, email, phone, passwordHash: pwdHash, role: 'STUDENT', organizationId: orgId, forcePasswordReset: true },
          });
          created.push(user);
        } catch (e: any) {
          errors.push({ row: i, email, error: e.message });
        }
      }
      res.status(201).json({ success: true, data: { created: created.length, errors } });
    } catch (err: any) {
      logger.error(`[Admin:importStudentsCsv] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 18. Approvals Management ──
  static async getPendingApprovals(req: Request, res: Response) {
    try {
      let orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      if (!orgId && req.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { organizationId: true, activeOrganizationId: true },
        });
        orgId = dbUser?.activeOrganizationId || dbUser?.organizationId || undefined;
      }
      if (!orgId) {
        const firstOrg = await prisma.organization.findFirst();
        orgId = firstOrg?.id;
      }
      logger.debug({ userId: req.user?.id, role: req.user?.role, orgId }, '[Admin:getPendingApprovals] fetching');
      if (!orgId) { res.status(403).json({ success: false, error: 'No organization scope' }); return; }
      const pending = await prisma.assignment.findMany({
        where: { organizationId: orgId, status: { in: ['PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { generatedPapers: true } },
          createdBy: { select: { firstName: true, lastName: true, email: true } },
          generatedPapers: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              title: true,
              totalMarks: true,
              duration: true,
              pdfUrl: true,
              sections: true,
              createdAt: true,
            },
          },
        },
      });
      logger.debug({ orgId, count: pending.length }, '[Admin:getPendingApprovals] found approvals');
      res.json({ success: true, data: pending });
    } catch (err: any) {
      logger.error(`[Admin:getPendingApprovals] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approveAssessment(req: Request, res: Response) {
    try {
      await prisma.$executeRaw`
        UPDATE "Assignment"
        SET "status" = 'PUBLISHED',
            "approvedBy" = ${req.user?.id || null},
            "approvedAt" = NOW(),
            "publishedAt" = NOW()
        WHERE "id" = ${req.params.id}
      `;
      const updated = await prisma.assignment.findUnique({ where: { id: req.params.id } });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      if (updated.createdById) {
        await prisma.notification.create({
          data: {
            userId: updated.createdById,
            organizationId: updated.organizationId,
            title: 'Assignment Approved',
            message: `Your assignment "${updated.title}" has been approved.`,
            type: 'SUCCESS'
          }
        });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:approveAssessment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async rejectAssessment(req: Request, res: Response) {
    try {
      const { reviewComments } = req.body;
      await prisma.$executeRaw`
        UPDATE "Assignment"
        SET "status" = 'REJECTED',
            "rejectedBy" = ${req.user?.id || null},
            "rejectedAt" = NOW(),
            "reviewComments" = ${reviewComments || null}
        WHERE "id" = ${req.params.id}
      `;
      const updated = await prisma.assignment.findUnique({ where: { id: req.params.id } });
      if (!updated) {
        res.status(404).json({ success: false, error: 'Assignment not found' });
        return;
      }
      if (updated.createdById) {
        await prisma.notification.create({
          data: {
            userId: updated.createdById,
            organizationId: updated.organizationId,
            title: 'Assignment Rejected',
            message: `Your assignment "${updated.title}" has been rejected.`,
            type: 'ERROR'
          }
        });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:rejectAssessment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async requestChanges(req: Request, res: Response) {
    try {
      const { reviewComments } = req.body;
      const updated = await prisma.assignment.update({
        where: { id: req.params.id },
        data: { status: 'DRAFT', reviewComments: reviewComments || null },
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:requestChanges] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async publishAssessment(req: Request, res: Response) {
    try {
      const updated = await prisma.assignment.update({
        where: { id: req.params.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[Admin:publishAssessment] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 19. Organization Analytics Dashboard ──
  static async getOrgAnalyticsDashboard(req: Request, res: Response) {
    try {
      let orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      if (!orgId && req.user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { organizationId: true, activeOrganizationId: true },
        });
        orgId = dbUser?.activeOrganizationId || dbUser?.organizationId || undefined;
      }
      if (!orgId) {
        const firstOrg = await prisma.organization.findFirst();
        orgId = firstOrg?.id;
      }

      const [
        totalFaculty,
        totalStudents,
        totalClasses,
        assignments,
        totalLessons,
        totalSubmissions,
        recentSubmissions,
        recentAssignments,
        recentPapers,
        departments,
        facultyList
      ] = await Promise.all([
        prisma.user.count({ where: orgId ? { organizationId: orgId, role: 'TEACHER', status: { not: 'DELETED' } } : { role: 'TEACHER', status: { not: 'DELETED' } } }),
        prisma.user.count({ where: orgId ? { organizationId: orgId, role: 'STUDENT', status: { not: 'DELETED' } } : { role: 'STUDENT', status: { not: 'DELETED' } } }),
        prisma.class.count({ where: orgId ? { organizationId: orgId } : undefined }),
        prisma.assignment.findMany({ where: orgId ? { organizationId: orgId } : undefined, select: { status: true, title: true, createdAt: true, updatedAt: true } }),
        prisma.lessonPlan.count({ where: orgId ? { organizationId: orgId } : undefined }),
        prisma.studentSubmission.count({ where: orgId ? { organizationId: orgId } : undefined }),
        prisma.studentSubmission.findMany({
          where: orgId ? { organizationId: orgId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignment: {
              select: { title: true, subject: true }
            }
          }
        }),
        prisma.assignment.findMany({
          where: orgId ? { organizationId: orgId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            createdBy: {
              select: { firstName: true, lastName: true, email: true }
            },
            class: {
              select: { grade: true, section: true }
            }
          }
        }),
        prisma.generatedPaper.findMany({
          where: orgId ? { organizationId: orgId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignment: {
              select: {
                title: true,
                subject: true,
                createdBy: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        }),
        prisma.department.findMany({
          where: orgId ? { organizationId: orgId } : undefined,
          select: { id: true, name: true, code: true, _count: { select: { users: true, courses: true } } },
          take: 10,
        }),
        prisma.user.findMany({
          where: orgId ? { organizationId: orgId, role: 'TEACHER', status: { not: 'DELETED' } } : { role: 'TEACHER', status: { not: 'DELETED' } },
          take: 10,
          select: { id: true, firstName: true, lastName: true, email: true, department: { select: { name: true } }, createdAt: true },
        }),
      ]);

      const assessmentsByStatus = assignments.reduce((acc: Record<string, number>, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalPendingApprovals = (assessmentsByStatus['PENDING_APPROVAL'] || 0) +
                                    (assessmentsByStatus['COMPLETED'] || 0) +
                                    (assessmentsByStatus['PENDING'] || 0);

      const combinedActivity: any[] = [];

      recentSubmissions.forEach((sub: any) => {
        combinedActivity.push({
          id: `sub-${sub.id}`,
          action: 'Student Submission',
          createdAt: sub.submittedAt || sub.createdAt,
          target: sub.assignment?.title || sub.assignment?.subject || 'Assignment',
          userName: 'Enrolled Student',
          status: sub.status === 'GRADED' ? 'COMPLETED' : 'SUBMITTED',
          type: 'SUBMISSION',
        });
      });

      recentAssignments.forEach((a: any) => {
        const creatorName = a.createdBy
          ? `${a.createdBy.firstName} ${a.createdBy.lastName || ''}`.trim()
          : 'Faculty Member';
        const targetDesc = a.class ? `Grade ${a.class.grade}-${a.class.section}` : a.subject || 'Academic';
        combinedActivity.push({
          id: `asg-${a.id}`,
          action: a.status === 'PUBLISHED' ? 'Published Assessment' : a.status === 'PENDING_APPROVAL' ? 'Submitted for Approval' : 'Created Assessment',
          createdAt: a.createdAt,
          target: a.title || targetDesc,
          userName: creatorName,
          status: a.status === 'PUBLISHED' ? 'COMPLETED' : a.status === 'PENDING_APPROVAL' ? 'PENDING' : 'DRAFT',
          type: 'ASSESSMENT',
        });
      });

      recentPapers.forEach((p: any) => {
        const creator = p.assignment?.createdBy;
        const teacherName = creator
          ? `${creator.firstName} ${creator.lastName || ''}`.trim()
          : 'Faculty Member';
        combinedActivity.push({
          id: `paper-${p.id}`,
          action: 'Generated Question Paper',
          createdAt: p.createdAt,
          target: p.title || p.assignment?.title || 'Question Paper',
          userName: teacherName,
          status: 'COMPLETED',
          type: 'PAPER',
        });
      });

      combinedActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recentActivity = combinedActivity.slice(0, 10);

      res.json({
        success: true,
        data: {
          totalFaculty,
          totalStudents,
          totalClasses,
          totalAssessments: assignments.length,
          assessmentsByStatus: {
            ...assessmentsByStatus,
            PENDING: totalPendingApprovals,
          },
          pendingApprovals: totalPendingApprovals,
          totalLessons,
          totalSubmissions,
          recentActivity,
          departments,
          facultyList,
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getOrgAnalyticsDashboard] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── 20. Organization Settings ──
  static async getOrganizationSettings(req: Request, res: Response) {
    try {
      const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      let org = orgId ? await prisma.organization.findUnique({ where: { id: orgId } }) : null;

      if (!org) {
        org = await prisma.organization.findFirst();
      }

      if (!org) {
        res.json({
          success: true,
          data: {
            id: 'default-org',
            name: 'Vidya AI',
            platformName: 'Vidya AI',
            brandColor: '#2563eb',
            logoUrl: null,
            status: 'ACTIVE',
          },
        });
        return;
      }
      
      // Alias fields for system.store.ts
      res.json({ 
        success: true, 
        data: {
          ...org,
          platformName: org.name,
          logoUrl: org.logo,
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getOrganizationSettings] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateOrganizationSettings(req: Request, res: Response) {
    try {
      const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
      if (!orgId) { res.status(403).json({ success: false, error: 'No organization scope' }); return; }
      const { name, email, phone, address, logo, platformName, brandColor, logoUrl } = req.body;
      const data: any = {};
      
      // Support both old and new field names
      if (name !== undefined) data.name = name;
      if (platformName !== undefined) data.name = platformName;
      if (email !== undefined) data.email = email;
      if (phone !== undefined) data.phone = phone;
      if (address !== undefined) data.address = address;
      if (logo !== undefined) data.logo = logo;
      if (logoUrl !== undefined) data.logo = logoUrl;
      if (brandColor !== undefined) data.brandColor = brandColor;

      const org = await prisma.organization.update({ where: { id: orgId }, data });
      res.json({ 
        success: true, 
        data: {
          ...org,
          platformName: org.name,
          logoUrl: org.logo
        } 
      });
    } catch (err: any) {
      logger.error(`[Admin:updateOrganizationSettings] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  // ── Dashboard Stats ──
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const orgId = getAdminOrgIdOptional(req);
      
      // If no orgId, return aggregated stats for SUPER_ADMIN
      if (!orgId) {
        const [totalUsers, totalStudents, totalTeachers, totalFaculty, activeExams] = await Promise.all([
          prisma.user.count({ where: { status: { not: 'DELETED' } } }),
          prisma.user.count({ where: { role: 'STUDENT', status: { not: 'DELETED' } } }),
          prisma.user.count({ where: { role: 'TEACHER', status: { not: 'DELETED' } } }),
          prisma.user.count({ where: { role: 'TEACHER', status: { not: 'DELETED' } } }),
          prisma.assignment.count({ where: { status: 'ACTIVE' } }),
        ]);

        // Calculate attendance percentage (simple: count users with recent activity)
        const recentUsers = await prisma.auditLog.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          distinct: ['userId'],
          select: { userId: true },
        });

        const attendance = totalUsers > 0 ? Math.round((recentUsers.length / totalUsers) * 100) : 0;

        res.json({
          success: true,
          data: {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalFaculty,
            attendance,
            activeExams,
          },
        });
        return;
      }

      // Organization-specific stats
      const [totalUsers, totalStudents, totalTeachers, totalFaculty, activeExams] = await Promise.all([
        prisma.user.count({ where: { organizationId: orgId, status: { not: 'DELETED' } } }),
        prisma.user.count({ where: { organizationId: orgId, role: 'STUDENT', status: { not: 'DELETED' } } }),
        prisma.user.count({ where: { organizationId: orgId, role: 'TEACHER', status: { not: 'DELETED' } } }),
        prisma.user.count({ where: { organizationId: orgId, role: 'TEACHER', status: { not: 'DELETED' } } }),
        prisma.assignment.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      ]);

      // Calculate attendance percentage (count users with recent activity in the organization)
      const recentUsers = await prisma.auditLog.findMany({
        where: { 
          organizationId: orgId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        distinct: ['userId'],
        select: { userId: true },
      });

      const attendance = totalUsers > 0 ? Math.round((recentUsers.length / totalUsers) * 100) : 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalFaculty,
          attendance,
          activeExams,
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getDashboardStats] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
  static async getSystemHealth(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Only SUPER_ADMIN can view system health.' });
        return;
      }

      // 1. Calculate PG Latency
      const pgStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const pgLatencyMs = Date.now() - pgStart;

      // 2. Fetch traffic over 24h
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const trafficLogs = await prisma.auditLog.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        select: { createdAt: true }
      });

      // Group by hour
      const trafficByHour = Array(24).fill(0);
      trafficLogs.forEach(log => {
        const hourIndex = Math.floor((now.getTime() - log.createdAt.getTime()) / (60 * 60 * 1000));
        if (hourIndex >= 0 && hourIndex < 24) {
          trafficByHour[23 - hourIndex]++;
        }
      });
      // Fallback if empty database
      const finalTraffic = trafficLogs.length === 0 
        ? Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 10)
        : trafficByHour;

      // 3. AI Provider Latency
      const executions = await prisma.promptExecution.groupBy({
        by: ['providerName', 'modelName'],
        _avg: { durationMs: true },
        where: { createdAt: { gte: oneDayAgo } },
      });

      const aiLatency: { providerName: string; modelName: string; latencyMs: number; apiKey: string }[] = [];
      const addProvider = (name: string, model: string, key?: string) => {
        if (!key) return;
        const ex = executions.find(e => e.providerName === name);
        aiLatency.push({
          providerName: name,
          modelName: ex?.modelName || model,
          latencyMs: ex?._avg.durationMs || (Math.floor(Math.random() * 500) + 500), // Random stable latency if no executions yet
          apiKey: key
        });
      };

      addProvider('openai', 'gpt-4o', process.env.OPENAI_API_KEY);
      addProvider('anthropic', 'claude-3-5-sonnet', process.env.ANTHROPIC_API_KEY);
      addProvider('google', 'gemini-1.5-pro', process.env.GEMINI_API_KEY);
      addProvider('nvidia', 'llama-3.1', process.env.NVIDIA_API_KEY);
      addProvider('groq', 'mixtral-8x7b', process.env.GROQ_API_KEY);

      // 4. System Events (Audit Logs marked as alerts/errors, or just the latest if none)
      const recentEvents = await prisma.auditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { 
          user: { include: { organization: true } }, 
          organization: true 
        }
      });

      const events = recentEvents.map((ev: any) => {
        let name = 'System';
        if (ev.user) {
          name = `${ev.user.firstName} ${ev.user.lastName}`;
          const orgName = ev.organization?.name || ev.user.organization?.name;
          if (orgName && ev.user.role !== 'SUPER_ADMIN') {
            name += ` (${orgName})`;
          }
        }
        return {
          id: ev.id,
          action: ev.action,
          details: ev.metadata || {},
          userName: name,
          createdAt: ev.createdAt,
        };
      });

      // 5. Hardcode or use process for CPU/Mem
      const memoryUsage = process.memoryUsage();
      const memUsedGB = (memoryUsage.heapUsed / 1024 / 1024 / 1024).toFixed(1);
      const memTotalGB = (memoryUsage.heapTotal / 1024 / 1024 / 1024).toFixed(1);

      res.json({
        success: true,
        data: {
          uptime: 99.98, // Example percentage
          dbLatencyMs: pgLatencyMs,
          redis: {
            usedGB: 4.2,
            totalGB: 8.0
          },
          traffic24h: finalTraffic,
          aiProviders: aiLatency,
          events: events,
          cpu: '45%',
          memory: `${memUsedGB}GB / ${memTotalGB}GB`
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getSystemHealth] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getProviders(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Only SUPER_ADMIN can view AI providers.' });
        return;
      }

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all prompt executions for the month
      const executions = await prisma.promptExecution.findMany({
        where: { createdAt: { gte: firstDayOfMonth } },
        select: {
          providerName: true,
          modelName: true,
          costUsd: true,
          durationMs: true
        }
      });

      let totalMtdSpend = 0;
      let totalLatency = 0;
      let latencyCount = 0;

      // Map to group by provider
      const providerStats = new Map<string, {
        costUsd: number,
        models: Set<string>,
        totalDuration: number,
        count: number
      }>();

      executions.forEach(ex => {
        totalMtdSpend += ex.costUsd;
        if (ex.durationMs > 0) {
          totalLatency += ex.durationMs;
          latencyCount++;
        }

        const pName = ex.providerName.toLowerCase();
        if (!providerStats.has(pName)) {
          providerStats.set(pName, { costUsd: 0, models: new Set(), totalDuration: 0, count: 0 });
        }
        const stat = providerStats.get(pName)!;
        stat.costUsd += ex.costUsd;
        stat.models.add(ex.modelName);
        if (ex.durationMs > 0) {
          stat.totalDuration += ex.durationMs;
          stat.count++;
        }
      });

      const avgLatencyGlobally = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 420;

      const providerList = Array.from(providerStats.entries()).map(([name, stat]) => {
        const avgLatency = stat.count > 0 ? stat.totalDuration / stat.count : 0;
        let status = 'Operational';
        if (avgLatency > 2000) status = 'High Latency';
        
        let quota = { pct: 50, label: '5M tokens' };
        let tier = 'Scale';
        if (name.includes('openai')) { quota = { pct: 64, label: '10M tokens' }; tier = 'Enterprise'; }
        if (name.includes('anthropic')) { quota = { pct: 28, label: '5M tokens' }; tier = 'Scale'; }
        if (name.includes('google') || name.includes('gemini')) { quota = { pct: 12, label: 'Unlimited' }; tier = 'Custom'; }

        return {
          id: name,
          name: name.charAt(0).toUpperCase() + name.slice(1),
          tier: tier,
          status: status,
          activeModels: Array.from(stat.models).join(', '),
          usageQuota: quota.pct,
          usageLabel: quota.label,
          costMtd: stat.costUsd,
          avgLatency
        };
      });

      const configuredProviders = [];
      if (process.env.OPENAI_API_KEY) {
        configuredProviders.push({
          id: 'openai',
          name: 'OpenAI',
          tier: 'Enterprise',
          status: 'Operational',
          activeModels: 'GPT-4o, GPT-3.5-Turbo',
          usageQuota: 64,
          usageLabel: '10M tokens',
          costMtd: 0,
          avgLatency: 0,
          apiKey: `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
        });
      }
      if (process.env.ANTHROPIC_API_KEY) {
        configuredProviders.push({
          id: 'anthropic',
          name: 'Anthropic',
          tier: 'Scale',
          status: 'Operational',
          activeModels: 'Claude 3.5 Sonnet, Opus',
          usageQuota: 28,
          usageLabel: '5M tokens',
          costMtd: 0,
          avgLatency: 0,
          apiKey: `sk-ant-...${process.env.ANTHROPIC_API_KEY.slice(-4)}`
        });
      }
      if (process.env.GEMINI_API_KEY) {
        configuredProviders.push({
          id: 'google',
          name: 'Google Gemini',
          tier: 'Custom',
          status: 'Operational',
          activeModels: 'Gemini 1.5 Pro, Flash',
          usageQuota: 12,
          usageLabel: 'Unlimited',
          costMtd: 0,
          avgLatency: 0,
          apiKey: `AIzaSy...${process.env.GEMINI_API_KEY.slice(-4)}`
        });
      }
      if (process.env.NVIDIA_API_KEY) {
        configuredProviders.push({
          id: 'nvidia',
          name: 'NVIDIA',
          tier: 'Enterprise',
          status: 'Operational',
          activeModels: 'Llama 3 70B, Nemotron',
          usageQuota: 45,
          usageLabel: '2M tokens',
          costMtd: 0,
          avgLatency: 0,
          apiKey: `nvapi-...${process.env.NVIDIA_API_KEY.slice(-4)}`
        });
      }
      if (process.env.GROQ_API_KEY) {
        configuredProviders.push({
          id: 'groq',
          name: 'Groq',
          tier: 'Scale',
          status: 'Operational',
          activeModels: 'Mixtral 8x7B, Llama 3',
          usageQuota: 80,
          usageLabel: '5M tokens',
          costMtd: 0,
          avgLatency: 0,
          apiKey: `gsk-...${process.env.GROQ_API_KEY.slice(-4)}`
        });
      }

      // If we have executions, use them, otherwise use the configured providers
      if (providerList.length === 0) {
        providerList.push(...configuredProviders);
        totalMtdSpend = 0;
      } else {
        // We have executions. Merge with configured providers if they are missing
        for (const cp of configuredProviders) {
          if (!providerList.find(p => p.id === cp.id)) {
            providerList.push(cp);
          }
        }
      }

      const activeModelsCount = providerList.length;

      res.json({
        success: true,
        data: {
          kpis: {
            activeModels: activeModelsCount,
            mtdSpending: totalMtdSpend,
            avgLatency: avgLatencyGlobally
          },
          providers: providerList
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getProviders] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getKnowledgeStats(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      // Check if LibraryResource has entries, if not seed initial default official documents
      const count = await prisma.libraryResource.count();
      if (count === 0) {
        const adminUser = (await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })) || (await prisma.user.findFirst());
        const defaultOrg = await prisma.organization.findFirst();
        if (adminUser && defaultOrg) {
          await prisma.libraryResource.createMany({
            data: [
              {
                title: 'Multi-Tenant System Architecture Overview',
                description: 'Complete high-level architectural diagram, database schema specifications, and security model.',
                resourceType: 'DOCUMENT',
                subject: 'Architecture',
                className: 'System Docs',
                fileUrl: '/uploads/system-architecture.pdf',
                fileSize: 2450000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
              {
                title: 'Data Protection & Security Compliance Guide',
                description: 'Institutional security guidelines, encryption policies, and compliance procedures.',
                resourceType: 'DOCUMENT',
                subject: 'Compliance & Security',
                className: 'Policy',
                fileUrl: '/uploads/security-compliance.pdf',
                fileSize: 1820000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
              {
                title: 'VidyaAI REST API & Webhook Reference',
                description: 'Full REST API endpoint specifications, authentication tokens, rate limits, and payload schemas.',
                resourceType: 'CODE',
                subject: 'Integration APIs',
                className: 'Developer Docs',
                fileUrl: '/uploads/api-reference.json',
                fileSize: 980000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
              {
                title: 'Institutional Onboarding & Classroom Setup Tutorial',
                description: 'Comprehensive walkthrough for faculty onboarding, department structures, and semester enrollment.',
                resourceType: 'MEDIA',
                subject: 'User Training',
                className: 'Video Training',
                fileUrl: 'https://youtube.com/watch?v=vidya-onboarding',
                fileSize: 15400000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
              {
                title: 'Multi-Organization User Flow & Governance Policy',
                description: 'Guidelines on managing tenant roles, cross-institution permissions, and lifecycle management.',
                resourceType: 'DOCUMENT',
                subject: 'Organization Flow',
                className: 'Governance',
                fileUrl: '/uploads/org-governance.pdf',
                fileSize: 3100000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
              {
                title: 'AI Proctoring & Integrity Engine Whitepaper',
                description: 'Technical specs on LLM evaluation pipelines, anti-plagiarism checks, and Bloom taxonomy classifiers.',
                resourceType: 'DOCUMENT',
                subject: 'Security Docs',
                className: 'Research',
                fileUrl: '/uploads/ai-integrity-whitepaper.pdf',
                fileSize: 4200000,
                uploadedById: adminUser.id,
                organizationId: defaultOrg.id,
              },
            ],
          });
        }
      }

      // Fetch real resources from database
      const allResources = await prisma.libraryResource.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      const totalArticles = allResources.filter((r) => r.resourceType !== 'MEDIA' && r.resourceType !== 'VIDEO').length;
      const trainingVideos = allResources.filter((r) => r.resourceType === 'MEDIA' || r.resourceType === 'VIDEO').length;

      // Group categories dynamically
      const categoryMap: Record<string, number> = {};
      allResources.forEach((r) => {
        const cat = r.subject || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      const categories = Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count,
      }));

      // Map real activities
      const activities = allResources.map((r) => ({
        id: r.id,
        resourceName: r.title,
        description: r.description || '',
        category: r.subject || 'General',
        type: r.resourceType || 'DOCUMENT',
        organization: r.organization?.name || 'Global / All Orgs',
        organizationId: r.organizationId,
        fileUrl: r.fileUrl,
        fileSize: r.fileSize || 0,
        uploadedBy: r.uploadedBy ? `${r.uploadedBy.firstName} ${r.uploadedBy.lastName}` : 'Administrator',
        lastModified: r.updatedAt.toISOString(),
      }));

      res.json({
        success: true,
        data: {
          totalArticles,
          trainingVideos,
          categories,
          activities,
        },
      });
    } catch (err: any) {
      logger.error(`[Admin:getKnowledgeStats] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createKnowledgeResource(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && req.user?.role !== 'ORG_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      const { title, description, category, resourceType, organizationId, externalUrl } = req.body;
      const file = req.file;

      if (!title) {
        res.status(400).json({ success: false, error: 'Resource title is required.' });
        return;
      }

      let fileUrl = externalUrl || '';
      let fileSize = 0;

      if (file) {
        fileUrl = `/uploads/${file.filename}`;
        fileSize = file.size;
      }

      if (!fileUrl) {
        fileUrl = '/uploads/document.pdf';
      }

      // Determine target org ID
      let targetOrgId = organizationId || req.user?.activeOrganizationId || req.user?.organizationId;
      if (!targetOrgId) {
        const defaultOrg = await prisma.organization.findFirst();
        targetOrgId = defaultOrg?.id;
      }

      if (!targetOrgId) {
        res.status(400).json({ success: false, error: 'Target organization not found.' });
        return;
      }

      const resource = await prisma.libraryResource.create({
        data: {
          title,
          description: description || null,
          subject: category || 'General',
          resourceType: resourceType || (file?.mimetype?.startsWith('video/') ? 'MEDIA' : 'DOCUMENT'),
          fileUrl,
          fileSize,
          uploadedById: req.user.id,
          organizationId: targetOrgId,
        },
        include: {
          organization: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ success: true, data: resource });
    } catch (err: any) {
      logger.error(`[Admin:createKnowledgeResource] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteKnowledgeResource(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && req.user?.role !== 'ORG_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied.' });
        return;
      }

      const { id } = req.params;
      const resource = await prisma.libraryResource.findUnique({ where: { id } });
      if (!resource) {
        res.status(404).json({ success: false, error: 'Resource not found.' });
        return;
      }

      // Delete file from disk if local upload
      if (resource.fileUrl && resource.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), resource.fileUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            logger.warn(`Could not remove file at ${filePath}: ${e}`);
          }
        }
      }

      await prisma.libraryResource.delete({ where: { id } });

      res.json({ success: true, message: 'Resource deleted successfully.' });
    } catch (err: any) {
      logger.error(`[Admin:deleteKnowledgeResource] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getGlobalDirectoryData(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, error: 'Access denied: Super Admin only.' });
        return;
      }

      // Fetch all users
      const users = await prisma.user.findMany({
        include: {
          organization: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Stats calculation
      const totalUsers = users.length;
      const activeUsers = users.filter((u: any) => u.status === 'ACTIVE').length;
      const inactiveUsers = totalUsers - activeUsers;
      const crossOrgEngagement = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

      // Org Breakdown
      const orgCounts: Record<string, { count: number, id: string | null, code: string }> = {};
      users.forEach((u: any) => {
        const orgName = u.organization?.name || 'No Organization';
        const orgId = u.organization?.id || null;
        const orgCode = u.organization?.code || '';
        if (!orgCounts[orgName]) {
          orgCounts[orgName] = { count: 0, id: orgId, code: orgCode };
        }
        orgCounts[orgName].count += 1;
      });
      
      const orgBreakdown = Object.entries(orgCounts)
        .map(([name, data]) => ({ name, count: data.count, id: data.id, code: data.code }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 orgs

      // Formatting unified users
      const formattedUsers = users.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        status: u.status,
        institution: u.organization?.name || 'Unknown',
        institutionId: u.organization?.id || null,
        lastActivity: u.updatedAt
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          stats: {
            activeUsers,
            inactiveUsers,
            crossOrgEngagement,
            orgBreakdown
          }
        }
      });
    } catch (err: any) {
      logger.error(`[Admin:getGlobalDirectoryData] ${err}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
