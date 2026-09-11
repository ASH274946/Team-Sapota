import type { Request, Response } from 'express';
import { createAssignmentSchema } from '../validators/assignment.validator';
import {
  createAssignment,
  enqueueGeneration,
  listAssignments,
  deleteAssignment,
} from '../services/assignment.service';
import { sendSuccess, sendError } from '../utils/api-response';
import { emitToAssignment } from '../sockets/socket.server';

import { isFacultyRole } from '../security/request-context';
import type { FileRef } from '../types/assignment.types';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { getPaper } from '../services/paper.service';
import { buildCanonicalGenerationState } from '../services/canonical-metadata.service';
import { v4 as uuidv4 } from 'uuid';
import { workflowEngine } from '../workflows/workflow-engine';

import fs from 'fs';
import { getStorageAdapter } from '../services/storage';

export async function createAssignmentHandler(req: Request, res: Response): Promise<void> {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  const rawQuestionConfig = typeof body.questionConfig === 'string'
    ? body.questionConfig
    : JSON.stringify(body.questionConfig);

  let questionConfig: Record<string, any> = {};
  if (rawQuestionConfig) {
    try {
      questionConfig = typeof rawQuestionConfig === 'string' ? JSON.parse(rawQuestionConfig) : rawQuestionConfig;
    } catch {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: { questionConfig: ['Invalid questionConfig JSON'] },
      });
      return;
    }
  }

  const parsed = createAssignmentSchema.safeParse({
    ...body,
    duration: Number(body.duration),
    totalMarks: Number(body.totalMarks),
    questionConfig: {
      types: questionConfig.types ?? [],
      count: Number(questionConfig.count) || 0,
      difficulty: {
        easy: questionConfig.difficulty?.easy !== undefined ? Number(questionConfig.difficulty.easy) : 34,
        medium: questionConfig.difficulty?.medium !== undefined ? Number(questionConfig.difficulty.medium) : 33,
        hard: questionConfig.difficulty?.hard !== undefined ? Number(questionConfig.difficulty.hard) : 33,
      },
    },
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    logger.warn({ fieldErrors }, '[createAssignment] Validation failed');
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: fieldErrors,
    });
    return;
  }

  const storage = getStorageAdapter();
  const rawFiles = (req.files as Express.Multer.File[] ?? []);
  const files: FileRef[] = await Promise.all(rawFiles.map(async (f) => {
    const filename = f.filename || f.originalname;
    const storageKey = `uploads/${filename}`;
    try {
      const fileBuffer = f.buffer || (f.path && fs.existsSync(f.path) ? await fs.promises.readFile(f.path) : null);
      if (fileBuffer) {
        await storage.save(storageKey, fileBuffer, f.mimetype);
        logger.info(`[createAssignment] Uploaded input file to R2: ${storageKey}`);
      }
    } catch (e) {
      logger.warn(`[createAssignment] Could not upload input file to R2: ${e}`);
    }
    return {
      originalName: f.originalname,
      storedName: filename,
      mimeType: f.mimetype,
      size: f.size,
      path: storageKey,
      storageKey,
    };
  }));

  const organizationId = requireRequestOrgId(req);
  const createdById = getRequestUserId(req);
  const classId = body.classId ? String(body.classId) : null;
  const assignment = await createAssignment(parsed.data, files, organizationId, createdById, classId);
  
  let jobId: string, position: number, jobRecordId: string, generationSeq: number;
  const userId = req.user?.id || 'anon';
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // Send response immediately, then process queue in background
  void (async () => {
    try {
      const result = await enqueueGeneration(assignment.id, userId, organizationId);
      jobId = result.jobId;
      position = result.position;
      jobRecordId = result.jobRecordId;
      generationSeq = result.generationSeq;

      logger.info({
        action: 'Generation Started',
        userId,
        organizationId,
        requestId,
        timestamp: new Date().toISOString()
      }, 'Generation Started');

      assignment.status = 'GENERATING';

      emitToAssignment(assignment.id, 'generation:queued', {
        assignmentId: assignment.id,
        jobId,
        jobRecordId,
        generationSeq,
        position,
        version: 0,
        ts: Date.now(),
      });
    } catch (err: any) {
      logger.error({ err, assignmentId: assignment.id }, 'Failed to enqueue generation in background');
      // Still emit error to client via WebSocket if available
      if (!err.message.includes('already in progress')) {
        emitToAssignment(assignment.id, 'generation:failed', {
          assignmentId: assignment.id,
          error: err.message,
          retryable: true,
          jobRecordId: 'unknown',
          generationSeq: 0,
          version: 0,
          ts: Date.now(),
        });
      }
    }
  })();

  // Send immediate response with assignment created
  sendSuccess(res, { assignment, jobId: null, position: null, jobRecordId: null, generationSeq: null }, 201, 'Assignment created successfully');
}

export async function generateAssignmentHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const force = req.query.force === 'true';

  logger.debug(`[generateHandler] START | assignmentId=${id} | force=${force}`);

  try {
    const assignment = await loadAssignmentForRequest(req, id);
    assertFacultyOwnsAssignment(req, assignment);
    logger.debug(`[generateHandler] Assignment found: status=${assignment.status} title="${assignment.title}"`);

    if (!force && ['GENERATING'].includes(assignment.status)) {
      logger.warn(`[generateHandler] Generation already in progress (status=${assignment.status}) — returning 409`);
      sendError(res, 'Generation already in progress', 409);
      return;
    }
    if (assignment.status === 'PARTIALLY_GENERATED') {
      logger.debug(`[generateHandler] Assignment has partial generation — allowing regeneration`);
    }

    const activeId = (assignment as any).activeGenerationJobId ? String((assignment as any).activeGenerationJobId) : '';
    if (activeId) {
      const activeJob = await prisma.generationJob.findUnique({ where: { id: activeId } });
      if (!force && activeJob && ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'].includes(activeJob.status)) {
        logger.warn(`[generateHandler] Active GenerationJob in progress (${activeJob.id}, status=${activeJob.status}) — returning 409`);
        sendError(res, 'Generation already in progress', 409);
        return;
      }
    }

    logger.debug(`[generateHandler] Enqueuing generation...`);
    const t0 = Date.now();

    let jobId: string, position: number, jobRecordId: string, generationSeq: number;
    const organizationId = requireRequestOrgId(req);
    const userId = getRequestUserId(req);
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    try {
      const result = await enqueueGeneration(id, userId, organizationId);
      jobId = result.jobId;
      position = result.position;
      jobRecordId = result.jobRecordId;
      generationSeq = result.generationSeq;
    } catch (err: any) {
      if (err.message.includes('already in progress')) {
        res.status(409).json({ success: false, error: err.message });
        return;
      }
      throw err;
    }

    logger.info({
      action: 'Generation Started',
      userId,
      organizationId,
      requestId,
      timestamp: new Date().toISOString()
    }, 'Generation Started');

    logger.debug(`[generateHandler] Enqueued in ${Date.now() - t0}ms | jobId=${jobId} position=${position}`);

    logger.debug(`[generateHandler] Emitting generation:queued via WebSocket`);
    emitToAssignment(id, 'generation:queued', {
      assignmentId: id,
      jobId,
      jobRecordId,
      generationSeq,
      position,
      version: 0,
      ts: Date.now(),
    });

    logger.info(`[generateHandler] COMPLETE — returning 202`);
    sendSuccess(res, { jobId, position, jobRecordId, generationSeq }, 202, 'Generation queued successfully');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

const ASSIGNMENT_STATUSES = [
  'DRAFT',
  'GENERATING',
  'GENERATED',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED'
] as const;

export async function listAssignmentsHandler(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const rawStatus = (req.query.status as string) || '';
  const status = (typeof rawStatus === 'string' && ASSIGNMENT_STATUSES.includes(rawStatus as (typeof ASSIGNMENT_STATUSES)[number]))
      ? (rawStatus as any)
      : undefined;

  const listFilter = assignmentListFilter(req);
  const result = await listAssignments(page, limit, status, listFilter.organizationId, listFilter.createdById);

  res.status(200).json({
    success: true,
    data: result.assignments,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      pages: Math.ceil(result.total / limit),
    },
  });
}

export async function getAssignmentHandler(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertCanViewAssignment(req, assignment);
    
    // Only enforce faculty ownership rules if the user is acting as a faculty member
    if (req.body._requireOwnership && isFacultyRole(req.user?.role)) {
      assertFacultyOwnsAssignment(req, assignment);
    }
  const [job, paper, studentSubmission] = await Promise.all([
    prisma.generationJob.findFirst({
      where: { assignmentId: req.params.id },
      orderBy: [{ generationSeq: 'desc' }, { createdAt: 'desc' }],
    }),
    getPaper(req.params.id),
    req.user?.role === 'STUDENT' ? prisma.studentSubmission.findFirst({
      where: { assignmentId: req.params.id, studentId: req.user.id }
    }) : Promise.resolve(null),
  ]);
  const generationState = buildCanonicalGenerationState({
    assignment: assignment as any,
    job: (job as any) ?? null,
    paper: (paper as any) ?? null,
  });
  const assignmentWithPaper = {
    ...assignment,
    generatedPapers: paper ? [paper] : [],
    studentSubmission
  };
  sendSuccess(res, { assignment: assignmentWithPaper, generationState });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function deleteAssignmentHandler(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    assertFacultyOwnsAssignment(req, assignment);
    const organizationIdScope = requireRequestOrgId(req);

  if (['GENERATING', 'GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(assignment.status)) {
    const activeId = (assignment as any).activeGenerationJobId ? String((assignment as any).activeGenerationJobId) : '';
    const activeJob = activeId ? await prisma.generationJob.findUnique({ where: { id: activeId } }) : null;

    if (activeJob && ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'].includes(activeJob.status)) {
      sendError(res, 'Cannot delete assignment while generation is in progress', 409);
      return;
    }

    if (['PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'ACTIVE'].includes(assignment.status)) {
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
            sendError(res, 'Cannot delete assignment in this state. Admin rights required.', 403);
            return;
        }
    }

    logger.warn(`Assignment ${req.params.id} had stale status=${assignment.status} with no active job; allowing delete`);
  }

  await deleteAssignment(req.params.id, organizationIdScope);
  logger.info(`Assignment deleted: ${req.params.id}`);
  sendSuccess(res, null, 200, 'Assignment deleted successfully');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

import { AuditService } from '../services/audit.service';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import {
  loadAssignmentForRequest,
  assertFacultyOwnsAssignment,
  assertCanViewAssignment,
  assignmentListFilter,
  handleAccessError,
} from '../security/assignment-access';

export async function submitAssignmentForApproval(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    assertFacultyOwnsAssignment(req, assignment);
  
  if (!workflowEngine.canTransition(assignment.status as any, 'PENDING_APPROVAL')) {
    return sendError(res, `Cannot transition from ${assignment.status} to PENDING_APPROVAL`, 409);
  }

  await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: 'PENDING_APPROVAL' }
  });

  const orgAdmins = await prisma.user.findMany({
    where: { 
      OR: [
        { organizationId: assignment.organizationId, role: 'ADMIN' },
        { role: 'SUPER_ADMIN' }
      ]
    }
  });

  if (orgAdmins.length > 0) {
    await prisma.notification.createMany({
      data: orgAdmins.map(admin => ({
        id: uuidv4(),
        userId: admin.id,
        organizationId: assignment.organizationId,
        title: 'Pending Approval',
        message: `An assignment "${assignment.title}" has been submitted for your approval.`,
        type: 'INFO'
      }))
    });
  }

  await AuditService.logAuditEvent({ action: 'ASSIGNMENT_SUBMITTED', entity: 'Assignment', entityId: assignment.id, userId: req.user?.id, ipAddress: req.ip });
  sendSuccess(res, null, 200, 'Assignment submitted for approval');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function approveAssignment(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
  
  if (!workflowEngine.canTransition(assignment.status as any, 'APPROVED')) {
    return sendError(res, `Cannot transition from ${assignment.status} to APPROVED`, 409);
  }

  await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', approvedBy: req.user?.id, approvedAt: new Date() }
  });

  await AuditService.logAuditEvent({ action: 'ASSIGNMENT_APPROVED', entity: 'Assignment', entityId: assignment.id, userId: req.user?.id, ipAddress: req.ip });
  sendSuccess(res, null, 200, 'Assignment approved');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function rejectAssignment(req: Request, res: Response): Promise<void> {
  try {
    const { comments } = req.body;
    const assignment = await loadAssignmentForRequest(req, req.params.id);
  
  if (!workflowEngine.canTransition(assignment.status as any, 'REJECTED')) {
    return sendError(res, `Cannot transition from ${assignment.status} to REJECTED`, 409);
  }

  await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', rejectedBy: req.user?.id, rejectedAt: new Date(), reviewComments: comments }
  });

  await AuditService.logAuditEvent({ action: 'ASSIGNMENT_REJECTED', entity: 'Assignment', entityId: assignment.id, userId: req.user?.id, ipAddress: req.ip, metadata: { comments } });
  sendSuccess(res, null, 200, 'Assignment rejected');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function publishAssignment(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
  
  if (!workflowEngine.canTransition(assignment.status as any, 'PUBLISHED')) {
    return sendError(res, `Cannot transition from ${assignment.status} to PUBLISHED`, 409);
  }

  await prisma.assignment.update({
    where: { id: req.params.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() }
  });

  await AuditService.logAuditEvent({ action: 'ASSIGNMENT_PUBLISHED', entity: 'Assignment', entityId: assignment.id, userId: req.user?.id, ipAddress: req.ip });
  sendSuccess(res, null, 200, 'Assignment published successfully');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function getAssignmentHistoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    await assertCanViewAssignment(req, assignment);

    const papers = await prisma.generatedPaper.findMany({
      where: { assignmentId: req.params.id },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        duration: true,
        generatedAt: true,
        canonicalMetadata: true,
        pdfUrl: true,
      }
    });

    sendSuccess(res, { papers });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function updateAssignmentHandler(req: Request, res: Response): Promise<void> {
  try {
    const assignment = await loadAssignmentForRequest(req, req.params.id);
    assertFacultyOwnsAssignment(req, assignment);
    
    // Check if we can edit this assignment (e.g., shouldn't be generating or published)
    if (['GENERATING', 'GENERATED', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED'].includes(assignment.status)) {
      sendError(res, 'Cannot update assignment in this state', 409);
      return;
    }

    const { title, description, subject, dueDate } = req.body;
    
    const updated = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        title: title ?? undefined,
        description: description ?? undefined,
        subject: subject ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    });

    sendSuccess(res, { assignment: updated });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}
