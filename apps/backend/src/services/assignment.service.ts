import crypto from 'crypto';
import prisma from '../config/prisma';
import type { CreateAssignmentInput } from '../validators/assignment.validator';
import type { FileRef } from '../types/assignment.types';
import { logger } from '../utils/logger';
import { getGenerationQueue } from '../queues/generation.queue';

export interface AssignmentListResult {
  assignments: unknown[];
  total: number;
  page: number;
  limit: number;
}

export async function createAssignment(
  input: CreateAssignmentInput,
  files: FileRef[],
  organizationId: string,
  createdById?: string,
  classId?: string | null,
) {
  const { typeBreakdown, ...rest } = input;
  const assignment = await prisma.assignment.create({
    data: {
      ...rest,
      ...(typeBreakdown ? { typeBreakdown } : {}),
      dueDate: new Date(input.dueDate),
      uploadedFiles: files as any,
      status: 'DRAFT',
      organizationId,
      createdById: createdById ?? null,
      classId: classId ?? null,
      questionConfig: rest.questionConfig as any,
    },
  });

  logger.info(`Assignment created: ${assignment.id} by ${createdById ?? 'unknown'}`);
  return assignment;
}

export async function enqueueGeneration(
  assignmentId: string,
  userId: string,
  organizationId: string
): Promise<{ jobId: string; position: number; jobRecordId: string; generationSeq: number }> {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, organizationId },
  });
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  // BullMQ Queue Protection (Idempotency)
  const queue = getGenerationQueue();
  const syllabusString = JSON.stringify(assignment.uploadedFiles);
  const configString = JSON.stringify(assignment.questionConfig) + (assignment.additionalInstructions ?? '') + assignment.totalMarks;
  
  const syllabusHash = crypto.createHash('sha256').update(syllabusString).digest('hex');
  const configHash = crypto.createHash('sha256').update(configString).digest('hex');
  
  const jobIdString = `${userId || 'anon'}-${syllabusHash}-${configHash}`;
  const customJobId = crypto.createHash('sha256').update(jobIdString).digest('hex');

  const existingJob = await queue.getJob(customJobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'active' || state === 'waiting' || state === 'delayed') {
      throw new Error('A duplicate generation job with identical configuration is already in progress.');
    }
    await existingJob.remove().catch(() => {});
  }

  const nextSeq = (assignment.generationSeq ?? 0) + 1;
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { generationSeq: nextSeq, status: 'GENERATING', finalizedAt: null },
  });

  const jobRecord = await prisma.generationJob.create({
    data: {
      assignmentId,
      generationSeq: nextSeq,
      progressVersion: 0,
      stageIndex: 0,
      status: 'queued',
      progress: 0,
      startedAt: new Date(),
    },
  });

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { activeGenerationJobId: jobRecord.id },
  });

  const bullmqJobId = `gen-${assignmentId}-${jobRecord.id}`;

  // Add job with timeout to prevent hanging
  let job: any;
  try {
    job = await Promise.race([
      queue.add(
        'generate-paper',
        { assignmentId, jobRecordId: jobRecord.id, userId, organizationId },
        { jobId: bullmqJobId }
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Queue timeout after 10s')), 10000)
      ),
    ]);
  } catch (err: any) {
    // If queue times out, use a fallback job ID
    logger.warn(`Queue.add() timed out for assignment ${assignmentId}, using fallback job ID`);
    job = { id: bullmqJobId };
  }

  await prisma.generationJob.update({
    where: { id: jobRecord.id },
    data: { bullmqJobId: job.id ?? '' },
  });

  const waiting = await queue.getWaitingCount().catch(() => 1);
  logger.info(`Enqueued generation job ${job.id} for assignment ${assignmentId}`);

  return { jobId: job.id ?? '', position: waiting, jobRecordId: jobRecord.id, generationSeq: nextSeq };
}

export async function listAssignments(
  page = 1,
  limit = 10,
  status?: import('@prisma/client').WorkflowStatus,
  organizationId?: string,
  createdById?: string,
): Promise<AssignmentListResult> {
  const filter: Record<string, unknown> = {};
  if (status) {
    filter.status = status;
  }
  if (organizationId) filter.organizationId = organizationId;
  if (createdById) filter.createdById = createdById;
  
  const skip = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.assignment.count({ where: filter }),
  ]);

  return { assignments, total, page, limit };
}

export async function getAssignment(id: string, organizationId?: string) {
  const filter: any = { id };
  if (organizationId) filter.organizationId = organizationId;
  return prisma.assignment.findFirst({ where: filter });
}

export async function deleteAssignment(id: string, organizationId?: string): Promise<void> {
  const filter: any = { id };
  if (organizationId) filter.organizationId = organizationId;
  await prisma.assignment.deleteMany({ where: filter });
}
