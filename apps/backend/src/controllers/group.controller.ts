import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

function getUserId(req: Request): string {
  if (!(req as any).user?.id) throw new Error("Unauthorized");
  return (req as any).user.id;
}

function getOrgId(req: Request): string {
  const orgId = (req as any).user?.activeOrganizationId || (req as any).user?.organizationId;
  if (!orgId) throw new Error("Unauthorized");
  return orgId;
}

const GROUP_COLORS = [
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FCE7F3', color: '#DB2777' },
  { bg: '#FEF9C3', color: '#CA8A04' },
];

// ── List all groups ──
export const getGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    const groups = await prisma.group.findMany({
      where: { facultyId: userId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { students: true } }, class: true },
    });

    const data = groups.map((g, i) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      subject: g.subject,
      classId: g.classId,
      className: g.class ? `${g.class.grade} - ${g.class.section}` : null,
      students: g._count.students,
      assignments: 0,
      color: GROUP_COLORS[i % GROUP_COLORS.length].bg,
      iconColor: GROUP_COLORS[i % GROUP_COLORS.length].color,
    }));

    res.json({ success: true, data });
  } catch (error) {
    logger.error(`[getGroups] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
};

// ── Get single group ──
export const getGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId },
      include: { class: true }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error(`[getGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
};

// ── Create group ──
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, classId, subject, students } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Group name is required' });
      return;
    }
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    // Verify class if provided
    if (classId) {
      const cls = await prisma.class.findFirst({
        where: { id: classId, facultyId: userId, organizationId: orgId }
      });
      if (!cls) {
        res.status(403).json({ success: false, error: 'Invalid class or access denied' });
        return;
      }
    }

    const group = await prisma.group.create({
      data: { 
        name, 
        description,
        subject: subject || 'General', 
        classId,
        facultyId: userId,
        organizationId: orgId
      },
    });

    const communityGroup = await prisma.communityGroup.create({
      data: {
        id: group.id,
        name,
        description,
        ownerId: userId,
        type: 'PRIVATE',
        organizationId: orgId,
      }
    });

    await prisma.groupMember.create({
      data: {
        groupId: communityGroup.id,
        userId: userId,
        role: 'OWNER'
      }
    });

    // Bulk add students if provided
    if (students && Array.isArray(students) && students.length > 0) {
      await prisma.groupStudent.createMany({
        data: students.map((s: any) => ({
          groupId: group.id,
          classStudentId: s.classStudentId || null,
          name: s.name,
          rollNo: s.rollNo || `R-${Date.now()}`,
          email: s.email || `${s.name?.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
        })),
        skipDuplicates: true,
      });

      const validStudents = students.filter((s: any) => s.userId);
      if (validStudents.length > 0) {
        await prisma.groupMember.createMany({
          data: validStudents.map((s: any) => ({
            groupId: communityGroup.id,
            userId: s.userId,
            role: 'MEMBER'
          })),
          skipDuplicates: true,
        });
      }
    }

    const count = await prisma.group.count({ where: { facultyId: userId } });
    const colorIdx = (count - 1) % GROUP_COLORS.length;
    const safeColorIdx = colorIdx < 0 ? 0 : colorIdx;

    res.status(201).json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        subject: group.subject,
        students: students ? students.length : 0,
        assignments: 0,
        color: GROUP_COLORS[safeColorIdx].bg,
        iconColor: GROUP_COLORS[safeColorIdx].color,
      },
      message: 'Group created successfully',
    });
  } catch (error) {
    logger.error(`[createGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
};

// ── Update group ──
export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, classId, subject } = req.body;
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    const updated = await prisma.group.update({
      where: { id: req.params.id },
      data: { name, description, classId, subject }
    });

    res.json({ success: true, data: updated, message: 'Group updated' });
  } catch (error) {
    logger.error(`[updateGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
}

// ── Delete group ──
export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    logger.error(`[deleteGroup] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
};

// ── Get eligible students ──
export const getEligibleStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = getOrgId(req);

    const [users, classStudentsRaw] = await Promise.all([
      prisma.user.findMany({
        where: { 
          role: 'STUDENT',
          organizationId: orgId
        },
        select: { id: true, firstName: true, lastName: true, email: true },
        take: 1000,
      }),
      prisma.classStudent.findMany({
        where: { class: { organizationId: orgId } },
        include: { class: true }
      })
    ]);

    const students = users.map(u => {
      const cs = classStudentsRaw.find(c => c.email === u.email);
      return {
        id: u.id,
        userId: u.id,
        classStudentId: cs ? cs.id : null,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        rollNo: cs ? cs.rollNo : 'N/A',
        classId: cs ? cs.classId : null,
        class: cs?.class || null
      };
    });

    res.json({ success: true, data: students });
  } catch (error) {
    logger.error(`[getEligibleStudents] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch eligible students' });
  }
};

// ── Get students in a group ──
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    const students = await prisma.groupStudent.findMany({
      where: { groupId: req.params.id },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: students });
  } catch (error) {
    logger.error(`[getStudents] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
};

// ── Add student to group ──
export const addStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    const { name, rollNo, email, classStudentId } = req.body;
    if (!name || !rollNo || !email) {
      res.status(400).json({ success: false, error: 'name, rollNo, and email are required' });
      return;
    }
    const student = await prisma.groupStudent.create({
      data: { groupId: req.params.id, name, rollNo, email, classStudentId: classStudentId || null },
    });
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    logger.error(`[addStudent] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to add student' });
  }
};

// ── Delete student ──
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    await prisma.groupStudent.delete({ where: { id: req.params.studentId } });
    res.json({ success: true, message: 'Student removed' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }
    logger.error(`[deleteStudent] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
};

// ── Bulk import students ──
export const bulkAddStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    
    const group = await prisma.group.findFirst({
      where: { id: req.params.id, facultyId: userId, organizationId: orgId }
    });

    if (!group) {
      res.status(404).json({ success: false, error: 'Group not found or access denied' });
      return;
    }

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, error: 'students array is required' });
      return;
    }
    const created = await prisma.groupStudent.createMany({
      data: students.map((s: any) => ({
        groupId: req.params.id,
        classStudentId: s.classStudentId || null,
        name: s.name,
        rollNo: s.rollNo || `R-${Date.now()}`,
        email: s.email || `${s.name?.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      })),
      skipDuplicates: true,
    });
    res.status(201).json({ success: true, data: { count: created.count }, message: `${created.count} students added` });
  } catch (error) {
    logger.error(`[bulkAddStudents] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to bulk add students' });
  }
};
