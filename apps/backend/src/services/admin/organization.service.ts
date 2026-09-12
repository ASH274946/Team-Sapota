import prisma from '../../config/prisma';

import { hashPassword } from '../auth.service';

export class OrganizationService {
  static async createOrganization(data: {
    name: string;
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    adminEmail?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          code: data.code,
          slug: data.name.toLowerCase().replace(/\s+/g, '-'),
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          status: 'ACTIVE',
        },
      });

      if (data.adminEmail) {
        const defaultPasswordHash = await hashPassword('Admin@123');
        await tx.user.create({
          data: {
            email: data.adminEmail,
            passwordHash: defaultPasswordHash,
            firstName: 'Admin',
            lastName: org.name,
            role: 'ADMIN',
            organizationId: org.id,
            status: 'ACTIVE',
            forcePasswordReset: true,
            hasCompletedOnboarding: false,
          },
        });
      }

      return org;
    });
  }

  static async getOrganizations() {
    return prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'ADMIN' },
          select: { email: true },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });
  }

  static async getOrganizationById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    });
  }

  static async updateOrganization(
    id: string,
    data: {
      name?: string;
      code?: string;
      email?: string;
      address?: string;
      phone?: string;
      status?: import('@prisma/client').OrganizationStatus;
      adminEmail?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          email: data.email,
          address: data.address,
          phone: data.phone,
          status: data.status,
        },
      });

      if (data.adminEmail) {
        const existingAdmin = await tx.user.findFirst({
          where: { organizationId: id, role: 'ADMIN' },
        });

        if (existingAdmin) {
          await tx.user.update({
            where: { id: existingAdmin.id },
            data: { email: data.adminEmail },
          });
        } else {
          const defaultPasswordHash = await hashPassword('Admin@123');
          await tx.user.create({
            data: {
              email: data.adminEmail,
              passwordHash: defaultPasswordHash,
              firstName: 'Admin',
              lastName: org.name,
              role: 'ADMIN',
              organizationId: org.id,
              status: 'ACTIVE',
              forcePasswordReset: true,
              hasCompletedOnboarding: false,
            },
          });
        }
      }

      return org;
    });
  }

  static async deleteOrganization(id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete deeply nested dependent records
      await tx.studentSubmission.deleteMany({ where: { organizationId: id } });
      await tx.generatedPaper.deleteMany({ where: { organizationId: id } });
      await tx.assignment.deleteMany({ where: { organizationId: id } });
      await tx.assessment.deleteMany({ where: { organizationId: id } });
      await tx.question.deleteMany({ where: { organizationId: id } });
      await tx.questionBank.deleteMany({ where: { organizationId: id } });
      await tx.quizSession.deleteMany({ where: { organizationId: id } });
      await tx.tutorSession.deleteMany({ where: { organizationId: id } });
      await tx.teacherTutorConfig.deleteMany({ where: { organizationId: id } });
      await tx.attendanceRecord.deleteMany({ where: { organizationId: id } });
      await tx.leaveApplication.deleteMany({ where: { organizationId: id } });
      await tx.libraryResource.deleteMany({ where: { organizationId: id } });
      await tx.knowledgeDocument.deleteMany({ where: { organizationId: id } });
      await tx.promptExecution.deleteMany({ where: { organizationId: id } });
      await tx.promptTemplate.deleteMany({ where: { organizationId: id } });
      await tx.approvalRecord.deleteMany({ where: { organizationId: id } });
      await tx.academicReport.deleteMany({ where: { organizationId: id } });
      await tx.copilotWorkflow.deleteMany({ where: { organizationId: id } });
      await tx.rubric.deleteMany({ where: { organizationId: id } });
      await tx.aIRecommendation.deleteMany({ where: { organizationId: id } });
      await tx.blueprint.deleteMany({ where: { organizationId: id } });
      await tx.course.deleteMany({ where: { organizationId: id } });
      await tx.program.deleteMany({ where: { organizationId: id } });
      await tx.syllabus.deleteMany({ where: { organizationId: id } });
      await tx.lessonPlan.deleteMany({ where: { organizationId: id } });
      await tx.worksheet.deleteMany({ where: { organizationId: id } });
      await tx.generatedNotes.deleteMany({ where: { organizationId: id } });
      await tx.voiceRoom.deleteMany({ where: { organizationId: id } });
      await tx.meeting.deleteMany({ where: { organizationId: id } });
      await tx.communityPost.deleteMany({ where: { organizationId: id } });
      await tx.communityGroup.deleteMany({ where: { organizationId: id } });
      await tx.classGroup.deleteMany({ where: { organizationId: id } });
      await tx.group.deleteMany({ where: { organizationId: id } });
      await tx.class.deleteMany({ where: { organizationId: id } });
      await tx.classroom.deleteMany({ where: { organizationId: id } });
      await tx.department.deleteMany({ where: { organizationId: id } });
      await tx.invitation.deleteMany({ where: { organizationId: id } });
      await tx.subscription.deleteMany({ where: { organizationId: id } });
      await tx.auditLog.deleteMany({ where: { organizationId: id } });
      await tx.notification.deleteMany({ where: { organizationId: id } });

      // 2. Safely dissociate users belonging to this organization so foreign key references to user accounts remain intact
      await tx.user.updateMany({
        where: { organizationId: id },
        data: { organizationId: null, activeOrganizationId: null },
      });

      // 3. Delete the organization record
      return tx.organization.delete({
        where: { id },
      });
    });
  }

  static async suspendOrganization(id: string, suspend: boolean = true) {
    if (!id) throw new Error('Organization ID is required');
    const existing = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new Error(`Organization with ID ${id} not found`);
    }

    const nextStatus = suspend ? 'SUSPENDED' : 'ACTIVE';
    return prisma.organization.update({
      where: { id },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
    });
  }

  static async getOrganizationAnalytics(organizationId: string) {
    const totalUsers = await prisma.user.count({ where: { organizationId } });
    const facultyCount = await prisma.user.count({
      where: {
        organizationId,
        role: 'TEACHER',
      },
    });
    const studentCount = await prisma.student.count({
      where: {
        group: {
          userId: {
            in: (
              await prisma.user.findMany({
                where: { organizationId },
                select: { id: true },
              })
            ).map((u) => u.id),
          },
        },
      },
    });

    const papersGenerated = await prisma.generatedPaper.count({
      where: {
        assignment: {
          status: 'COMPLETED',
        },
      },
    });

    // Mock AI Usage for local demo
    const totalTokensUsed = 1250000;
    const estimatedCost = 3.75;

    return {
      totalUsers,
      facultyCount,
      studentCount,
      papersGenerated,
      aiUsage: {
        tokensUsed: totalTokensUsed,
        estimatedCost,
      },
    };
  }
}
