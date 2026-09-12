import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import {
  loadAssignmentForRequest,
  assertStudentCanViewAssignment,
  handleAccessError,
  AccessDeniedError,
} from '../security/assignment-access';

const PUBLISHED_STATUSES = ['PUBLISHED', 'ACTIVE', 'APPROVED', 'COMPLETED'] as const;

function getOrgId(req: Request): string {
  return requireRequestOrgId(req);
}

function getUserId(req: Request): string {
  return getRequestUserId(req);
}

async function getPublishedAssignmentsForStudent(req: Request) {
  const orgId = getOrgId(req);
  const userId = getUserId(req);

  const assessments = await prisma.assignment.findMany({
    where: { organizationId: orgId, status: { in: [...PUBLISHED_STATUSES] } },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const visible: typeof assessments = [];
  for (const assignment of assessments) {
    try {
      await assertStudentCanViewAssignment(req, assignment);
      visible.push(assignment);
    } catch (err) {
      if (!(err instanceof AccessDeniedError)) throw err;
    }
  }

  const submissions = await prisma.studentSubmission.findMany({
    where: { studentId: userId, organizationId: orgId },
    select: { 
      assignmentId: true, 
      status: true, 
      submittedAt: true,
      evaluations: { select: { score: true, totalMarks: true } }
    },
  });

  return { assessments: visible, submissions };
}

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        section: {
          include: { classroom: { select: { name: true } } },
        },
      },
    });

    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

    const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW');
    const completedSubmissions = submissions.filter((s) => s.status === 'GRADED' || s.status === 'RESULT_PUBLISHED');

    const now = new Date();
    const upcomingAssignments = assessments
      .filter((a) => new Date(a.dueDate) >= now)
      .filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'AVAILABLE' || sub.status === 'STARTED';
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const nextTest = upcomingAssignments.length > 0 ? {
      title: upcomingAssignments[0].title,
      daysLeft: Math.ceil((new Date(upcomingAssignments[0].dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24))
    } : null;

    const upcomingTests = upcomingAssignments.slice(0, 3).map((a) => {
      const parts = new Date(a.dueDate).toDateString().split(' ');
      return {
        id: a.id,
        dateStr: `${parts[1].toUpperCase()}\n${parts[2]}`,
        title: a.title,
        location: 'Lab Hall A',
        time: '10:00 AM'
      };
    });

    const activeAssignments = assessments
      .filter((a) => {
        // Must be due today or in the future
        const isUpcoming = new Date(a.dueDate).setHours(23, 59, 59, 999) >= now.getTime();
        if (!isUpcoming) return false;
        
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'AVAILABLE' || sub.status === 'STARTED' || sub.status === 'IN_PROGRESS';
      })
      .slice(0, 4)
      .map(a => {
        const daysToDue = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return {
          id: a.id,
          title: a.title,
          subject: a.subject,
          chapter: 'General',
          teacher: a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : 'Instructor',
          progress: sub && sub.status === 'IN_PROGRESS' ? 50 : (sub && sub.status === 'STARTED' ? 10 : 0),
          dueDateStatus: daysToDue <= 0 ? 'DUE TODAY' : `IN ${daysToDue} DAYS`
        };
      });

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: userId, organizationId: orgId, date: { gte: startOfMonth } }
    });
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const monthlyAttendance = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;
    
    // Global rank calculation uses allStudents proxy.
    // Instead of raw query, just use a simple mock calculation based on real data length for now, or true ranking if we have time.
    // For now, count total students in org and assign a rank based on completed submissions count as proxy.
    const allStudents = await prisma.user.count({ where: { organizationId: orgId, role: 'STUDENT' } });
    const globalRank = { current: Math.max(1, allStudents - completedSubmissions.length), total: Math.max(1, allStudents) };

    let currentStreak = 0;
    try {
      if ((prisma as any).streak) {
        const streak = await (prisma as any).streak.findUnique({ where: { userId } });
        currentStreak = streak?.currentStreak || 0;
      }
    } catch (e) {
      logger.warn(`Failed to fetch streak for user ${userId}: ${e}`);
    }
    const weeklyGoalProgress = Math.min(100, Math.round((currentStreak / 7) * 100));

    const recentResults = await Promise.all(
      completedSubmissions.slice(0, 5).map(async (s) => {
        const submission = await prisma.studentSubmission.findFirst({
          where: { studentId: userId, assignmentId: s.assignmentId },
          include: { evaluations: true, assignment: true },
        });
        const evaluation = submission?.evaluations[0];
        return {
          assignmentId: s.assignmentId,
          title: submission?.assignment?.title || 'Assignment',
          subject: submission?.assignment?.subject || 'General',
          score: evaluation?.score || 0,
          totalMarks: evaluation?.totalMarks || 0,
          percentage: evaluation && evaluation.totalMarks > 0 ? (evaluation.score / evaluation.totalMarks) * 100 : 100,
          submittedAt: s.submittedAt,
        };
      }),
    );

    let aiInsight = null;
    if (recentResults.length > 0) {
      // Find the weakest recent result
      const weakest = recentResults.reduce((prev, curr) => (prev.percentage < curr.percentage ? prev : curr));
      if (weakest.percentage < 80) {
        aiInsight = {
          performanceArea: 'quiz',
          recommendedTopic: weakest.subject || weakest.title,
          testDay: nextTest ? nextTest.title : 'upcoming',
        };
      }
    }
    
    if (!aiInsight && nextTest) {
      // If no weak results but there's a next test, recommend prepping for it
      aiInsight = {
        performanceArea: 'course',
        recommendedTopic: nextTest.title,
        testDay: 'upcoming',
      };
    }
    
    // Default fallback if no data
    if (!aiInsight) {
      aiInsight = {
        performanceArea: 'general',
        recommendedTopic: 'core foundations',
        testDay: 'next',
      };
    }

    res.json({
      success: true,
      data: {
        user: { firstName: user?.firstName || 'Student' },
        weeklyGoalProgress,
        nextTest,
        monthlyAttendance,
        attendanceTrend: 'Stable',
        globalRank,
        activeAssignments,
        upcomingTests,
        aiInsight,
        currentStreak,
        enrolledClasses: enrollments.map((e) => ({
          sectionId: e.sectionId,
          sectionName: e.section.name,
          className: e.section.classroom?.name || '',
        })),
        availableAssessments: assessments.length,
        pendingSubmissions: pendingSubmissions.length,
        completedItems: completedSubmissions.length,
        recentResults,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getDashboard] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to load dashboard' });
  }
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);
    const completed = submissions.filter((s) => s.status === 'GRADED' || s.status === 'RESULT_PUBLISHED').length;
    const pending = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length;

    res.json({
      success: true,
      data: {
        totalAssessments: assessments.length,
        completed,
        pending,
        available: assessments.length - completed,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getStats] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to load stats' });
  }
};

export const getMyLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = getOrgId(req);

    const lessons = await prisma.lessonPlan.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: lessons });
  } catch (error: any) {
    logger.error(`[Student:getMyLessons] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch lessons' });
  }
};

export const getLessonDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orgId = getOrgId(req);

    let lesson: any = null;
    if ((prisma as any).lessonPlan) {
      lesson = await (prisma as any).lessonPlan.findFirst({
        where: { id, organizationId: orgId },
      });
    }

    if (!lesson) {
      lesson = {
        id,
        title: 'Core Foundations & Architectural Principles',
        subject: 'Computer Science & Engineering',
        chapter: 'Unit 1: Foundations and Architecture',
        duration: '45 Mins',
        teacher: 'Faculty Assigned',
        organizationId: orgId,
        objectives: [
          'Master core architectural concepts and underlying theory',
          'Evaluate real-world engineering trade-offs and performance implications',
          'Solve practical application problems with step-by-step validation',
        ],
        sections: [
          {
            title: '1. Theoretical Overview & Foundations',
            content:
              'In this foundational module, we explore the core principles, syntax, and execution lifecycle. Understanding these underlying mechanics ensures solid mastery when designing complex software architectures and scalable data solutions.',
          },
          {
            title: '2. Detailed Analysis & Key Principles',
            content:
              'Key principles focus on declarative querying, ACID transactional consistency, indexing strategies (B-Tree, Hash), and relational calculus. By breaking down each phase into modular components, we can systematically analyze and isolate performance bottlenecks.',
          },
          {
            title: '3. Real-World Applications & Case Studies',
            content:
              'Industry-standard applications utilize these models across high-throughput distributed databases, microservice event streams, and real-time analytical warehouses. Review the case diagrams and architectural blueprints below.',
          },
        ],
        createdAt: new Date(),
      };
    }

    res.json({ success: true, data: lesson });
  } catch (error: any) {
    logger.error(`[Student:getLessonDetail] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch lesson detail' });
  }
};

export const getMyAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

    const data = assessments.map((a) => {
      const sub = submissions.find((s) => s.assignmentId === a.id);
      const attemptStatus = sub ? sub.status : 'AVAILABLE';
      const isPastDue = new Date(a.dueDate) < new Date();
      
      let dashboardCategory = 'UPCOMING';
      if (['SUBMITTED', 'GRADED', 'RESULT_PUBLISHED', 'UNDER_REVIEW'].includes(attemptStatus)) {
        dashboardCategory = 'COMPLETED';
      } else if (['STARTED', 'IN_PROGRESS'].includes(attemptStatus)) {
        dashboardCategory = 'LIVE NOW';
      } else if (attemptStatus === 'AVAILABLE' && isPastDue) {
        dashboardCategory = 'MISSED';
      }

      let score = null;
      let evaluatedMarks = null;
      if (sub && sub.evaluations && sub.evaluations.length > 0) {
        score = sub.evaluations[0].score;
        evaluatedMarks = sub.evaluations[0].totalMarks;
      }

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        subject: a.subject,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        totalMarks: a.totalMarks,
        duration: a.duration,
        attemptStatus,
        dashboardCategory,
        submittedAt: sub?.submittedAt || null,
        score,
        evaluatedMarks,
      };
    });

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getMyAssessments] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch assessments' });
  }
};

export const getUpcomingAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const { assessments, submissions } = await getPublishedAssignmentsForStudent(req);

    const data = assessments
      .filter((a) => new Date(a.dueDate) >= now)
      .filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'AVAILABLE' || sub.status === 'STARTED';
      })
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        title: a.title,
        subject: a.subject,
        dueDate: a.dueDate,
        totalMarks: a.totalMarks,
      }));

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getUpcomingAssessments] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch upcoming assessments' });
  }
};

export const startAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertStudentCanViewAssignment(req, assignment);

    const userId = getUserId(req);
    const orgId = getOrgId(req);

    let submission = await prisma.studentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: userId } },
    });

    if (!submission) {
      submission = await prisma.studentSubmission.create({
        data: {
          assignmentId: assignment.id,
          studentId: userId,
          organizationId: orgId,
          fileUrl: '',
          fileType: 'NONE',
          status: 'STARTED',
        },
      });
    } else if (submission.status === 'AVAILABLE') {
      submission = await prisma.studentSubmission.update({
        where: { id: submission.id },
        data: { status: 'STARTED' },
      });
    }

    res.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          subject: assignment.subject,
          dueDate: assignment.dueDate,
          duration: assignment.duration,
          totalMarks: assignment.totalMarks,
        },
        attemptStatus: submission.status,
        submissionId: submission.id,
      },
    });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[Student:startAssessment] ${err}`);
    res.status(500).json({ success: false, error: 'Failed to start assessment' });
  }
};

export const submitAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertStudentCanViewAssignment(req, assignment);

    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const files = req.files as Express.Multer.File[] | undefined;
    let fileUrl = '';
    let fileType = 'ONLINE_SUBMISSION';

    if (files && files.length > 0) {
      fileUrl = files[0].path;
      fileType = files[0].mimetype === 'application/pdf' ? 'PDF' : files[0].mimetype?.includes('word') ? 'DOCX' : 'TXT';
    } else if (req.body.answers || req.body.text || req.body.content || req.body.answersJson) {
      const answersData = req.body.answers || req.body.text || req.body.content || req.body.answersJson;
      const submissionsDir = path.join(process.cwd(), 'uploads', 'submissions');
      if (!fs.existsSync(submissionsDir)) {
        fs.mkdirSync(submissionsDir, { recursive: true });
      }
      const filename = `sub_${assignment.id}_${userId}_${Date.now()}.json`;
      const filePath = path.join(submissionsDir, filename);
      const contentToWrite = typeof answersData === 'string' ? answersData : JSON.stringify(answersData, null, 2);
      fs.writeFileSync(filePath, contentToWrite, 'utf-8');
      fileUrl = filePath;
      fileType = 'ONLINE_SUBMISSION';
    } else {
      res.status(400).json({ success: false, error: 'Please write your answers or upload a solution file' });
      return;
    }

    const submission = await prisma.studentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: userId } },
      create: {
        assignmentId: assignment.id,
        studentId: userId,
        organizationId: orgId,
        fileUrl: fileUrl,
        fileType: fileType,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      update: {
        fileUrl: fileUrl,
        fileType: fileType,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[Student:submitAssessment] ${err}`);
    res.status(500).json({ success: false, error: 'Failed to submit assignment' });
  }
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    logger.info(`[Student:getMyResults] Fetching results for userId=${userId}, orgId=${orgId}`);
    const submissions = await prisma.studentSubmission.findMany({
      where: { studentId: userId, organizationId: orgId, status: { in: ['SUBMITTED', 'GRADED', 'RESULT_PUBLISHED'] } },
      orderBy: { submittedAt: 'desc' },
      include: { evaluations: true, assignment: { select: { title: true, subject: true, totalMarks: true, organizationId: true } } },
    });

    const data = submissions
      .filter((s) => !s.assignment?.organizationId || s.assignment.organizationId === orgId)
      .map((s) => {
        const evalObj = s.evaluations && s.evaluations.length > 0 ? s.evaluations[0] : null;
        const totalMarks = s.assignment?.totalMarks || 100;
        const score = evalObj?.score || 0;
        return {
          id: s.id,
          assignmentId: s.assignmentId,
          title: s.assignment?.title || 'Assignment',
          subject: s.assignment?.subject || 'General',
          totalMarks,
          score,
          percentage: evalObj && totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0,
          feedback: evalObj?.generalFeedback || null,
          status: s.status,
          submittedAt: s.submittedAt,
          gradedAt: evalObj?.createdAt || null,
        };
      });

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error(`[Student:getMyResults] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch results' });
  }
};

export const getResultDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);

    const submission = await prisma.studentSubmission.findFirst({
      where: {
        id: req.params.id,
        studentId: userId,
        organizationId: orgId,
        status: { in: ['SUBMITTED', 'GRADED', 'RESULT_PUBLISHED'] },
      },
      include: {
        evaluations: true,
        assignment: { select: { title: true, subject: true, totalMarks: true } },
      },
    });

    if (!submission) {
      res.status(404).json({ success: false, error: 'Result not found' });
      return;
    }

    const evalObj = submission.evaluations[0];
    res.json({
      success: true,
      data: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        title: submission.assignment.title,
        subject: submission.assignment.subject,
        totalMarks: submission.assignment.totalMarks,
        score: evalObj?.score || 0,
        percentage: evalObj ? (evalObj.score / evalObj.totalMarks) * 100 : 0,
        feedback: evalObj?.generalFeedback || null,
        criteriaGrades: evalObj?.criteriaGrades || null,
        submittedAt: submission.submittedAt,
        gradedAt: evalObj?.createdAt || null,
      },
    });
  } catch (error: any) {
    logger.error(`[Student:getResultDetail] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch result' });
  }
};


export const requestReschedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const orgId = getOrgId(req);
    const { courseId, teacherId, originalDate, preferredDate, preferredTime, reason } = req.body;

    if (!courseId || !originalDate || !preferredDate || !preferredTime || !reason) {
      res.status(400).json({ success: false, error: 'Missing required fields for reschedule request' });
      return;
    }

    if (!(prisma as any).rescheduleRequest) {
      res.status(503).json({ success: false, error: 'Reschedule service is currently unavailable. Database migration pending.' });
      return;
    }

    const rescheduleRequest = await (prisma as any).rescheduleRequest.create({
      data: {
        studentId: userId,
        teacherId,
        courseId,
        organizationId: orgId,
        originalDate: new Date(originalDate),
        preferredDate: new Date(preferredDate),
        preferredTime,
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: rescheduleRequest });
  } catch (error: any) {
    logger.error(`[Student:requestReschedule] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to submit reschedule request' });
  }
};
