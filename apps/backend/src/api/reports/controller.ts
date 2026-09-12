import { Request, Response } from 'express';
import { sendSuccess, sendNotFound, sendAccepted } from '../common/response';

import { AnalyticsService } from '../../services/analytics.service';
import prisma from '../../config/prisma';
import {
  serializeReportJob,
  serializeAssignmentReport,
  serializeStudentReport,
  serializeClassReport,
  serializeOrganizationReport,
  serializeDownloadReport,
} from './serializers';

export const generateAssignmentReport = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.body;

  const job = await prisma.generationJob.create({
    data: {
      assignmentId,
      status: 'QUEUED',
      progress: 0,
      progressVersion: 0,
      stageIndex: 0,
      startedAt: new Date(),
    },
  });

  sendAccepted(res, serializeReportJob(job), 'Report generation queued');
};

export const getReportStatus = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Report generation job not found');
    return;
  }

  sendSuccess(res, { data: serializeReportJob(job) });
};

export const getAssignmentReport = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { submissions: { include: { evaluations: true } } },
  });

  if (!assignment) {
    sendNotFound(res, 'Assignment not found');
    return;
  }

  const evaluations = assignment.submissions.flatMap((s) => s.evaluations).filter(Boolean);
  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + (e.score / e.totalMarks) * 100, 0) / evaluations.length
      : 0;

  sendSuccess(res, {
    data: serializeAssignmentReport({
      assignmentId: assignment.id,
      title: assignment.title,
      totalStudents: assignment.submissions.length,
      submittedCount: assignment.submissions.length,
      averageScore: Math.round(averageScore * 100) / 100,
      gradeDistribution: { A: 20, B: 40, C: 25, D: 10, F: 5 },
      questionAnalysis: [],
    }),
  });
};

export const getStudentReport = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const performance = await AnalyticsService.getStudentPerformance(studentId);

  sendSuccess(res, {
    data: serializeStudentReport({
      studentId,
      name: 'Student',
      totalAssignments: performance.scoresHistory?.length ?? 0,
      averageScore: performance.averageScore,
      growthTrend: performance.growthTrend,
      topicMastery: performance.topicMastery,
      recommendations: performance.recommendation ? [performance.recommendation] : [],
    }),
  });
};

export const getClassReport = async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;

  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: { students: true, faculty: true },
  });

  if (!classData) {
    sendNotFound(res, 'Class not found');
    return;
  }

  const performance = await AnalyticsService.getGroupPerformance(classId);

  sendSuccess(res, {
    data: serializeClassReport({
      classId: classData.id,
      className: `Class ${classData.grade} ${classData.section}`,
      totalStudents: classData.students.length,
      averageScore: performance.averageScore,
      gradeDistribution: performance.distribution,
      topPerformers: performance.topStudents?.map((s: any) => s.name) ?? [],
      atRiskStudents: performance.weakPerformers?.map((s: any) => s.name) ?? [],
    }),
  });
};

export const getOrganizationReport = async (req: Request, res: Response): Promise<void> => {
  const { orgId } = req.params;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    sendNotFound(res, 'Organization not found');
    return;
  }

  const stats = await AnalyticsService.getAdminAnalytics(orgId);

  sendSuccess(res, {
    data: serializeOrganizationReport({
      orgId: org.id,
      name: org.name,
      totalUsers: stats.totals?.users ?? 0,
      totalTeachers: stats.totals?.teachers ?? 0,
      totalStudents: stats.totals?.students ?? 0,
      totalAssignments: stats.totals?.assignmentsCreated ?? 0,
      averageScore: 75,
      aiUsageTokens: stats.aiAnalytics?.totalTokens ?? 0,
      aiUsageCost: stats.aiAnalytics?.totalCost ?? 0,
    }),
  });
};

export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: reportId } });
  if (!job) {
    sendNotFound(res, 'Report not found');
    return;
  }

  sendSuccess(res, {
    data: serializeDownloadReport({
      id: job.id,
      url: '#',
      format: 'pdf',
      createdAt: job.createdAt,
    }),
  });
};
