import { Worker } from 'bullmq';
import { env } from '../config/env';
import { getBullRedisClient, getRedisClient } from '../config/redis';
import prisma from '../config/prisma';
import { generatePdf, generateLessonPlanPdf } from '../services/pdf.service';
import { updatePaperPdf } from '../services/paper.service';
import { emitToAssignment } from '../sockets/socket.server';
import type { PdfJobData, LessonPlanPdfJobData, AnyPdfJobData } from '../types/queue.types';
import type { ILessonPlanData } from '../types/lesson-plan.types';
import { logger } from '../utils/logger';

/** Redis key pattern for lesson plan PDF job results — 1-hour TTL */
const LP_PDF_KEY = (jobId: string) => `vidya:lessonplan:pdf:${jobId}`;
const LP_PDF_TTL_SECONDS = 3600;

let pdfWorker: Worker<AnyPdfJobData> | null = null;

export function getPdfWorker(): Worker<AnyPdfJobData> | null {
  return pdfWorker;
}

export function createPdfWorker() {
  if (pdfWorker) return pdfWorker;

  pdfWorker = new Worker<AnyPdfJobData>(
    'pdf',
    async (job) => {
      const data = job.data as AnyPdfJobData;

      // ── Route by job type ──────────────────────────────────────────────────
      if ((data as LessonPlanPdfJobData).type === 'lesson-plan-pdf') {
        await handleLessonPlanPdfJob(job.id ?? 'unknown', data as LessonPlanPdfJobData);
        return;
      }

      // ── Default: Question Paper PDF ────────────────────────────────────────
      const { paperId, assignmentId } = data as PdfJobData;
      logger.info(`[WORKER:PDF:START] Job ${job.id} | assignment=${assignmentId}`);

      const paper = await prisma.generatedPaper.findUnique({ where: { id: paperId } });
      if (!paper) {
        logger.warn(`[WORKER:PDF] Paper ${paperId} not found for assignment ${assignmentId}`);
        return;
      }

      const { pdfPath, pdfUrl } = await generatePdf(paper as any);
      await updatePaperPdf(paperId, pdfPath, pdfUrl);
      emitToAssignment(assignmentId, 'generation:pdf_ready', {
        assignmentId,
        paperId,
        pdfUrl,
        ts: Date.now(),
      });
      logger.info(`[WORKER:PDF:COMPLETE] Job ${job.id} | assignment=${assignmentId} | pdf=${pdfUrl}`);
    },
    {
      connection: getBullRedisClient(),
      skipVersionCheck: true,
      concurrency: env.PDF_WORKER_CONCURRENCY,
      lockDuration: 120_000,
      stalledInterval: 60_000,
      drainDelay: 5000,
    }
  );

  pdfWorker.on('active', (job) => logger.debug(`[WORKER:PDF:EVENT] active | job=${job.id}`));
  pdfWorker.on('completed', (job) => logger.info(`[WORKER:PDF:EVENT] completed | job=${job.id}`));
  pdfWorker.on('failed', (job, err) => {
    logger.error(`[WORKER:PDF:EVENT] failed | job=${job?.id} | ${err.message}`);
    // Persist failure state in Redis so the frontend can surface a user-friendly error
    const data = job?.data as LessonPlanPdfJobData | undefined;
    if (data?.type === 'lesson-plan-pdf' && data.jobId) {
      getRedisClient()
        .set(
          LP_PDF_KEY(data.jobId),
          JSON.stringify({ status: 'failed', pdfUrl: null, error: 'PDF generation failed.' }),
          'EX',
          LP_PDF_TTL_SECONDS,
        )
        .catch(() => { /* Redis error: non-fatal */ });
    }
  });
  pdfWorker.on('error', (err) => logger.error(`[WORKER:PDF:EVENT] error | ${err.message}`));
  pdfWorker.on('stalled', (jobId) => logger.error(`[WORKER:PDF:STALL] Job ${jobId} stalled!`));
  pdfWorker.on('closing', (msg) => logger.info(`[WORKER:PDF:EVENT] closing | ${msg}`));

  logger.info('[WORKER:PDF] PDF worker created with LOCAL Redis (BullMQ stable)');
  return pdfWorker;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lesson Plan PDF handler — called from the shared pdf worker
// ─────────────────────────────────────────────────────────────────────────────

async function handleLessonPlanPdfJob(
  bullJobId: string,
  data: LessonPlanPdfJobData,
): Promise<void> {
  const { lessonPlanId, jobId } = data;
  logger.info(`[WORKER:PDF:LP:START] BullJob=${bullJobId} | lessonPlanId=${lessonPlanId} | jobId=${jobId}`);

  // 1. Load LessonPlan from PostgreSQL
  const plan = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
  if (!plan) {
    logger.warn(`[WORKER:PDF:LP] LessonPlan ${lessonPlanId} not found`);
    await getRedisClient().set(
      LP_PDF_KEY(jobId),
      JSON.stringify({ status: 'failed', pdfUrl: null, error: 'Lesson plan not found.' }),
      'EX',
      LP_PDF_TTL_SECONDS,
    );
    return;
  }

  // 2. Construct ILessonPlanData from the DB record
  const activities = parseJsonArray(plan.activities as any);
  const assessments = parseJsonArray(plan.assessments as any);
  const references = plan.referenceMaterials ? parseJsonArray(plan.referenceMaterials as any) : [];

  let parsedContent: Record<string, any> = {};
  if (typeof plan.content === 'string') {
    try {
      parsedContent = JSON.parse(plan.content);
    } catch {
      // ignore
    }
  } else if (plan.content && typeof plan.content === 'object') {
    parsedContent = plan.content as any;
  }

  const materials = parseJsonArray(parsedContent.materials);
  const prerequisites = parseJsonArray(parsedContent.prerequisites);
  const notes = typeof parsedContent.notes === 'string' ? parsedContent.notes : undefined;

  const lessonData: ILessonPlanData = {
    id: plan.id,
    title: plan.title,
    subject: plan.subject,
    grade: plan.grade,
    duration: plan.duration,
    objectives: plan.objectives,
    activities,
    assessments,
    materials: materials.map(String),
    prerequisites: prerequisites.map(String),
    notes,
    referenceMaterials: references.map(String),
    generatedAt: plan.createdAt.toLocaleDateString('en-IN'),
    organizationId: plan.organizationId ?? undefined,
  };

  // 3. Generate the A4 PDF
  const { pdfUrl } = await generateLessonPlanPdf(lessonData);

  // 4. Store result in Redis (1-hour TTL) for frontend polling
  await getRedisClient().set(
    LP_PDF_KEY(jobId),
    JSON.stringify({ status: 'completed', pdfUrl }),
    'EX',
    LP_PDF_TTL_SECONDS,
  );

  logger.info(`[WORKER:PDF:LP:COMPLETE] jobId=${jobId} | pdfUrl=${pdfUrl}`);
}

/** Safely parse a JSON array field from Prisma (Json type can be array or string). */
function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Return as single-element array if parse fails
      return value ? [value] : [];
    }
  }
  return [];
}
