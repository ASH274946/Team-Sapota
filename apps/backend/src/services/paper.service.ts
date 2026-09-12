import prisma from '../config/prisma';
import { validatePaperOrThrow, type ValidatedPaper } from '../validators/paper.validator';
import { logger } from '../utils/logger';
import type { CanonicalPaperMetadata } from '../types/canonical.types';
import { saveToQuestionBank } from './question-bank.service';
import { getStorageAdapter } from './storage';

export async function savePaper(
  assignmentId: string,
  paper: ValidatedPaper,
  duration?: number,
  canonicalMetadata?: CanonicalPaperMetadata
) {
  const t0 = Date.now();
  const validatedPaper = validatePaperOrThrow(paper);
  logger.debug(`[savePaper] START | assignmentId=${assignmentId} title="${paper.title}" sections=${paper.sections.length}`);

  const existingAssignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { organizationId: true },
  });
  if (!existingAssignment) throw new Error(`Assignment ${assignmentId} not found`);

  logger.debug(`[savePaper] Creating new GeneratedPaper...`);
  const saved = await prisma.generatedPaper.create({
    data: {
      assignmentId,
      organizationId: existingAssignment.organizationId,
      title: validatedPaper.title,
      totalMarks: validatedPaper.totalMarks,
      duration: duration ?? 45,
      sections: validatedPaper.sections as any,
      canonicalMetadata: canonicalMetadata as any ?? undefined,
      generatedAt: new Date(),
    },
  });

  // Save generated assignment snapshot to R2 assignments/ folder
  const storage = getStorageAdapter();
  const assignmentStorageKey = `assignments/assignment-${assignmentId}-${saved.id}.json`;
  const paperStorageKey = `question-papers/paper-${assignmentId}-${saved.id}.json`;

  try {
    const assignmentPayload = Buffer.from(JSON.stringify({
      assignmentId,
      paperId: saved.id,
      title: validatedPaper.title,
      totalMarks: validatedPaper.totalMarks,
      duration: duration ?? 45,
      sections: validatedPaper.sections,
      canonicalMetadata,
      savedAt: new Date().toISOString(),
    }, null, 2));

    await Promise.all([
      storage.save(assignmentStorageKey, assignmentPayload, 'application/json'),
      storage.save(paperStorageKey, assignmentPayload, 'application/json'),
    ]);
    logger.info(`[savePaper] Saved assignment & paper snapshots to R2: ${assignmentStorageKey}, ${paperStorageKey}`);
  } catch (err) {
    logger.warn(`[savePaper] Failed to write assignment snapshot to R2: ${err}`);
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'COMPLETED',
      generationMeta: canonicalMetadata
        ? { ...(canonicalMetadata as any), storageKey: assignmentStorageKey }
        : { storageKey: assignmentStorageKey },
      finalizedAt: new Date(),
    },
  });

  // Auto-save generated questions to the central Question Bank
  const subject = canonicalMetadata?.subject || 'General';
  const topic = canonicalMetadata?.className || 'General Topic';
  for (const section of validatedPaper.sections) {
    for (const q of section.questions) {
      try {
        const diffMap: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
          easy: 'EASY',
          medium: 'MEDIUM',
          hard: 'HARD',
        };
        await saveToQuestionBank({
          content: q.question,
          options: (q as any).options || undefined,
          answer: q.answer?.text || undefined,
          hint: (q as any).hint || undefined,
          subject,
          topic,
      organizationId: existingAssignment.organizationId,
          difficulty: diffMap[q.difficulty] || 'MEDIUM',
          bloomLevel: 'APPLY', // Default bloom level for generated output
          tags: [subject, q.type],
        });
      } catch (err) {
        logger.warn(`[savePaper] Failed to auto-save question to bank: ${err}`);
      }
    }
  }

  logger.info(`[savePaper] COMPLETE in ${Date.now() - t0}ms | id=${saved.id} sections=${(saved.sections as any[]).length}`);
  return saved;
}


export async function getPaper(assignmentId: string, paperId?: string) {
  if (paperId) {
    return prisma.generatedPaper.findUnique({ where: { id: paperId } });
  }
  return prisma.generatedPaper.findFirst({
    where: { assignmentId },
    orderBy: { generatedAt: 'desc' },
  });
}

export async function updatePaperPdf(
  paperId: string,
  pdfPath: string,
  pdfUrl: string
): Promise<void> {
  await prisma.generatedPaper.update({
    where: { id: paperId },
    data: { pdfPath, pdfUrl },
  });
}
