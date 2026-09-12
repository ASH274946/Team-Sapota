import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireRequestOrgId } from '../../security/request-context';
import { parsePagination, buildPagination } from '../common/pagination';
import { sendSuccess, sendCreated, sendAccepted } from '../common/response';
import { ApiError } from '../common/errors';
import { ingestionQueue } from '../../queues/ingestion.queue';
import { serializeDocument } from './serializers';

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const orgId = requireRequestOrgId(req);

  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const file = req.file;

  const document = await prisma.knowledgeDocument.create({
    data: {
      filename: file.originalname,
      fileUrl: file.path,
      organizationId: orgId,
    } as any,
  });

  sendCreated(res, serializeDocument(document as any));
}

export async function parseDocument(req: Request, res: Response): Promise<void> {
  const { documentId } = req.body;

  const document = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!document) throw ApiError.notFound('Document not found');

  const job = await ingestionQueue.add('parse-document', { documentId });

  await (prisma as any).knowledgeDocument.update({
    where: { id: documentId },
    data: { status: 'parsing' },
  });

  sendAccepted(res, { jobId: job.id, documentId, status: 'queued' });
}

export async function listDocuments(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order } = parsePagination(req);
  const orgId = requireRequestOrgId(req);
  const status = req.query.status as string | undefined;

  const where: any = { organizationId: orgId };
  if (status) where.status = status;

  const [documents, total] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeDocument.count({ where }),
  ]);

  sendSuccess(res, {
    data: documents.map(serializeDocument as any),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const document = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!document) throw ApiError.notFound('Document not found');

  sendSuccess(res, { data: serializeDocument(document as any) });
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Document not found');

  await prisma.knowledgeDocument.delete({ where: { id } });

  sendSuccess(res, { data: { id }, message: 'Document deleted successfully' });
}

export async function processDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const document = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!document) throw ApiError.notFound('Document not found');

  const job = await ingestionQueue.add('process-document', {
    documentId: id,
    fileUrl: document.fileUrl,
    organizationId: document.organizationId,
    filename: document.filename,
  });

  await (prisma as any).knowledgeDocument.update({
    where: { id },
    data: { status: 'processing' },
  });

  sendAccepted(res, { jobId: job.id, documentId: id, status: 'queued' });
}

export async function checkDocumentJob(req: Request, res: Response): Promise<void> {
  const { id, jobId } = req.params;

  const document = await prisma.knowledgeDocument.findUnique({ where: { id } });
  if (!document) throw ApiError.notFound('Document not found');

  const job = await ingestionQueue.getJob(jobId);
  if (!job) throw ApiError.notFound('Job not found');

  const state = await job.getState();

  sendSuccess(res, {
    data: {
      jobId: job.id,
      status: state,
      progress: job.progress ?? null,
      resultUrl: null,
      error: job.failedReason ?? null,
      estimatedCompletion: null,
    },
  });
}
