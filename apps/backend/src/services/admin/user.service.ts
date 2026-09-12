import prisma from '../../config/prisma';
import * as argon2 from 'argon2';
import { generateAccessToken } from '../auth.service';

export class UserService {
  static async createUser(data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    organizationId?: string;
    departmentId?: string;
  }) {
    let password = data.password;
    if (!password) {
      if (data.role === 'TEACHER' || data.role === 'FACULTY') {
        password = 'Faculty@123';
      } else if (data.role === 'STUDENT') {
        password = 'Student@123';
      } else {
        password = 'Temporary@123';
      }
    }
    const passwordHash = await argon2.hash(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as import('@prisma/client').SystemRole,
        phone: data.phone || null,
        organizationId: data.organizationId || null,
        departmentId: data.departmentId || null,
        forcePasswordReset: true, // Default to true for admin-created users
      },
    });

    // Create UserRole relation dynamically if the role exists
    const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
    if (roleRecord) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });
    }

    return user;
  }

  static async getUsers(organizationId?: string) {
    return prisma.user.findMany({
      where: {
        organizationId: organizationId || undefined,
        status: { not: 'DELETED' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        department: { select: { name: true } },
      },
    });
  }

  static async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: string;
      organizationId?: string;
      departmentId?: string;
      status?: string;
    }
  ) {
    const user = await prisma.user.update({
      where: { id },
      data: data as any,
    });

    // If role changed, sync UserRole
    if (data.role) {
      const roleRecord = await prisma.role.findUnique({ where: { name: data.role } });
      if (roleRecord) {
        await prisma.userRole.deleteMany({ where: { userId: id } });
        await prisma.userRole.create({
          data: {
            userId: id,
            roleId: roleRecord.id,
          },
        });
      }
    }

    return user;
  }

  static async suspendUser(id: string, suspend: boolean = true) {
    return prisma.user.update({
      where: { id },
      data: {
        status: suspend ? 'SUSPENDED' : 'ACTIVE',
      },
    });
  }

  static async deleteUser(id: string) {
    // Soft delete to avoid breaking database relations immediately
    return prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });
  }

  static async resetPassword(id: string, newPassword?: string) {
    const pwd = newPassword || 'ResetPass@123';
    const pwdHash = await argon2.hash(pwd);
    return prisma.user.update({
      where: { id },
      data: {
        passwordHash: pwdHash,
        forcePasswordReset: true,
      },
    });
  }

  static async impersonateUser(adminId: string, targetUserId: string) {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized impersonation.');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { organization: true, department: true },
    });

    if (!targetUser) {
      throw new Error('Target user not found.');
    }

    // Generate accessToken for target user
    const token = generateAccessToken({
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      organizationId: targetUser.organizationId,
      departmentId: targetUser.departmentId,
    });

    // Log the impersonation action
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `IMPERSONATE_USER`,
        ipAddress: '0.0.0.0',
        userAgent: 'system',
        metadata: {
          targetUserId,
          targetEmail: targetUser.email,
        },
      },
    });

    return {
      accessToken: token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
      },
    };
  }
}
