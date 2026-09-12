import prisma from '../../config/prisma';

export class DepartmentService {
  static async createDepartment(data: {
    name: string;
    code: string;
    organizationId: string;
    hodId?: string;
  }) {
    return prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        organizationId: data.organizationId,
        hodId: data.hodId || null,
      },
    });
  }

  static async getDepartments(organizationId?: string) {
    return prisma.department.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        _count: { select: { users: true } },
      },
    });
  }

  static async getDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        organization: true,
        users: true,
      },
    });
  }

  static async updateDepartment(
    id: string,
    data: {
      name?: string;
      code?: string;
      hodId?: string;
      status?: string;
    }
  ) {
    return prisma.department.update({
      where: { id },
      data,
    });
  }

  static async assignHOD(id: string, hodId: string) {
    // 1. Assign role HOD to user (optional dynamic update)
    await prisma.user.update({
      where: { id: hodId },
      data: { role: 'ADMIN' },
    });

    // 2. Set hodId on department
    return prisma.department.update({
      where: { id },
      data: { hodId },
    });
  }

  static async assignFaculty(departmentId: string, facultyId: string) {
    return prisma.user.update({
      where: { id: facultyId },
      data: { departmentId },
    });
  }

  static async transferFaculty(facultyId: string, targetDepartmentId: string) {
    return prisma.user.update({
      where: { id: facultyId },
      data: { departmentId: targetDepartmentId },
    });
  }

  static async archiveDepartment(id: string) {
    return prisma.department.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
