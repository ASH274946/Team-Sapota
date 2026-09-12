import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { sendSuccess, sendError, sendNotFound } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { requireRequestOrgId } from '../../security/request-context';
import { idParamSchema } from './validators';
import {
  serializeTeacher,
  serializeTeacherAssignment,
  serializeTeacherClass,
  serializeTeacherPerformance,
} from './serializers';

export const listTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, sort, order, search } = parsePagination(req);
    const orgId = requireRequestOrgId(req);
    const departmentId = req.query.departmentId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = { organizationId: orgId };
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const userWhere: Record<string, unknown> = {
      role: { in: ['TEACHER', 'FACULTY'] },
      organizationId: orgId,
      status: { not: 'DELETED' },
    };
    if (departmentId) userWhere.departmentId = departmentId;
    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: userWhere as any,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          department: { select: { name: true } },
        },
      }),
      prisma.user.count({ where: userWhere as any }),
    ]);

    sendSuccess(res, {
      data: users.map((u) =>
        serializeTeacher({
          id: u.id,
          userId: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          employeeId: null,
          departmentId: u.departmentId,
          departmentName: (u.department as Record<string, unknown> | null)?.name || null,
          specialization: null,
          status: u.status,
          avatar: u.avatar,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          user: u,
          department: u.department,
        })
      ),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[listTeachers]');
    sendError(res, { error: 'Failed to fetch teachers', statusCode: 500 });
  }
};

export const getTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { department: { select: { name: true } } },
    });
    if (!user || user.role !== 'TEACHER') {
      sendNotFound(res, 'Teacher not found');
      return;
    }
    sendSuccess(res, {
      data: serializeTeacher({
        id: user.id,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: null,
        departmentId: user.departmentId,
        departmentName: (user.department as Record<string, unknown> | null)?.name || null,
        specialization: null,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        user,
        department: user.department,
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getTeacher]');
    sendError(res, { error: 'Failed to fetch teacher', statusCode: 500 });
  }
};

export const getTeacherAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.role !== 'TEACHER') {
      sendNotFound(res, 'Teacher not found');
      return;
    }

    const assignments = await prisma.assignment.findMany({
      where: { createdById: params.id },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      assignments.map(async (a) => {
        const totalStudents = a.classId
          ? await prisma.student.count({ where: { groupId: a.classId } })
          : 0;
        return serializeTeacherAssignment({
          id: a.id,
          title: a.title,
          subjectName: a.subject,
          className: null,
          status: a.status,
          dueDate: a.dueDate,
          submittedCount: a._count.submissions,
          totalCount: totalStudents,
          createdAt: a.createdAt,
        });
      })
    );

    sendSuccess(res, { data });
  } catch (error: any) {
    logger.error({ err: error }, '[getTeacherAssignments]');
    sendError(res, { error: 'Failed to fetch teacher assignments', statusCode: 500 });
  }
};

export const getTeacherClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.role !== 'TEACHER') {
      sendNotFound(res, 'Teacher not found');
      return;
    }

    const classes = await prisma.classGroup.findMany({
      where: { userId: params.id },
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, {
      data: classes.map(serializeTeacherClass),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getTeacherClasses]');
    sendError(res, { error: 'Failed to fetch teacher classes', statusCode: 500 });
  }
};

export const getTeacherPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.role !== 'TEACHER') {
      sendNotFound(res, 'Teacher not found');
      return;
    }

    const [totalAssignments, activeClasses, evaluations] = await Promise.all([
      prisma.assignment.count({ where: { createdById: params.id } }),
      prisma.classGroup.count({ where: { userId: params.id } }),
      prisma.submissionEvaluation.findMany({
        where: {
          submission: { assignment: { createdById: params.id } },
        },
        select: { score: true, totalMarks: true, createdAt: true },
      }),
    ]);

    const avgScore = evaluations.length > 0
      ? evaluations.reduce((sum, s) => sum + ((s.score ?? 0) / (s.totalMarks ?? 1)) * 100, 0) / evaluations.length
      : 0;

    const gradedCount = evaluations.length;
    const totalSubmissions = await prisma.studentSubmission.count({
      where: { assignment: { createdById: params.id } },
    });
    const gradingCompletionRate = totalSubmissions > 0 ? Math.round((gradedCount / totalSubmissions) * 100) : 0;

    const totalStudents = await prisma.student.count({
      where: {
        group: {
          userId: params.id,
        },
      } as any,
    });

    sendSuccess(res, {
      data: serializeTeacherPerformance({
        teacherId: params.id,
        totalAssignments,
        activeClasses,
        totalStudents,
        averageClassScore: Math.round(avgScore * 100) / 100,
        gradingCompletionRate,
        recentActivity: [],
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getTeacherPerformance]');
    sendError(res, { error: 'Failed to fetch teacher performance', statusCode: 500 });
  }
};
