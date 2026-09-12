import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';
import { sendSuccess, sendError, sendNotFound } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { requireRequestOrgId } from '../../security/request-context';
import { idParamSchema } from './validators';
import {
  serializeStudent,
  serializeStudentProgress,
  serializeStudentPerformance,
  serializeQuizHistory,
  serializeSubmission,
  serializeLearningProfile,
  serializeAtRisk,
} from './serializers';

export const listStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, sort, order, search } = parsePagination(req);
    const orgId = requireRequestOrgId(req);
    const groupId = req.query.groupId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Record<string, unknown> = {
      group: { organizationId: orgId },
    };
    if (groupId) where.groupId = groupId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { enrollmentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      (prisma as any).student.findMany({
        where: where as any,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
          group: { select: { name: true } },
        },
      }),
      prisma.student.count({ where: where as any }),
    ]);

    sendSuccess(res, {
      data: (students as any[]).map(serializeStudent),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[listStudents]');
    sendError(res, { error: 'Failed to fetch students', statusCode: 500 });
  }
};

export const getStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await (prisma as any).student.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        group: { select: { name: true } },
      },
    });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }
    sendSuccess(res, { data: serializeStudent(student as Record<string, unknown>) });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudent]');
    sendError(res, { error: 'Failed to fetch student', statusCode: 500 });
  }
};

export const getStudentProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const [completedAssignments, totalAssignments, submissions] = await Promise.all([
      prisma.studentSubmission.count({
        where: { studentId: params.id, status: 'GRADED' as any },
      }),
      prisma.studentSubmission.count({
        where: { studentId: params.id },
      }),
      prisma.studentSubmission.findMany({
        where: { studentId: params.id },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const averageScore = 0;

    sendSuccess(res, {
      data: serializeStudentProgress({
        studentId: params.id,
        overallProgress: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
        completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
        averageScore: Math.round(averageScore * 100) / 100,
        totalAssignments,
        completedAssignments,
        timeSpent: 0,
        recentActivity: submissions.slice(0, 5).map((s) => ({
          type: 'submission',
          score: null,
          date: s.createdAt,
        })),
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentProgress]');
    sendError(res, { error: 'Failed to fetch student progress', statusCode: 500 });
  }
};

export const getStudentPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const submissionsWithScore = await prisma.submissionEvaluation.findMany({
      where: { submission: { studentId: params.id } },
      select: { score: true, totalMarks: true, submission: { select: { assignmentId: true, assignment: { select: { title: true, subject: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgScore = submissionsWithScore.length > 0
      ? submissionsWithScore.reduce((sum, s) => sum + ((s.score ?? 0) / (s.totalMarks ?? 1)) * 100, 0) / submissionsWithScore.length
      : 0;

    const subjectMap: Record<string, number[]> = {};
    submissionsWithScore.forEach((s) => {
      const subject = s.submission.assignment.subject || 'General';
      if (!subjectMap[subject]) subjectMap[subject] = [];
      subjectMap[subject].push(((s.score ?? 0) / (s.totalMarks ?? 1)) * 100);
    });

    const subjectBreakdown = Object.entries(subjectMap).map(([name, scores]) => ({
      subject: name,
      average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      attempts: scores.length,
    }));

    const recentTrend = submissionsWithScore.slice(0, 10).reverse().map((s) =>
      Math.round(((s.score ?? 0) / (s.totalMarks ?? 1)) * 100 * 100) / 100
    );

    const sortedBreaks = [...subjectBreakdown].sort((a, b) => a.average - b.average);
    const strengths = sortedBreaks.filter((s) => s.average >= 70).map((s) => s.subject);
    const weaknesses = sortedBreaks.filter((s) => s.average < 50).map((s) => s.subject);

    sendSuccess(res, {
      data: serializeStudentPerformance({
        studentId: params.id,
        overallAverage: Math.round(avgScore * 100) / 100,
        recentTrend,
        subjectBreakdown,
        strengths,
        weaknesses,
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentPerformance]');
    sendError(res, { error: 'Failed to fetch student performance', statusCode: 500 });
  }
};

export const getStudentQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const quizSessions = await prisma.quizSession.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, {
      data: quizSessions.map((qs) =>
        serializeQuizHistory({
          id: qs.id,
          quizId: qs.id,
          title: `${qs.subject} - ${qs.topic}`,
          score: qs.score,
          maxScore: qs.totalQuestions,
          percentage: qs.totalQuestions > 0 ? Math.round((qs.score / qs.totalQuestions) * 10000) / 100 : 0,
          completedAt: qs.createdAt,
          duration: 0,
        })
      ),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentQuizzes]');
    sendError(res, { error: 'Failed to fetch quiz history', statusCode: 500 });
  }
};

export const getStudentSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: params.id },
      include: { assignment: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, {
      data: submissions.map((sub) =>
        serializeSubmission({
          id: sub.id,
          assignmentId: sub.assignmentId,
          title: sub.assignment?.title || 'Untitled',
          status: sub.status,
          score: null,
          maxScore: null,
          submittedAt: sub.createdAt,
          gradedAt: null,
        })
      ),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentSubmissions]');
    sendError(res, { error: 'Failed to fetch submissions', statusCode: 500 });
  }
};

export const getStudentLearningProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const profile = await prisma.studentLearningProfile.findUnique({
      where: { studentId: params.id },
    });

    if (!profile) {
      sendNotFound(res, 'Learning profile not found');
      return;
    }

    sendSuccess(res, {
      data: serializeLearningProfile({
        ...profile,
        weakConcepts: profile.weakConcepts ?? [],
        strongConcepts: profile.strongConcepts ?? [],
        recommendedTopics: [],
        studyPlan: null,
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentLearningProfile]');
    sendError(res, { error: 'Failed to fetch learning profile', statusCode: 500 });
  }
};

export const getStudentAtRisk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { params } = idParamSchema.parse({ params: req.params });
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) {
      sendNotFound(res, 'Student not found');
      return;
    }

    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const evaluations = await prisma.submissionEvaluation.findMany({
      where: { submission: { studentId: params.id } },
      select: { score: true, totalMarks: true, submissionId: true },
    });

    const evaluatedSubmissionIds = new Set(evaluations.map((e) => e.submissionId));
    const totalSubmissions = submissions.length;
    const missedSubmissions = totalSubmissions - evaluatedSubmissionIds.size;
    const lowScores = evaluations.filter(
      (e) => e.totalMarks && (e.score ?? 0) / e.totalMarks < 0.4
    ).length;
    const recentSubmissions = submissions.filter(
      (s) => s.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    const riskFactors: string[] = [];
    if (missedSubmissions > 3) riskFactors.push('Multiple incomplete submissions');
    if (lowScores > 2) riskFactors.push('Consistently low scores');
    if (recentSubmissions === 0) riskFactors.push('No recent activity');
    if (totalSubmissions === 0) riskFactors.push('No submissions at all');

    const isAtRisk = riskFactors.length >= 2;
    const confidence = isAtRisk ? Math.min(0.5 + riskFactors.length * 0.15, 0.95) : 0.2;

    const recommendations: string[] = [];
    if (riskFactors.includes('No recent activity')) {
      recommendations.push('Send reminder to complete pending assignments');
    }
    if (riskFactors.includes('Consistently low scores')) {
      recommendations.push('Schedule remedial session or tutoring');
    }
    if (riskFactors.includes('Multiple incomplete submissions')) {
      recommendations.push('Contact guardian for progress review');
    }

    sendSuccess(res, {
      data: serializeAtRisk({
        studentId: params.id,
        isAtRisk,
        riskFactors,
        confidence: Math.round(confidence * 100) / 100,
        recommendations,
      }),
    });
  } catch (error: any) {
    logger.error({ err: error }, '[getStudentAtRisk]');
    sendError(res, { error: 'Failed to check at-risk status', statusCode: 500 });
  }
};
