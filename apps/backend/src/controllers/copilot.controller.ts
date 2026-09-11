import { Request, Response } from 'express';
import { TeacherCopilotService } from '../services/teacher-copilot.service';
import { sendSuccess, sendError } from '../utils/api-response.util';
import prisma from '../config/prisma';

/**
 * POST /v1/copilot/lesson-plan
 * Generates a RAG-grounded lesson plan.
 */
export const generateLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const { subject, topic, duration, learningOutcomes } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!subject || !topic || !duration) {
    sendError(res, 400, 'subject, topic, and duration are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const plan = await TeacherCopilotService.generateLessonPlan(
    userId,
    organizationId,
    subject,
    topic,
    duration,
    Array.isArray(learningOutcomes) ? learningOutcomes : []
  );

  sendSuccess(res, plan, { message: 'Lesson plan generated' }, 201);
};

/**
 * GET /v1/copilot/lesson-plans
 * Retrieves a list of generated lesson plans.
 */
export const getLessonPlans = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  const plans = await prisma.lessonPlan.findMany({
    where: { userId, organizationId: organizationId || undefined },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  sendSuccess(res, plans, { message: 'Lesson plans retrieved' });
};

/**
 * DELETE /v1/copilot/lesson-plan/:id
 * Deletes a generated lesson plan.
 */
export const deleteLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id ?? 'demo-faculty-id';
  
  if (!id) {
    sendError(res, 400, 'Lesson plan ID is required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  // Ensure the user owns the lesson plan or is an admin (simplified ownership check)
  const plan = await prisma.lessonPlan.findUnique({ where: { id } });
  
  if (!plan) {
    sendError(res, 404, 'Lesson plan not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  if (plan.userId !== userId && req.user?.role !== 'ADMIN') {
    sendError(res, 403, 'Unauthorized to delete this lesson plan', { errorCode: 'UNAUTHORIZED' });
    return;
  }

  await prisma.lessonPlan.delete({ where: { id } });

  sendSuccess(res, null, { message: 'Lesson plan deleted successfully' });
};

/**
 * Updates a generated lesson plan.
 */
export const updateLessonPlan = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id ?? 'demo-faculty-id';
  
  if (!id) {
    sendError(res, 400, 'Lesson plan ID is required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const plan = await prisma.lessonPlan.findUnique({ where: { id } });
  
  if (!plan) {
    sendError(res, 404, 'Lesson plan not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  if (plan.userId !== userId && req.user?.role !== 'ADMIN') {
    sendError(res, 403, 'Unauthorized to edit this lesson plan', { errorCode: 'UNAUTHORIZED' });
    return;
  }

  const { title, subject, grade, duration, objectives, content, activities, assessments } = req.body;

  const updated = await prisma.lessonPlan.update({
    where: { id },
    data: {
      title: title ?? undefined,
      subject: subject ?? undefined,
      grade: grade ?? undefined,
      duration: duration ?? undefined,
      objectives: objectives ?? undefined,
      activities: activities ?? undefined,
      assessments: assessments ?? undefined,
      content: content ?? undefined
    }
  });

  sendSuccess(res, updated, { message: 'Lesson plan updated successfully' });
};

/**
 * POST /v1/copilot/workflow
 * Initiates a multi-step automation workflow.
 */
export const executeWorkflow = async (req: Request, res: Response): Promise<void> => {
  const { workflowName, tasks } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!workflowName || !Array.isArray(tasks) || tasks.length === 0) {
    sendError(res, 400, 'workflowName and tasks[] are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const workflow = await TeacherCopilotService.executeWorkflow(
    userId,
    organizationId,
    workflowName,
    tasks
  );

  sendSuccess(res, workflow, { message: 'Workflow queued' }, 201);
};

/**
 * GET /v1/copilot/workflows
 * Lists automation workflows for the authenticated user.
 */
export const listWorkflows = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id ?? '';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  const workflows = await prisma.copilotWorkflow.findMany({
    where: { userId, organizationId: organizationId || undefined },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  sendSuccess(res, workflows, { message: 'Workflows retrieved' });
};

/**
 * POST /v1/copilot/obe-analysis
 * Generates an automated accreditation report (e.g., NBA, NAAC) using Hybrid RAG and calculated attainment.
 */
export const analyzeOBE = async (req: Request, res: Response): Promise<void> => {
  const { reportType, departmentId } = req.body;
  // unused userId
  
  if (!reportType) {
    sendError(res, 400, 'reportType is required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  // In production:
  // 1. attainmentService.calculateProgramOutcomeAttainment(...)
  // 2. Fetch CQI Actions
  // 3. Feed to LLM via Orchestrator
  const mockReport = `Generated ${reportType} Report for Department ${departmentId || 'ALL'}...\n\nAttainment Summary: 82%\nCQI Actions: 12 Pending.\nBloom's Distribution: Optimal.`;

  sendSuccess(res, { report: mockReport }, { message: 'OBE Analysis Complete' });
};

/**
 * POST /v1/copilot/test-paper
 * Generates an end-to-end examination paper with answer key and marking scheme.
 */
export const generateTestPaper = async (req: Request, res: Response): Promise<void> => {
  const { subject, topic, grade, duration, totalMarks, difficulty, customInstructions } = req.body;
  const userId = req.user?.id ?? 'demo-faculty-id';
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  if (!subject || !topic) {
    sendError(res, 400, 'subject and topic are required', { errorCode: 'VALIDATION_ERROR' });
    return;
  }

  const paper = await TeacherCopilotService.generateTestPaper(userId, organizationId, {
    subject,
    topic,
    grade,
    duration,
    totalMarks,
    difficulty,
    customInstructions
  });

  sendSuccess(res, paper, { message: 'Examination test paper generated successfully' }, 201);
};

/**
 * GET /v1/copilot/test-papers
 * Retrieves all generated test papers.
 */
export const getTestPapers = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user?.activeOrganizationId ?? req.user?.organizationId ?? '';

  const where: any = {};
  if (organizationId) {
    where.organizationId = organizationId;
  }

  const papers = await prisma.generatedPaper.findMany({
    where,
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          subject: true,
          duration: true,
          totalMarks: true,
          status: true,
          createdById: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  sendSuccess(res, papers, { message: 'Test papers retrieved' });
};

/**
 * GET /v1/copilot/test-paper/:id
 * Retrieves a single test paper with full section and question details.
 */
export const getTestPaperById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const paper = await prisma.generatedPaper.findUnique({
    where: { id },
    include: {
      assignment: true
    }
  });

  if (!paper) {
    sendError(res, 404, 'Test paper not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  sendSuccess(res, paper, { message: 'Test paper retrieved' });
};

/**
 * DELETE /v1/copilot/test-paper/:id
 * Deletes a test paper.
 */
export const deleteTestPaper = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const paper = await prisma.generatedPaper.findUnique({ where: { id } });
  if (!paper) {
    sendError(res, 404, 'Test paper not found', { errorCode: 'NOT_FOUND' });
    return;
  }

  await prisma.generatedPaper.delete({ where: { id } });
  if (paper.assignmentId) {
    try {
      await prisma.assignment.delete({ where: { id: paper.assignmentId } });
    } catch {
      // ignore if cascade already deleted
    }
  }

  sendSuccess(res, { deleted: true }, { message: 'Test paper deleted' });
};

