import { Worker } from 'bullmq';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { env } from '../config/env';
import { getBullRedisClient } from '../config/redis';
import prisma from '../config/prisma';
import { generatePaper, generateAnswersForPaper } from '../services/ai.service';
import { savePaper } from '../services/paper.service';
import { getPdfQueue } from '../queues/pdf.queue';
import { emitToAssignment } from '../sockets/socket.server';
import { classifyError } from '../services/quality-gate';
import type { GenerationJobData } from '../types/queue.types';
import type { GenerationMeta } from '../types/generation.types';
import type { GenerationStage } from '../types/socket.types';
import { buildCanonicalPaperMetadata } from '../services/canonical-metadata.service';
import { logger } from '../utils/logger';
import { withTimeout, createCancellablePromise } from '../utils/timeout';
import { abortManager } from '../services/ai/abort-manager';
import { GenerationLock } from '../services/ai/generation-lock';

const GENERATION_TIMEOUT_MS = 120_000;

const STAGE_ORDER: Record<GenerationStage, number> = {
  queued: 0,
  extracting_content: 10,
  topic_preprocessing: 20,
  generation_planning: 30,
  batch_generating: 40,
  provider_retry: 45,
  validation_retry: 50,
  recovering_batches: 55,
  validating: 60,
  answer_key_generating: 75,
  persisting: 85,
  pdf_composing: 90,
  'pdf-generating': 92,
  completed: 100,
  failed: 100,
};

function stripControlChars(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    const isControl = code < 32 && !isAllowedWhitespace;
    if (!isControl) out += input[i];
  }
  return out;
}

function sanitizeText(text: string): string {
  const before = text.length;
  let result = stripControlChars(text).slice(0, 8000);

  const imagePatterns: [RegExp, string][] = [
    [/\b(?:data:)?image\/[a-z0-9+.]+;base64[^\s"'()]+\b/gi, ''],
    [/\b(?:https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?))\b/gi, ''],
    [/\S*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, ''],
    [/(?:[\w\-./\\()]+\/)?[\w\-.() ]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, ''],
    [/\bimage\s*\.\s*(?:png|jpg|jpeg|gif|webp)\b/gi, ''],
    [/\(\s*(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\s*\)/gi, ''],
    [/[""'][^"']*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)[""']/gi, ''],
    [/\b(?:fig(?:ure)?|img|image|picture|photo|screenshot)\s*[:#]\s*\S+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/gi, ''],
  ];

  for (const [pattern, replacement] of imagePatterns) {
    const beforeReplace = result.length;
    result = result.replace(pattern, replacement);
    if (result.length !== beforeReplace) {
      logger.debug(`sanitizeText: matched ${pattern}`);
    }
  }

  const after = result.length;
  if (before !== after) logger.debug(`sanitizeText: ${before}→${after} chars (${before - after} removed)`);
  return result;
}

import { getStorageAdapter } from '../services/storage';

async function extractUploadedContent(files: Array<{ path: string; mimeType: string; storageKey?: string }>): Promise<{ content: string; wasSanitized: boolean }> {
  logger.debug(`[TRACE] extractUploadedContent: ${files.length} files`);
  const texts: string[] = [];
  let wasSanitized = false;
  const storage = getStorageAdapter();

  for (const file of files) {
    try {
      const t0 = Date.now();
      let buffer: Buffer | null = null;

      // 1. Try fetching from R2 if storageKey or path is an R2 key
      const possibleKey = file.storageKey || (file.path && !file.path.includes(':\\') && !file.path.startsWith('/') ? file.path : null);
      if (possibleKey) {
        try {
          buffer = await storage.get(possibleKey);
        } catch {
          buffer = null;
        }
      }

      // 2. Fallback to local filesystem if not found in R2
      if (!buffer && file.path) {
        try {
          buffer = await fs.readFile(file.path);
        } catch {
          // If local path fails, try storage with the basename
          buffer = await storage.get(file.path);
        }
      }

      if (!buffer) {
        logger.warn(`[TRACE] Could not retrieve file content from R2 or local disk: ${file.path}`);
        continue;
      }

      if (file.mimeType === 'application/pdf' || file.path.endsWith('.pdf')) {
        logger.debug(`[TRACE] Reading PDF buffer: ${buffer.length} bytes, parsing...`);
        const parsed = await pdfParse(buffer);
        logger.debug(`[TRACE] PDF parsed: ${parsed.text?.length ?? 0} chars in ${Date.now() - t0}ms`);
        if (parsed.text && parsed.text.trim().length > 0) {
          const raw = parsed.text;
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        } else {
          logger.warn(`[TRACE] PDF extracted no text: ${file.path}`);
        }
      } else {
        logger.debug(`[TRACE] Reading text content from buffer`);
        const raw = buffer.toString('utf-8');
        if (raw && raw.trim().length > 0) {
          const clean = sanitizeText(raw);
          if (clean !== raw) wasSanitized = true;
          texts.push(clean);
        }
      }
    } catch (e) {
      logger.warn(e, `[TRACE] Failed to read uploaded file: ${file.path}`);
    }
  }
  const combined = texts.join('\n\n').trim();
  logger.debug(`[TRACE] extractUploadedContent result: ${combined.length} chars, wasSanitized=${wasSanitized}`);
  return { content: combined || '', wasSanitized };
}

let aiWorker: Worker<GenerationJobData> | null = null;
let activeJobCount = 0;
let stalledJobCount = 0;
const stalledCounts = new Map<string, number>();

export function getActiveAiJobCount(): number {
  return activeJobCount;
}

export function getStalledAiJobCount(): number {
  return stalledJobCount;
}

export function getAiWorker(): Worker<GenerationJobData> | null {
  return aiWorker;
}

export function createAiGenerationWorker() {
  if (aiWorker) return aiWorker;

  aiWorker = new Worker<GenerationJobData>(
    'generation',
    async (job) => {
      activeJobCount++;
      const { assignmentId, jobRecordId, userId, organizationId } = job.data;
      const jobStartTime = Date.now();
      const workerId = `worker-${process.pid}-${job.id}`;
      const lock = new GenerationLock();

      logger.info(
        `[WORKER:START] Job ${job.id} assignment=${assignmentId} attempt=${job.attemptsMade + 1} ` +
        `activeJobs=${activeJobCount} workerId=${workerId}`
      );

      let assignment: any = null;
      let generationSeq = 0;
      let progressVersion = 0;
      let lastStageIndex = 0;
      let lastProgress = 0;
      let lockAcquired = false;

      try {
        // ── STEP 0: Validate job record and acquire lock ──
        logger.debug(`[STEP 0] Fetching GenerationJob: ${jobRecordId}`);
        const t0 = Date.now();
        const jobRecord = await prisma.generationJob.findUnique({ where: { id: jobRecordId } });
        generationSeq = Number(jobRecord?.generationSeq ?? 0);
        progressVersion = Number(jobRecord?.progressVersion ?? 0);
        lastStageIndex = Number(jobRecord?.stageIndex ?? 0);
        lastProgress = Number(jobRecord?.progress ?? 0);
        logger.debug(
          `[STEP 0] GenerationJob fetched in ${Date.now() - t0}ms | status=${jobRecord?.status} ` +
          `assignmentId=${assignmentId}`
        );
        if (!jobRecord || jobRecord.status === 'FAILED') {
          logger.error(`[STEP 0] Job record not found or already failed`);
          throw new Error('Generation job timed out in queue');
        }

        // Hard guard: only the Assignment's activeGenerationJobId is allowed to mutate state.
        const ownerCheck = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { activeGenerationJobId: true, generationSeq: true, status: true },
        });
        const activeJobId = ownerCheck?.activeGenerationJobId ?? '';
        const activeSeq = Number(ownerCheck?.generationSeq ?? 0);
        const jobSeq = generationSeq;
        if (!ownerCheck || activeJobId !== String(jobRecordId) || activeSeq !== jobSeq) {
          logger.warn(
            `[STALE JOB] Ignoring jobRecord=${jobRecordId} (seq=${jobSeq}) for assignment=${assignmentId}. ` +
            `Active jobRecord=${activeJobId || 'none'} (seq=${activeSeq}), status=${ownerCheck?.status}`
          );
          return;
        }

        // ── Acquire distributed generation lock ──
        logger.debug(`[STEP 0] Acquiring generation lock for assignment=${assignmentId}`);
        lockAcquired = await lock.acquire(assignmentId, jobRecordId, generationSeq);
        if (!lockAcquired) {
          logger.warn(`[STEP 0] Could not acquire lock for assignment=${assignmentId}. Another worker owns this assignment.`);
          return;
        }

        // Verify we still own the job after acquiring lock
        const recheck = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { activeGenerationJobId: true, generationSeq: true },
        });
        if (!recheck || String(recheck.activeGenerationJobId ?? '') !== String(jobRecordId)) {
          logger.warn(`[LOCK] Lost ownership race for assignment=${assignmentId} — returning`);
          return;
        }

        // Register abort controller
        abortManager.register(assignmentId, jobRecordId, generationSeq, job.attemptsMade + 1);
        const abortSignal = abortManager.getSignal(assignmentId, jobRecordId)!;

        const emit = async (stage: GenerationStage, progress: number, message?: string) => {
          if (abortSignal.aborted) return;
          const prevStageIndex = lastStageIndex;
          const prevProgress = lastProgress;
          const nextStageIndex = STAGE_ORDER[stage] ?? 0;
          const guardedStageIndex = Math.max(prevStageIndex, nextStageIndex);
          const guardedProgress = Math.max(prevProgress, Math.round(progress));
          lastStageIndex = guardedStageIndex;
          lastProgress = guardedProgress;
          progressVersion += 1;

          const e0 = Date.now();
          emitToAssignment(assignmentId, 'generation:progress', {
            assignmentId,
            progress: guardedProgress,
            stage,
            message,
            jobRecordId,
            generationSeq,
            version: progressVersion,
            ts: Date.now(),
          });
          try {
            const updateData: any = {
              progressVersion: { increment: 1 },
              progress: guardedProgress,
              stageIndex: guardedStageIndex,
            };
            if (nextStageIndex >= prevStageIndex) {
              updateData.status = stage;
            }
            await prisma.generationJob.update({
              where: { id: jobRecordId, generationSeq },
              data: updateData,
            });
            logger.debug(`[EMIT] ${stage} ${progress}% "${message}" in ${Date.now() - e0}ms`);
          } catch (emitErr) {
            logger.warn(`[EMIT] DB update failed for ${stage}: ${emitErr}`);
          }
        };

        // ── STEP 1: Emit initial progress ──
        logger.debug(`[STEP 1] Emitting initial progress (queued, 0%)`);
        await emit('queued', 0, 'Job started...');

        logger.debug(`[STEP 2] Emitting processing (5%)`);
        await emit('extracting_content', 5, 'Queue initialized...');

        // ── STEP 3: Fetch assignment ──
        logger.debug(`[STEP 3] Fetching Assignment: ${assignmentId}`);
        const t3 = Date.now();
        assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        logger.debug(
          `[STEP 3] Assignment fetched in ${Date.now() - t3}ms | title="${assignment?.title}" status=${assignment?.status}`
        );
        if (!assignment) {
          logger.error(`[STEP 3] Assignment ${assignmentId} not found`);
          throw new Error(`Assignment ${assignmentId} not found`);
        }
        logger.debug(`[STEP 3] Assignment has ${(assignment.uploadedFiles as any[])?.length ?? 0} uploaded files, totalMarks=${assignment.totalMarks}`);

        // ── STEP 4: Update status to generating ──
        logger.debug(`[STEP 4] Setting assignment status to 'generating'`);
        const t4 = Date.now();
        await prisma.assignment.updateMany({
          where: { id: assignmentId, activeGenerationJobId: jobRecordId },
          data: { status: 'GENERATING' },
        });
        await job.updateProgress(5);
        logger.debug(`[STEP 4] Status updated in ${Date.now() - t4}ms`);

        // ── STEP 5: Extract uploaded content ──
        logger.debug(`[STEP 5] Extracting uploaded content from ${(assignment.uploadedFiles as any[])?.length ?? 0} files`);
        const t5 = Date.now();
        const { content: uploadedContent, wasSanitized } = await extractUploadedContent(
          (assignment.uploadedFiles as any[] ?? []).map((f: { path: string; mimeType: string }) => ({ path: f.path, mimeType: f.mimeType }))
        );
        await job.updateProgress(15);
        logger.debug(`[STEP 5] Content extracted in ${Date.now() - t5}ms | ${uploadedContent.length} chars`);

        const sanitizeMsg = wasSanitized ? ' (image references removed from upload)' : '';
        await emit('topic_preprocessing', 15, `Syllabus extraction complete${sanitizeMsg}`);

        // ── STEP 6: Parse typeBreakdown ──
        let typeBreakdown: any[] | undefined;
        if (assignment.typeBreakdown) {
          try {
            typeBreakdown = JSON.parse(assignment.typeBreakdown);
            logger.debug(`[STEP 6] typeBreakdown parsed: ${typeBreakdown?.length} items`);
          } catch (parseErr) {
            logger.warn(`[STEP 6] typeBreakdown JSON parse failed: ${parseErr}`);
          }
        } else {
          logger.debug(`[STEP 6] No typeBreakdown`);
        }

        await emit('generation_planning', 30, 'Building generation plan...');

        // ── STEP 7: AI generation with timeout and abort support ──
        logger.info(
          `[STEP 7] Calling generatePaper() at ${Date.now() - jobStartTime}ms elapsed ` +
          `assignment=${assignmentId}`
        );
        const t7 = Date.now();
        let generationResult: any;
        try {
          generationResult = await withTimeout(
            generatePaper(
              assignment as any,
              uploadedContent || undefined,
              typeBreakdown,
              job,
              async (stage, progress, stageMessage) => {
                await emit(stage, progress, stageMessage);
              },
              abortSignal
            ),
            GENERATION_TIMEOUT_MS,
            'Generation',
            abortSignal
          );
          await job.updateProgress(80);
          logger.info(
            `[STEP 7] generatePaper() completed in ${Date.now() - t7}ms | ` +
            `title="${generationResult?.paper?.title}" sections=${generationResult?.paper?.sections?.length} status=${generationResult?.status}`
          );
        } catch (genErr) {
          logger.error(
            `[STEP 7 FAILED] generatePaper() threw after ${Date.now() - t7}ms: ` +
            `${genErr instanceof Error ? genErr.message : String(genErr)} ` +
            `assignmentId=${assignmentId} jobRecord=${jobRecordId}`
          );
          abortManager.abort(assignmentId, jobRecordId, 'Generation failed');
          throw genErr;
        }

        if (abortSignal.aborted) {
          logger.warn(`[STEP 7] Aborted after generation — abortSignal triggered assignment=${assignmentId}`);
          throw new Error('Generation cancelled after completion check');
        }

        let paper: any = generationResult.paper;
        const generationOutcome = generationResult.status;

        // ── STEP 8: Generate answers ──
        logger.info(
          `[STEP 8] Generating answers for ${paper.sections.reduce((s: number, sec: any) => s + sec.questions.length, 0)} questions`
        );
        const t7b = Date.now();
        try {
          await emit('answer_key_generating', 85, 'Generating answer key...');
          paper = await createCancellablePromise(
            (sig) => generateAnswersForPaper(paper, sig),
            abortSignal,
            'Answer generation'
          );
          await job.updateProgress(88);
          logger.info(`[STEP 8] Answers generated in ${Date.now() - t7b}ms`);
        } catch (answerErr) {
          logger.error(
            `[STEP 8] Answer generation failed: ${answerErr instanceof Error ? answerErr.message : String(answerErr)}`
          );
          throw answerErr;
        }

        if (abortSignal.aborted) {
          throw new Error('Generation cancelled after answer generation');
        }

        // ── STEP 9: Save paper ──
        logger.debug(`[STEP 9] Saving GeneratedPaper...`);
        const t9 = Date.now();
        let savedPaper: any;
        try {
          const owner = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            select: { activeGenerationJobId: true, generationSeq: true },
          });
          if (!owner || String(owner.activeGenerationJobId ?? '') !== String(jobRecordId)) {
            logger.warn(
              `[STALE JOB] Skipping savePaper for non-owner jobRecord=${jobRecordId} assignment=${assignmentId}`
            );
            return;
          }
          const provisionalMetadata = buildCanonicalPaperMetadata(assignment as any, paper as any);
          savedPaper = await savePaper(assignmentId, paper, assignment.duration, provisionalMetadata);
          await job.updateProgress(92);
          logger.info(`[STEP 9] GeneratedPaper saved in ${Date.now() - t9}ms | id=${savedPaper.id}`);
        } catch (saveErr) {
          logger.error(
            `[STEP 9 FAILED] savePaper() threw after ${Date.now() - t9}ms: ` +
            `${saveErr instanceof Error ? saveErr.message : String(saveErr)}`
          );
          throw saveErr;
        }

        // ── STEP 10: Emit persisting metadata ──
        logger.debug(`[STEP 10] Emitting persisting (92%)`);
        await emit('persisting', 92, 'Persisting metadata...');

        // ── STEP 11: Enqueue PDF generation ──
        logger.debug(`[STEP 11] Enqueuing PDF generation job`);
        const t11 = Date.now();
        try {
          await emit('pdf_composing', 96, 'Composing professional PDF...');
          const pdfQueue = getPdfQueue();
          await pdfQueue.add('generate-pdf', {
            assignmentId,
            paperId: savedPaper.id,
            jobRecordId,
          });
          logger.debug(`[STEP 11] PDF job enqueued in ${Date.now() - t11}ms`);
        } catch (pdfErr) {
          logger.warn(`[STEP 11] PDF queue add failed (non-fatal): ${pdfErr}`);
        }

        // ── STEP 12: Check for partial vs complete generation ──
        const questionConfig = assignment.questionConfig as any;
        const requestedQty = questionConfig?.count ?? 0;
        const generatedQty = paper.sections.reduce((s: number, sec: any) => s + sec.questions.length, 0);
        const generatedMarks = paper.sections.reduce((s: number, sec: any) =>
          s + sec.questions.reduce((ms: number, q: any) => ms + (q.marks || 0), 0), 0);
        const isPartial = generationOutcome === 'partial_success';
        const isFailed = generationOutcome === 'failed';
        const hasUsablePartial = isFailed && generatedQty > 0;
        const shouldFinalizeAsPartial = isPartial || hasUsablePartial;

        logger.debug(
          `[STEP 12] Generated ${generatedQty}/${requestedQty} questions (${generatedMarks}/${assignment.totalMarks} marks)`
        );
        const t12 = Date.now();

        if (shouldFinalizeAsPartial) {
          const genMeta: GenerationMeta = {
            status: 'PARTIALLY_GENERATED' as any,
            generatedQuestionCount: generatedQty,
            requestedQuestionCount: requestedQty,
            generatedMarks,
            requestedMarks: assignment.totalMarks,
            completedBatches: generationResult.completedBatches ?? 0,
            failedBatches: generationResult.failedBatches ?? 0,
            providerName: null,
            failureCategory: 'under_generation',
            failureReason: `Generated ${generatedQty}/${requestedQty} questions. The AI provider returned fewer questions than requested.`,
            diagnostics: null,
            partialPaper: null,
            completedAt: new Date(),
          };
          const current = await prisma.assignment.findUnique({ where: { id: assignmentId } });
          if (current && current.activeGenerationJobId === jobRecordId && current.status !== 'COMPLETED') {
            await prisma.assignment.update({
              where: { id: assignmentId },
              data: { status: 'PARTIALLY_GENERATED', generationMeta: genMeta as any },
            });
          }
          logger.info(`[STEP 12] Assignment marked as partially_generated (${generatedQty}/${requestedQty})`);
        } else if (!isFailed) {
          await prisma.assignment.updateMany({
            where: { id: assignmentId, activeGenerationJobId: jobRecordId },
            data: { status: 'COMPLETED', finalizedAt: new Date() },
          });
          logger.debug(`[STEP 12] Assignment status updated to 'completed' in ${Date.now() - t12}ms`);
        } else {
          const genMeta: GenerationMeta = {
            status: 'FAILED' as any,
            generatedQuestionCount: generatedQty,
            requestedQuestionCount: requestedQty,
            generatedMarks,
            requestedMarks: assignment.totalMarks,
            completedBatches: generationResult.completedBatches ?? 0,
            failedBatches: generationResult.failedBatches ?? 0,
            providerName: null,
            failureCategory: 'partial_generation',
            failureReason: `Generation completed with only ${generatedQty}/${requestedQty} valid questions`,
            diagnostics: generationResult.quality?.diagnostics?.slice(0, 20) ?? null,
            partialPaper: paper.sections,
            completedAt: new Date(),
          };
          const current = await prisma.assignment.findUnique({ where: { id: assignmentId } });
          if (current && current.activeGenerationJobId === jobRecordId && current.status !== 'COMPLETED') {
            if (generationSeq === 1) {
              await prisma.assignment.delete({ where: { id: assignmentId } }).catch((err) => {
                logger.warn(`[STEP 12] Failed to delete failed assignment ${assignmentId}: ${err instanceof Error ? err.message : String(err)}`);
              });
            } else {
              await prisma.assignment.update({
                where: { id: assignmentId },
                data: { status: 'FAILED', generationMeta: genMeta as any },
              });
            }
          }
          logger.warn(`[STEP 12] Assignment marked failed with partial paper (${generatedQty}/${requestedQty})`);
        }
        await job.updateProgress(99);

        // ── STEP 13: Update GenerationJob to completed ──
        logger.debug(`[STEP 13] Updating GenerationJob to completed`);
        const t13 = Date.now();
        progressVersion += 1;
        lastStageIndex = Math.max(lastStageIndex, STAGE_ORDER.completed);
        lastProgress = Math.max(lastProgress, 100);
        const finalStatus = shouldFinalizeAsPartial ? 'completed' : (isFailed ? 'failed' : 'completed');
        await prisma.generationJob.update({
          where: { id: jobRecordId, generationSeq },
          data: {
            status: finalStatus,
            completedAt: new Date(),
            progressVersion: { increment: 1 },
            progress: 100,
            stageIndex: finalStatus === 'failed' ? STAGE_ORDER.failed : STAGE_ORDER.completed,
          },
        });
        logger.debug(`[STEP 13] GenerationJob updated in ${Date.now() - t13}ms`);

        if (finalStatus === 'failed') {
          logger.error({
            action: 'Generation Failed',
            userId: userId || 'anon',
            organizationId: organizationId || 'no-organization',
            requestId: jobRecordId,
            error: 'Generation failed or did not meet minimum quality criteria',
            timestamp: new Date().toISOString()
          }, 'Generation Failed');
        } else {
          logger.info({
            action: 'Generation Completed',
            userId: userId || 'anon',
            organizationId: organizationId || 'no-organization',
            requestId: jobRecordId,
            timestamp: new Date().toISOString()
          }, 'Generation Completed');
        }

        // ── STEP 14: Emit terminal WebSocket event ──
        const t14 = Date.now();
        if (isFailed && !shouldFinalizeAsPartial) {
          emitToAssignment(assignmentId, 'generation:failed', {
            assignmentId,
            error: `Generation finished with partial content (${generatedQty}/${requestedQty})`,
            retryable: false,
            jobRecordId,
            generationSeq,
            version: progressVersion,
            ts: Date.now(),
          });
        } else {
          emitToAssignment(assignmentId, 'generation:completed', {
            assignmentId,
            paperId: savedPaper.id,
            jobRecordId,
            generationSeq,
            partial: shouldFinalizeAsPartial,
            status: shouldFinalizeAsPartial ? 'partial_success' : 'complete',
            generatedQuestionCount: generatedQty,
            requestedQuestionCount: requestedQty,
            generatedMarks,
            requestedMarks: assignment.totalMarks,
            version: progressVersion,
            ts: Date.now(),
          } as any);
        }
        logger.debug(`[STEP 14] WebSocket emit done in ${Date.now() - t14}ms`);

        const totalTime = Date.now() - jobStartTime;
        logger.info(
          `[WORKER:COMPLETE] Job ${job.id} finished in ${totalTime}ms | ` +
          `assignment=${assignmentId} | activeJobs=${activeJobCount} | workerId=${workerId}`
        );
      } catch (error) {
        const elapsed = Date.now() - jobStartTime;
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 2) - 1;

        abortManager.abort(assignmentId, jobRecordId, `Worker failure: ${message}`);

        logger.error({
          action: 'Generation Failed',
          userId: userId || 'anon',
          organizationId: organizationId || 'no-organization',
          requestId: jobRecordId,
          error: message,
          timestamp: new Date().toISOString()
        }, 'Generation Failed');

        logger.error(
          `[WORKER FAIL] Job ${job.id} failed at ${elapsed}ms (attempt ${job.attemptsMade + 1}, final=${isFinalAttempt}): ${message} ` +
          `assignmentId=${assignmentId} workerId=${workerId}`
        );
        if (error instanceof Error && error.stack) {
          logger.error(`[WORKER FAIL STACK] ${error.stack.split('\n').slice(0, 8).join('\n')}`);
        }

        const owner = await prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { activeGenerationJobId: true, status: true },
        }).catch(() => null);
        const isOwner = !!owner && String(owner.activeGenerationJobId ?? '') === String(jobRecordId);
        const isFinalized = owner?.status === 'COMPLETED';

        if (!isOwner || isFinalized) {
          logger.warn(
            `[STALE FAIL] Ignoring failure update for assignment=${assignmentId} jobRecord=${jobRecordId} ` +
            `(isOwner=${isOwner}, currentStatus=${owner?.status})`
          );
          throw error;
        }

        if (isFinalAttempt) {
          const { category, userMessage } = classifyError(error instanceof Error ? error : new Error(message));
          logger.debug(`[WORKER FAIL] Final attempt — checking for partial paper`);
          const f0 = Date.now();
          const existingPaper = await prisma.generatedPaper.findFirst({
            where: { assignmentId },
          }).catch(() => null);
          const hasPartial = !!existingPaper;

          const a = assignment as any;
          const genMeta: GenerationMeta = {
            status: hasPartial ? 'partially_generated' : 'failed',
            generatedQuestionCount: 0,
            requestedQuestionCount: a?.questionConfig?.count ?? 0,
            generatedMarks: 0,
            requestedMarks: a?.totalMarks ?? 0,
            completedBatches: 0,
            failedBatches: 1,
            providerName: null,
            failureCategory: category,
            failureReason: userMessage,
            diagnostics: null,
            partialPaper: existingPaper ? (existingPaper.sections as any) : null,
            completedAt: new Date(),
          };
          if (hasPartial) {
            const paperSections = (existingPaper.sections as any[]) || [];
            const pqty = paperSections.reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0);
            genMeta.generatedQuestionCount = pqty;
            genMeta.generatedMarks = paperSections.reduce((s: number, sec: any) =>
              s + (sec.questions || []).reduce((ms: number, q: any) => ms + (q.marks || 0), 0), 0);
          }

          const current = await prisma.assignment.findUnique({ where: { id: assignmentId } });
          if (current && current.activeGenerationJobId === jobRecordId && current.status !== 'COMPLETED') {
            if (!hasPartial && generationSeq === 1) {
              await Promise.allSettled([
                prisma.assignment.delete({ where: { id: assignmentId } }).catch((err) => {
                  logger.warn(`[WORKER FAIL] Failed to delete failed assignment ${assignmentId}: ${err instanceof Error ? err.message : String(err)}`);
                }),
                prisma.generationJob.update({
                  where: { id: jobRecordId, generationSeq },
                  data: {
                    status: 'FAILED',
                    error: message,
                    completedAt: new Date(),
                    progressVersion: { increment: 1 },
                    progress: lastProgress,
                    stageIndex: STAGE_ORDER.failed,
                  },
                }).catch((err) => {
                  logger.warn(`[WORKER FAIL] Failed to update GenerationJob ${jobRecordId} on final attempt: ${err instanceof Error ? err.message : String(err)}`);
                }),
              ]);
            } else {
              await Promise.allSettled([
                prisma.assignment.update({
                  where: { id: assignmentId },
                  data: {
                    status: hasPartial ? 'PARTIALLY_GENERATED' : 'FAILED',
                    generationMeta: genMeta as any,
                  },
                }),
                prisma.generationJob.update({
                  where: { id: jobRecordId, generationSeq },
                  data: {
                    status: 'FAILED',
                    error: message,
                    completedAt: new Date(),
                    progressVersion: { increment: 1 },
                    progress: lastProgress,
                    stageIndex: STAGE_ORDER.failed,
                  },
                }),
              ]);
            }
          }
          logger.debug(`[WORKER FAIL] DB updates done in ${Date.now() - f0}ms | finalStatus=${hasPartial ? 'partially_generated' : 'failed'}`);
          progressVersion += 1;
          if (hasPartial) {
            emitToAssignment(assignmentId, 'generation:completed', {
              assignmentId,
              paperId: '',
              partial: true,
              status: 'partial_success',
              jobRecordId,
              generationSeq,
              version: progressVersion,
              ts: Date.now(),
            });
          } else {
            emitToAssignment(assignmentId, 'generation:failed', {
              assignmentId,
              error: userMessage,
              retryable: false,
              jobRecordId,
              generationSeq,
              version: progressVersion,
              ts: Date.now(),
            });
          }
          logger.debug(`[WORKER FAIL] WebSocket ${hasPartial ? 'generation:completed (partial)' : 'generation:failed'} emitted`);
        } else {
          logger.debug(`[WORKER FAIL] Non-final attempt — requeueing job`);
          await Promise.allSettled([
            prisma.generationJob.update({
              where: { id: jobRecordId, generationSeq },
              data: { error: message, progressVersion: { increment: 1 } },
            }).catch((err) => {
              logger.warn(`[WORKER FAIL] Failed to update GenerationJob ${jobRecordId} on non-final attempt: ${err instanceof Error ? err.message : String(err)}`);
            }),
          ]);
          progressVersion += 1;
        }

        throw error;
      } finally {
        abortManager.release(assignmentId, jobRecordId);

        if (lockAcquired) {
          await lock.release(assignmentId).catch((err) => {
            logger.warn(`[LOCK] Release error assignment=${assignmentId}: ${err}`);
          });
        }

        activeJobCount = Math.max(0, activeJobCount - 1);
      }
    },
    {
      connection: getBullRedisClient(),
      skipVersionCheck: true,
      concurrency: env.AI_WORKER_CONCURRENCY,
      limiter: { max: 30, duration: 60000 },
      lockDuration: 180_000,
      stalledInterval: 120_000,
      drainDelay: 5000,
    }
  );

  // ── Worker event handlers for diagnostics ──
  aiWorker.on('active', (job) => {
    logger.debug(`[WORKER:EVENT] active | job=${job.id}`);
  });

  aiWorker.on('completed', (job) => {
    logger.info(`[WORKER:EVENT] completed | job=${job.id}`);
  });

  aiWorker.on('failed', (job, err) => {
    logger.error(`[WORKER:EVENT] failed | job=${job?.id} | error=${err.message}`);
  });

  aiWorker.on('error', (err) => {
    logger.error(`[WORKER:EVENT] error | ${err.message}`);
  });

  aiWorker.on('stalled', async (jobId) => {
    stalledJobCount++;
    const key = String(jobId);
    const perJobCount = (stalledCounts.get(key) ?? 0) + 1;
    stalledCounts.set(key, perJobCount);
    logger.error(`[WORKER:STALL] Job ${jobId} stalled! stalledCount=${stalledJobCount} jobStallCount=${perJobCount}`);

    if (perJobCount < 2) return;

    try {
      const jobRecord = await prisma.generationJob.findFirst({
        where: {
          bullmqJobId: key,
          status: { in: ['queued', 'extracting_content', 'topic_preprocessing', 'generation_planning', 'batch_generating', 'validating', 'answer_key_generating', 'pdf_composing', 'persisting', 'pdf-generating'] },
        },
      });

      if (!jobRecord) return;

      const assignmentId = jobRecord.assignmentId;
      const jrId = jobRecord.id;

      abortManager.abort(assignmentId, jrId, `BullMQ stalled ${perJobCount} times`);

      await Promise.allSettled([
        prisma.assignment.updateMany({
          where: { id: assignmentId, activeGenerationJobId: jrId, NOT: { status: 'COMPLETED' } },
          data: { status: 'FAILED' },
        }).catch((err) => {
          logger.warn(`[WORKER:STALL] Failed to mark stalled assignment ${assignmentId} as failed: ${err instanceof Error ? err.message : String(err)}`);
        }),
        prisma.generationJob.update({
          where: { id: jobRecord.id, generationSeq: Number(jobRecord.generationSeq ?? 0) },
          data: {
            status: 'FAILED',
            error: `BullMQ stalled ${perJobCount} times (auto-failed)`,
            completedAt: new Date(),
            progressVersion: { increment: 1 },
            stageIndex: STAGE_ORDER.failed,
          },
        }).catch((err) => {
          logger.warn(`[WORKER:STALL] Failed to update GenerationJob ${jobRecord?.id} when auto-failing stalled job: ${err instanceof Error ? err.message : String(err)}`);
        }),
      ]);

      const nextVersion = Number(jobRecord.progressVersion ?? 0) + 1;
      emitToAssignment(assignmentId, 'generation:failed', {
        assignmentId,
        error: `Generation stalled ${perJobCount} times and was auto-failed`,
        retryable: true,
        jobRecordId: jrId,
        generationSeq: Number(jobRecord.generationSeq ?? 0),
        version: nextVersion,
        ts: Date.now(),
      });

      logger.error(`[WORKER:STALL:FAILED] Job ${jobId} auto-failed after repeated stalls`);
    } catch (stallErr) {
      logger.error(`[WORKER:STALL:ERROR] Failed to mark stalled job ${jobId} as failed: ${stallErr}`);
    }
  });

  aiWorker.on('closing', (msg) => {
    logger.info(`[WORKER:EVENT] closing | ${msg}`);
  });

  aiWorker.on('paused', () => {
    logger.warn('[WORKER:EVENT] paused — no jobs will be processed');
  });

  aiWorker.on('resumed', () => {
    logger.info('[WORKER:EVENT] resumed — job processing continuing');
  });

  logger.info('[WORKER] AI generation worker created with CANCELLATION, LOCK, and ABORT support');
  return aiWorker;
}
