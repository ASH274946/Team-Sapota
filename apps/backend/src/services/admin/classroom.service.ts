import prisma from '../../config/prisma';

export class ClassroomService {
  static async createClassroom(data: { grade: string; section: string; academicYear?: string; organizationId: string; facultyId?: string }) {
    return prisma.class.create({
      data: {
        grade: data.grade,
        section: data.section || 'A',
        academicYear: data.academicYear || new Date().getFullYear().toString(),
        organizationId: data.organizationId,
        facultyId: data.facultyId || null,
      },
    });
  }

  static async getClassrooms(organizationId?: string) {
    const classes = await prisma.class.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        faculty: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });

    // Natural sort: 1, 2, 9, 10, 11
    return classes.sort((a, b) => {
      const cmp = a.grade.localeCompare(b.grade, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp === 0) return a.section.localeCompare(b.section);
      return cmp;
    });
  }

  static async getClassroomById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
        students: {
          select: { id: true, name: true, email: true, rollNo: true }
        }
      },
    });
  }

  static async updateClassroom(id: string, data: { grade?: string; section?: string; academicYear?: string; facultyId?: string }) {
    return prisma.class.update({
      where: { id },
      data,
    });
  }

  static async deleteClassroom(id: string) {
    return prisma.class.delete({
      where: { id },
    });
  }
}
