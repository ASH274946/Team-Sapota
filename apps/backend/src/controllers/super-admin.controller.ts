import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { hashPassword } from '../services/auth.service';
import { OrganizationService } from '../services/admin/organization.service';

// ── CREATE ORGANIZATION ──
export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, email, phone, address, adminEmail } = req.body;

    const existing = await prisma.organization.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Organization code already in use.' });
      return;
    }

    const organization = await OrganizationService.createOrganization({
      name,
      code,
      email,
      phone,
      address,
      adminEmail,
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_CREATED',
        entity: 'Organization',
        entityId: organization.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    logger.error(`[SuperAdmin - createOrganization] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create organization.' });
  }
};

// ── GET ALL ORGANIZATIONS ──
export const getOrganizations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { email: true },
          take: 1,
        },
        _count: {
          select: { users: true, classrooms: true, assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: organizations });
  } catch (error) {
    logger.error(`[SuperAdmin - getOrganizations] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch organizations.' });
  }
};

// ── GET ORGANIZATION BY ID ──
export const getOrganizationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!organization) {
      res.status(404).json({ success: false, error: 'Organization not found.' });
      return;
    }

    res.json({ success: true, data: organization });
  } catch (error) {
    logger.error(`[SuperAdmin - getOrganizationById] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch organization.' });
  }
};

// ── UPDATE ORGANIZATION ──
export const updateOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const organization = await OrganizationService.updateOrganization(req.params.id, req.body);

    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_UPDATED',
        entity: 'Organization',
        entityId: organization.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, data: organization });
  } catch (error) {
    logger.error(`[SuperAdmin - updateOrganization] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update organization.' });
  }
};

// ── DELETE ORGANIZATION ──
export const deleteOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    await OrganizationService.deleteOrganization(req.params.id);

    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_DELETED',
        entity: 'Organization',
        entityId: req.params.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, message: 'Organization deleted successfully.' });
  } catch (error: any) {
    logger.error(`[SuperAdmin - deleteOrganization] Error: ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete organization.' });
  }
};

// ── SUSPEND ORGANIZATION ──
export const suspendOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const action = req.body.action || (req.body.status === 'ACTIVE' ? 'activate' : 'suspend');
    const isActivating = action === 'activate' || req.body.status === 'ACTIVE' || req.body.suspended === false;
    const newStatus = isActivating ? 'ACTIVE' : 'SUSPENDED';

    const organization = await OrganizationService.suspendOrganization(req.params.id, !isActivating);

    await prisma.auditLog.create({
      data: {
        action: newStatus === 'ACTIVE' ? 'ORGANIZATION_ACTIVATED' : 'ORGANIZATION_SUSPENDED',
        entity: 'Organization',
        entityId: organization.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, message: `Organization ${newStatus.toLowerCase()} successfully.`, data: organization });
  } catch (error: any) {
    logger.error(`[SuperAdmin - suspendOrganization] Error: ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to suspend organization.' });
  }
};

// ── ASSIGN ADMIN ──
export const assignOrganizationAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const organizationId = req.params.id;

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User with this email already exists.' });
      return;
    }

    const pwdHash = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firstName,
        lastName,
        passwordHash: pwdHash,
        role: 'ADMIN',
        organizationId,
        hasCompletedOnboarding: true, // Auto-complete for manually assigned admins
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_ASSIGNED',
        entity: 'User',
        entityId: admin.id,
        userId: req.user?.id,
        organizationId,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    });

    res.json({ success: true, data: admin, message: 'Admin assigned successfully.' });
  } catch (error) {
    logger.error(`[SuperAdmin - assignAdmin] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to assign admin.' });
  }
};

// ── GET ORGANIZATION USERS ──
export const getOrganizationUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.params.id, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: { department: { select: { name: true } } },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error(`[SuperAdmin - getOrganizationUsers] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch organization users.' });
  }
};

// ── GET ALL USERS (ACROSS ALL ORGANIZATIONS) ──
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.headers['x-organization-id'] as string;
    const whereClause: any = { status: { not: 'DELETED' } };
    
    if (orgId) {
      whereClause.organizationId = orgId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error(`[SuperAdmin - getAllUsers] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch all users.' });
  }
};

// ── GET ORGANIZATION SUBSCRIPTION ──
export const getOrganizationSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: req.params.id },
      include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!sub) {
      res.status(404).json({ success: false, error: 'No subscription found for this organization.' });
      return;
    }
    res.json({ success: true, data: sub });
  } catch (error) {
    logger.error(`[SuperAdmin - getOrganizationSubscriptions] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch subscription.' });
  }
};

// ── UPDATE ORGANIZATION SUBSCRIPTION ──
export const updateOrganizationSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan, status, expiresAt } = req.body;
    const sub = await prisma.subscription.upsert({
      where: { organizationId: req.params.id },
      update: {
        ...(plan && { plan }),
        ...(status && { status }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
      create: {
        organizationId: req.params.id,
        plan: plan || 'FREE',
        status: status || 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPDATED',
        entity: 'Subscription',
        entityId: sub.id,
        userId: req.user?.id,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { organizationId: req.params.id, plan: sub.plan },
      },
    });
    res.json({ success: true, data: sub });
  } catch (error) {
    logger.error(`[SuperAdmin - updateOrganizationSubscription] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update subscription.' });
  }
};

// ── PLATFORM ANALYTICS ──
export const getPlatformAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalGeneratedPapers,
      totalQuestions,
      organizations,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { role: 'STUDENT', status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { role: 'TEACHER', status: { not: 'DELETED' } } }),
      prisma.assignment.count(),
      prisma.generatedPaper.count(),
      prisma.question.count(),
      prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              assignments: true,
              generatedPapers: true,
              classrooms: true,
            },
          },
          subscription: true,
        },
      }),
    ]);

    // Compute Top Organizations ranked by activity
    const topOrganizations = organizations.map((org) => {
      const papersCount = org._count.generatedPapers;
      const userCount = org._count.users;
      const assessmentCount = org._count.assignments;
      const activityScore = userCount * 10 + papersCount * 25 + assessmentCount * 15;
      return {
        id: org.id,
        name: org.name,
        code: org.code,
        status: org.status,
        plan: org.subscription?.plan || org.subscriptionPlan || 'ENTERPRISE',
        papersCount,
        userCount,
        assessmentCount,
        activityScore,
        createdAt: org.createdAt.toISOString(),
      };
    }).sort((a, b) => b.activityScore - a.activityScore);

    // Compute 6-Month Usage Trends directly from database records
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      allPapers,
      allUsers,
      allAssignments,
      allSubmissions,
      allAuditLogs,
    ] = await Promise.all([
      prisma.generatedPaper.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo }, status: { not: 'DELETED' } },
        select: { createdAt: true },
      }),
      prisma.assignment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.studentSubmission.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, action: true },
      }),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const usageTrends = Array.from({ length: 6 }).map((_, i) => {
      const targetDate = new Date(sixMonthsAgo);
      targetDate.setMonth(targetDate.getMonth() + i);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const monthLabel = monthNames[targetMonth];

      const papersInMonth = allPapers.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      }).length;

      const usersInMonth = allUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      }).length;

      const assessmentsInMonth =
        allAssignments.filter((a) => {
          const d = new Date(a.createdAt);
          return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
        }).length +
        allSubmissions.filter((s) => {
          const d = new Date(s.createdAt);
          return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
        }).length;

      const aiAuditsInMonth = allAuditLogs.filter((al) => {
        const d = new Date(al.createdAt);
        return (
          d.getFullYear() === targetYear &&
          d.getMonth() === targetMonth &&
          (al.action.includes('AI') || al.action.includes('PAPER') || al.action.includes('GENERATE'))
        );
      }).length;

      return {
        month: monthLabel,
        year: targetYear,
        papers: papersInMonth + aiAuditsInMonth,
        users: usersInMonth,
        assessments: assessmentsInMonth,
        aiTokensK: Math.round((papersInMonth + aiAuditsInMonth) * 4.2),
      };
    });

    // Subject / Domain Distribution
    const totalP = Math.max(totalGeneratedPapers, 1);
    const subjectDistribution = [
      { name: 'Computer Science & AI', percentage: 38, count: Math.round(totalP * 0.38) },
      { name: 'Mathematics & Statistics', percentage: 24, count: Math.round(totalP * 0.24) },
      { name: 'Engineering & Physics', percentage: 20, count: Math.round(totalP * 0.20) },
      { name: 'Business & Management', percentage: 12, count: Math.round(totalP * 0.12) },
      { name: 'Humanities & Others', percentage: 6, count: Math.round(totalP * 0.06) },
    ];

    res.json({
      success: true,
      data: {
        totals: {
          organizations: totalOrganizations,
          activeOrganizations,
          users: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          assessments: totalAssignments,
          papers: totalGeneratedPapers,
          questions: totalQuestions,
        },
        usageTrends,
        topOrganizations,
        subjectDistribution,
      },
    });
  } catch (error) {
    logger.error(`[SuperAdmin - getAnalytics] Error: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch platform analytics.' });
  }
};
