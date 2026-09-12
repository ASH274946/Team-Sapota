import prisma from '../../config/prisma';

export class GroupService {
  static async createGroup(data: {
    name: string;
    subject?: string;
    organizationId: string;
    facultyId?: string;
  }) {
    return prisma.group.create({
      data: {
        name: data.name,
        subject: data.subject || 'General',
        organizationId: data.organizationId,
        facultyId: data.facultyId || null,
      },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
      },
    });
  }

  static async getGroups(organizationId?: string) {
    return prisma.group.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });
  }

  static async getGroupById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
        students: true,
      },
    });
  }

  static async updateGroup(
    id: string,
    data: {
      name?: string;
      subject?: string;
      facultyId?: string;
    }
  ) {
    return prisma.group.update({
      where: { id },
      data,
    });
  }

  static async assignStudents(groupId: string, studentsList: Array<{ name: string; rollNo: string; email: string }>) {
    await prisma.groupStudent.deleteMany({ where: { groupId } });
    return prisma.groupStudent.createMany({
      data: studentsList.map(s => ({
        groupId,
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
      })),
    });
  }

  static async bulkImportStudents(groupId: string, studentsList: Array<{ name: string; rollNo?: string; email?: string }>) {
    const data = studentsList.map(s => ({
      groupId,
      name: s.name,
      rollNo: s.rollNo || `R-${Math.floor(1000 + Math.random() * 9000)}`,
      email: s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
    }));

    return prisma.groupStudent.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
