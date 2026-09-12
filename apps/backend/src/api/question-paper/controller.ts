import { Request, Response } from 'express';
import { sendSuccess, sendAccepted, sendNoContent } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId, requireRequestOrgId, getRequestOrgId } from '../../security/request-context';
import { createAssignment, enqueueGeneration } from '../../services/assignment.service';
import { buildCanonicalGenerationState } from '../../services/canonical-metadata.service';
import { getGenerationQueue } from '../../queues/generation.queue';
import prisma from '../../config/prisma';
import { serializeGeneratedPaper, serializeGenerationJob, serializeAnswerKey } from './serializers';

export const generatePaper = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const { assignmentId } = req.body;

  let assignment: any;

  if (assignmentId) {
    assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, organizationId: orgId },
    });
    if (!assignment) throw ApiError.notFound('Assignment not found');
  } else {
    assignment = await createAssignment(req.body, [], orgId, userId, req.body.classId ?? null);
  }

  const result = await enqueueGeneration(assignment.id, userId, orgId);

  const job = await prisma.generationJob.findUnique({ where: { id: result.jobRecordId } });
  const canonicalState = buildCanonicalGenerationState({
    assignment,
    paper: null,
    job,
  });

  sendAccepted(res, {
    jobId: result.jobId,
    jobRecordId: result.jobRecordId,
    assignmentId: assignment.id,
    canonicalState,
  });
};

export const checkGenerationJob = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const queue = getGenerationQueue();
  const bullJob = await queue.getJob(jobId);

  if (!bullJob) {
    throw ApiError.notFound('Generation job not found');
  }

  const state = await bullJob.getState();
  const progress = bullJob.progress;
  const returnvalue = bullJob.returnvalue;
  const failedReason = bullJob.failedReason;

  sendSuccess(res, {
    data: serializeGenerationJob(
      {
        assignmentId: bullJob.data.assignmentId,
        status: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : 'processing',
        progress: typeof progress === 'number' ? progress : 0,
        stage: state,
        generationSeq: 0,
        error: failedReason ?? undefined,
        resultUrl: returnvalue?.paperId ? `/api/v1/question-paper/${returnvalue.paperId}` : undefined,
        createdAt: new Date(bullJob.timestamp),
      },
      jobId
    ),
  });
};

export const listPapers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order } = parsePagination(req);
  const orgId = requireRequestOrgId(req);
  const { status } = req.query as Record<string, string | undefined>;

  const where: any = { organizationId: orgId };
  if (status) where.status = status;

  const [papers, total] = await Promise.all([
    prisma.generatedPaper.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.generatedPaper.count({ where }),
  ]);

  sendSuccess(res, {
    data: papers.map(serializeGeneratedPaper),
    pagination: buildPagination(page, limit, total),
  });
};

export const getPaperById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = getRequestOrgId(req);

  const paper = await prisma.generatedPaper.findFirst({
    where: { id, ...(orgId ? { organizationId: orgId } : {}) },
  });

  if (!paper) {
    throw ApiError.notFound('Paper not found');
  }

  sendSuccess(res, { data: serializeGeneratedPaper(paper) });
};

export const deletePaper = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = requireRequestOrgId(req);

  const existing = await prisma.generatedPaper.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound('Paper not found');

  await prisma.generatedPaper.delete({ where: { id } });

  sendNoContent(res);
};

export const publishPaper = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = requireRequestOrgId(req);

  const existing = await prisma.generatedPaper.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound('Paper not found');

  const updated = await (prisma as any).generatedPaper.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  sendSuccess(res, { data: serializeGeneratedPaper(updated as any) });
};

export const archivePaper = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const orgId = requireRequestOrgId(req);

  const existing = await prisma.generatedPaper.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) throw ApiError.notFound('Paper not found');

  const updated = await (prisma as any).generatedPaper.update({
    where: { id },
    data: { status: 'ARCHIVED', archivedAt: new Date() },
  });

  sendSuccess(res, { data: serializeGeneratedPaper(updated) });
};

export const getPaperDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const paper = await prisma.generatedPaper.findUnique({ where: { id } });
  if (!paper) throw ApiError.notFound('Paper not found');

  if (!paper.pdfUrl && !paper.pdfPath) {
    throw ApiError.notFound('PDF not available for this paper');
  }

  let downloadUrl = paper.pdfUrl;
  const storageKey = paper.pdfPath || paper.pdfUrl;
  if (storageKey) {
    try {
      const { getR2Storage } = await import('../../services/storage/r2-storage');
      downloadUrl = await getR2Storage().getSignedDownloadUrl(storageKey);
    } catch {
      downloadUrl = paper.pdfUrl;
    }
  }

  sendSuccess(res, { data: { id: paper.id, pdfUrl: downloadUrl } });
};

export const getAnswerKey = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const paper = await prisma.generatedPaper.findUnique({ where: { id } });
  if (!paper) throw ApiError.notFound('Paper not found');

  sendSuccess(res, { data: serializeAnswerKey(paper) });
};
