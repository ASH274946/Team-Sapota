import { Request, Response } from 'express';
import { sendSuccess, sendNotFound, sendNoContent } from '../common/response';
import { parsePagination, buildPagination } from '../common/pagination';
import { getGenerationQueue } from '../../queues/generation.queue';
import prisma from '../../config/prisma';
import { serializeJob, serializeCancelResult } from './serializers';

export const getJob = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Job not found');
    return;
  }

  sendSuccess(res, { data: serializeJob(job) });
};

export const listJobs = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order } = parsePagination(req);
  const { status, jobType } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (jobType) where.jobType = jobType;

  const [jobs, total] = await Promise.all([
    prisma.generationJob.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.generationJob.count({ where }),
  ]);

  sendSuccess(res, {
    data: jobs.map(serializeJob),
    pagination: buildPagination(page, limit, total),
  });
};

export const cancelJob = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Job not found');
    return;
  }

  if (job.status === 'QUEUED' || job.status === 'PROCESSING') {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });

    try {
      const queue = getGenerationQueue();
      const bullJob = await queue.getJob(jobId);
      if (bullJob) {
        await bullJob.remove();
      }
    } catch {
      // BullMQ job may not exist; DB status update is sufficient
    }
  }

  sendSuccess(res, { data: serializeCancelResult(jobId, true), message: 'Job cancelled' });
};

export const getJobLogs = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Job not found');
    return;
  }

  sendSuccess(res, { data: [] });
};

export const cleanUpJob = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) {
    sendNotFound(res, 'Job not found');
    return;
  }

  if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
    await prisma.generationJob.delete({ where: { id: jobId } });
  }

  sendNoContent(res);
};
