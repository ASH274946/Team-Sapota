import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { sendSuccess, sendCreated, sendAccepted } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import { evaluateSubmission } from '../../services/grader.service';
import { AuditService } from '../../services/audit.service';
import { assertCanGradeAssignment, loadSubmissionScoped } from '../../security/assignment-access';
import prisma from '../../config/prisma';
import { serializeGradingConfig, serializeSubmission, serializeEvaluation, serializeBulkEvaluateJob } from './serializers';

export const saveGradingConfig = async (req: Request, res: Response): Promise<void> => {
  const log = (req as any).logger ?? undefined;
  try {
    const { assignmentId } = req.params;
    const userId = getRequestUserId(req);
    const orgId = requireRequestOrgId(req);

    await assertCanGradeAssignment(req, assignmentId);

    const existing = await prisma.assignmentGradingConfig.findUnique({ where: { assignmentId } });
    let config: any;

    if (existing) {
      config = await (prisma as any).assignmentGradingConfig.update({
        where: { assignmentId },
        data: {
          answerKeyText: req.body.answerKeyText,
          rubricId: req.body.rubricId ?? null,
          aiModel: req.body.aiModel ?? null,
          passingScore: req.body.passingScore ?? null,
          maxAttempts: req.body.maxAttempts ?? null,
          gradingType: req.body.gradingType,
        },
      });
    } else {
      config = await (prisma as any).assignmentGradingConfig.create({
        data: {
          assignmentId,
          answerKeyText: req.body.answerKeyText,
          rubricId: req.body.rubricId ?? null,
          aiModel: req.body.aiModel ?? null,
          passingScore: req.body.passingScore ?? null,
          maxAttempts: req.body.maxAttempts ?? null,
          gradingType: req.body.gradingType,
          status: 'ACTIVE',
        },
      });
    }

    await AuditService.logAuditEvent({
      userId,
      organizationId: orgId,
      action: 'GRADING_CONFIG_SAVED',
      entity: 'GradingConfig',
      entityId: config.id,
      metadata: { assignmentId },
    });

    sendCreated(res, serializeGradingConfig(config));
  } catch (error: any) {
    (log ?? logger).error({ err: error, stack: error.stack, assignmentId: req.params.assignmentId }, '[saveGradingConfig]');
    throw error;
  }
};

export const getGradingConfig = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;

  await assertCanGradeAssignment(req, assignmentId);

  const config = await prisma.assignmentGradingConfig.findUnique({
    where: { assignmentId },
    include: { rubric: { include: { criteria: true } } },
  });

  if (!config) {
    throw ApiError.notFound('Grading configuration not found for this assignment');
  }

  sendSuccess(res, { data: serializeGradingConfig(config) });
};

export const listSubmissionsForGrading = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;
  const { page, limit, sort, order } = parsePagination(req);

  await assertCanGradeAssignment(req, assignmentId);

  const where = { assignmentId };
  const [submissions, total] = await Promise.all([
    prisma.studentSubmission.findMany({
      where,
      include: { student: { select: { name: true } } } as any,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.studentSubmission.count({ where }),
  ]);

  sendSuccess(res, {
    data: submissions.map(serializeSubmission),
    pagination: buildPagination(page, limit, total),
  });
};

export const evaluateSubmissionById = async (req: Request, res: Response): Promise<void> => {
  const { submissionId } = req.params;
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const submission = await loadSubmissionScoped(req, submissionId);
  if (!submission) throw ApiError.notFound('Submission not found');

  const result = await evaluateSubmission(submissionId);

  await AuditService.logAuditEvent({
    userId,
    organizationId: orgId,
    action: 'SUBMISSION_EVALUATED',
    entity: 'SubmissionEvaluation',
    entityId: submissionId,
    metadata: { assignmentId: submission.assignmentId },
  });

  sendSuccess(res, { data: serializeEvaluation(result) });
};

export const getEvaluationResult = async (req: Request, res: Response): Promise<void> => {
  const { submissionId } = req.params;

  await loadSubmissionScoped(req, submissionId);

  const evaluation = await prisma.submissionEvaluation.findUnique({
    where: { submissionId },
  });

  if (!evaluation) {
    throw ApiError.notFound('Evaluation not found for this submission');
  }

  sendSuccess(res, { data: serializeEvaluation(evaluation) });
};

export const overrideGrade = async (req: Request, res: Response): Promise<void> => {
  const { submissionId } = req.params;
  const { score, reason, criteriaGrades } = req.body;
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const submission = await loadSubmissionScoped(req, submissionId);

  const evaluation = await (prisma as any).submissionEvaluation.upsert({
    where: { submissionId },
    create: {
      submissionId,
      score,
      totalMarks: 0,
      generalFeedback: reason,
      criteriaGrades: criteriaGrades ?? [],
      overriddenAt: new Date(),
      overrideReason: reason,
    },
    update: {
      score,
      generalFeedback: reason,
      criteriaGrades: criteriaGrades ?? undefined,
      overriddenAt: new Date(),
      overrideReason: reason,
    },
  });

  await prisma.studentSubmission.update({
    where: { id: submissionId },
    data: { status: 'GRADED' },
  });

  await AuditService.logAuditEvent({
    userId,
    organizationId: orgId,
    action: 'GRADE_OVERRIDDEN',
    entity: 'SubmissionEvaluation',
    entityId: submissionId,
    metadata: { assignmentId: submission.assignmentId, reason },
  });

  sendSuccess(res, { data: serializeEvaluation(evaluation) });
};

export const bulkEvaluate = async (req: Request, res: Response): Promise<void> => {
  const { assignmentId } = req.params;
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  await assertCanGradeAssignment(req, assignmentId);

  const submissions = await prisma.studentSubmission.findMany({
    where: { assignmentId, status: 'PENDING' as any },
  });

  if (submissions.length === 0) {
    throw ApiError.badRequest('No pending submissions to evaluate');
  }

  const job = await prisma.generationJob.create({
    data: {
      assignmentId,
      status: 'queued',
      progress: 0,
      progressVersion: 0,
      stageIndex: 0,
      startedAt: new Date(),
    },
  });

  submissions.forEach((sub) => {
    evaluateSubmission(sub.id)
      .then(() => {
        prisma.generationJob.update({
          where: { id: job.id },
          data: { progress: { increment: 1 } },
        }).catch(() => {});
      })
      .catch(() => {});
  });

  await AuditService.logAuditEvent({
    userId,
    organizationId: orgId,
    action: 'BULK_EVALUATION_STARTED',
    entity: 'Assignment',
    entityId: assignmentId,
    metadata: { submissionCount: submissions.length, jobId: job.id },
  });

  sendAccepted(res, { jobId: job.id, submissionCount: submissions.length });
};

export const getBulkEvaluateJobStatus = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });

  if (!job) {
    throw ApiError.notFound('Bulk evaluation job not found');
  }

  sendSuccess(res, { data: serializeBulkEvaluateJob(job) });
};
