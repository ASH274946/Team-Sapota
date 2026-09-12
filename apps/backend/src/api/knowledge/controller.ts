import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireRequestOrgId } from '../../security/request-context';
import { parsePagination, buildPagination } from '../common/pagination';
import { sendSuccess, sendAccepted } from '../common/response';
import { ApiError } from '../common/errors';
import { KnowledgeQualityService } from '../../services/knowledge-quality.service';
import { serializeQualityScore, serializeEvaluationJob, serializeChunkQualityMetrics, serializeQualityReport } from './serializers';
import type { QualityReportDto } from './dto';

export async function getQualityScores(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order } = parsePagination(req);
  const orgId = requireRequestOrgId(req);
  const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
  const maxScore = req.query.maxScore ? Number(req.query.maxScore) : undefined;

  const where: any = {};
  if (orgId) {
    where.chunk = { document: { organizationId: orgId } };
  }
  if (minScore !== undefined || maxScore !== undefined) {
    where.overallScore = {};
    if (minScore !== undefined) where.overallScore.gte = minScore;
    if (maxScore !== undefined) where.overallScore.lte = maxScore;
  }

  const [scores, total] = await Promise.all([
    prisma.chunkQualityMetrics.findMany({
      where,
      orderBy: { [sort === 'createdAt' ? 'evaluatedAt' : sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chunkQualityMetrics.count({ where }),
  ]);

  sendSuccess(res, {
    data: scores.map(serializeQualityScore),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getDocumentQuality(req: Request, res: Response): Promise<void> {
  const { documentId } = req.params;

  const document = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!document) throw ApiError.notFound('Document not found');

  const chunks = await prisma.knowledgeChunk.findMany({
    where: { documentId },
    select: { id: true },
  });

  const chunkIds = chunks.map((c) => c.id);

  const qualities = await prisma.chunkQualityMetrics.findMany({
    where: { chunkId: { in: chunkIds } },
    orderBy: { overallScore: 'desc' },
  });

  sendSuccess(res, { data: qualities.map(serializeQualityScore) });
}

export async function triggerEvaluation(req: Request, res: Response): Promise<void> {
  const { documentId, organizationId } = req.body;
  const orgId = organizationId || requireRequestOrgId(req);

  const where: any = {};
  if (documentId) where.documentId = documentId;
  if (orgId) where.document = { organizationId: orgId };

  const chunks = await prisma.knowledgeChunk.findMany({ where, select: { id: true } });
  if (chunks.length === 0) throw ApiError.notFound('No chunks found to evaluate');

  const results = [];
  for (const chunk of chunks) {
    const qualityData = await KnowledgeQualityService.evaluateChunkQuality(chunk.id);
    results.push({ chunkId: chunk.id, ...qualityData });
  }

  sendAccepted(res, { evaluated: results.length, chunks: results });
}

export async function checkEvaluationJob(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) throw ApiError.notFound('Evaluation job not found');

  sendSuccess(res, { data: serializeEvaluationJob(job) });
}

export async function getChunkQuality(req: Request, res: Response): Promise<void> {
  const { chunkId } = req.params;

  const chunk = await prisma.knowledgeChunk.findUnique({ where: { id: chunkId } });
  if (!chunk) throw ApiError.notFound('Chunk not found');

  const quality = await prisma.chunkQualityMetrics.findUnique({ where: { chunkId } });
  if (!quality) throw ApiError.notFound('Quality metrics not found for this chunk');

  sendSuccess(res, { data: serializeChunkQualityMetrics(quality) });
}

export async function generateQualityReport(req: Request, res: Response): Promise<void> {
  const orgId = requireRequestOrgId(req);

  const qualities = await prisma.chunkQualityMetrics.findMany({
    where: { chunk: { document: { organizationId: orgId } } },
  });

  if (qualities.length === 0) throw ApiError.notFound('No quality data available for report');

  const total = qualities.length;
  const avgScore = qualities.reduce((sum, q) => sum + q.overallScore, 0) / total;

  const scoreDistribution: Record<string, number> = {
    '0.0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0,
  };

  qualities.forEach((q) => {
    if (q.overallScore < 0.2) scoreDistribution['0.0-0.2']++;
    else if (q.overallScore < 0.4) scoreDistribution['0.2-0.4']++;
    else if (q.overallScore < 0.6) scoreDistribution['0.4-0.6']++;
    else if (q.overallScore < 0.8) scoreDistribution['0.6-0.8']++;
    else scoreDistribution['0.8-1.0']++;
  });

  const recommendations: Record<string, number> = {};
  qualities.forEach((q) => {
    const key = q.recommendation ?? 'unknown';
    recommendations[key] = (recommendations[key] || 0) + 1;
  });

  const report: QualityReportDto = {
    totalChunks: total,
    averageScore: Math.round(avgScore * 100) / 100,
    scoreDistribution,
    tinyChunks: qualities.filter((q) => q.isTiny).length,
    oversizedChunks: qualities.filter((q) => q.isOversized).length,
    orphanChunks: qualities.filter((q) => q.isOrphan).length,
    recommendations,
    generatedAt: new Date().toISOString(),
  };

  sendSuccess(res, { data: serializeQualityReport(report) });
}
