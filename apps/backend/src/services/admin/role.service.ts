import prisma from '../../config/prisma';

export class RoleService {
  static async createRole(data: { name: string; description?: string; permissions?: string[] }) {
    const connectPermissions = data.permissions && data.permissions.length > 0
      ? { connect: data.permissions.map(name => ({ name })) }
      : undefined;

    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description || null,
        permissions: connectPermissions,
      },
      include: {
        permissions: true,
      },
    });
  }

  static async getRoles() {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: true,
        _count: { select: { userRoles: true } },
      },
    });
  }

  static async getPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async updateRole(
    id: string,
    data: {
      description?: string;
      permissions?: string[];
    }
  ) {
    // 1. If updating permissions, disconnect previous ones and connect new ones
    if (data.permissions) {
      await prisma.role.update({
        where: { id },
        data: {
          permissions: {
            set: [], // clear
          },
        },
      });
    }

    return prisma.role.update({
      where: { id },
      data: {
        description: data.description,
        ...(data.permissions && {
          permissions: {
            connect: data.permissions.map(name => ({ name })),
          },
        }),
      },
      include: {
        permissions: true,
      },
    });
  }

  static async deleteRole(id: string) {
    return prisma.role.delete({
      where: { id },
    });
  }
}
