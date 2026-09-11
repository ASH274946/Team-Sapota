import type { Request, Response } from 'express';
import path from 'path';
import { getPaper } from '../services/paper.service';
import { sendSuccess, sendError } from '../utils/api-response';
import prisma from '../config/prisma';
import { buildCanonicalPaperMetadata, buildCanonicalGenerationState } from '../services/canonical-metadata.service';
import { getPdfStorage } from '../services/storage';
import { generateSingleQuestion } from '../services/question-generation.service';
import { getPdfQueue } from '../queues/pdf.queue';
import { logger } from '../utils/logger';
import {
  assertCanViewPaper,
  assertCanMutatePaper,
  handleAccessError,
} from '../security/assignment-access';
import { requireRequestOrgId } from '../security/request-context';

export async function getPaperHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  try {
    await assertCanViewPaper(req, assignmentId);
    const paperId = req.query.paperId as string | undefined;
    const [paper, assignment] = await Promise.all([
      getPaper(assignmentId, paperId),
      prisma.assignment.findUnique({ where: { id: assignmentId } }),
    ]);
    if (!paper) {
      sendError(res, 'Paper not found for this assignment', 404);
      return;
    }
    const canonicalMetadata =
      assignment ? buildCanonicalPaperMetadata(assignment as any, paper as any) : paper.canonicalMetadata;
    sendSuccess(res, { paper, canonicalMetadata });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function getPaperJobStatusHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  try {
    await assertCanViewPaper(req, assignmentId);
    const [assignment, job, paper] = await Promise.all([
      prisma.assignment.findUnique({ where: { id: assignmentId } }),
      prisma.generationJob.findFirst({
        where: { assignmentId },
        orderBy: [{ generationSeq: 'desc' }, { createdAt: 'desc' }],
      }),
      getPaper(assignmentId),
    ]);

    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    const state = buildCanonicalGenerationState({
      assignment: assignment as any,
      job: (job as any) ?? null,
      paper: (paper as any) ?? null,
    });

    res.json({
      success: true,
      data: {
        status: job?.status ?? 'queued',
        error: job?.error ?? null,
        jobRecordId: job?.id ?? null,
        generationSeq: job?.generationSeq ?? (assignment as any).generationSeq ?? 0,
        version: job?.progressVersion ?? 0,
        paperId: (paper as any)?.id ?? null,
        ts: job?.updatedAt ? new Date(job.updatedAt).getTime() : Date.now(),
        ...state,
      },
    });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    throw err;
  }
}

export async function downloadPdfHandler(req: Request, res: Response): Promise<void> {
  const { filename } = req.params;
  const safeName = path.basename(filename);
  const orgId = requireRequestOrgId(req);

  try {
    const paper = await prisma.generatedPaper.findFirst({
      where: {
        OR: [{ pdfUrl: { contains: safeName } }, { pdfPath: { contains: safeName } }],
        organizationId: orgId,
      },
    });
    if (!paper) {
      sendError(res, 'PDF file not found', 404);
      return;
    }

    await assertCanViewPaper(req, paper.assignmentId);

    const storage = getPdfStorage();
    const data = await storage.get(safeName);
    if (!data) {
      sendError(res, 'PDF file not found', 404);
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.send(data);
  } catch (err) {
    if (handleAccessError(res, err)) return;
    sendError(res, 'PDF file not found', 404);
  }
}

export async function downloadPdfByAssignmentIdHandler(req: Request, res: Response): Promise<void> {
  const { assignmentId } = req.params;
  try {
    const paper = await prisma.generatedPaper.findFirst({
      where: {
        OR: [{ assignmentId }, { id: assignmentId }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!paper) {
      sendError(res, 'Paper not found for this assignment', 404);
      return;
    }

    await assertCanViewPaper(req, paper.assignmentId);

    const storage = getPdfStorage();
    let data: Buffer | null = null;
    let filename = paper.pdfUrl ? path.basename(paper.pdfUrl) : `paper-${paper.assignmentId}.pdf`;

    if (paper.pdfUrl) {
      try {
        data = await storage.get(filename);
      } catch {
        data = null;
      }
    }

    if (!data) {
      // PDF file doesn't exist on disk or pdfUrl was null -> generate on-the-fly!
      logger.info(`[downloadPdfByAssignmentIdHandler] Generating PDF on demand for assignment ${paper.assignmentId}...`);
      try {
        const { generatePdf } = await import('../services/pdf.service');
        const genResult = await generatePdf(paper as any);
        filename = path.basename(genResult.pdfUrl);
        data = await storage.get(filename);

        await prisma.generatedPaper.update({
          where: { id: paper.id },
          data: { pdfUrl: genResult.pdfUrl, pdfPath: genResult.pdfPath },
        }).catch((e) => logger.warn(`Failed to update generatedPaper pdfUrl: ${e}`));
      } catch (genErr) {
        logger.error(`[downloadPdfByAssignmentIdHandler] On-demand PDF generation failed: ${genErr}`);
      }
    }

    if (!data) {
      sendError(res, 'PDF file could not be generated', 500);
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[downloadPdfByAssignmentIdHandler] error: ${err}`);
    sendError(res, 'Failed to download PDF', 500);
  }
}

export async function updatePaperHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { sections, title, totalMarks } = req.body;

  try {
    const paper = await prisma.generatedPaper.findUnique({ where: { id } });
    if (!paper) {
      sendError(res, 'Paper not found', 404);
      return;
    }

    await assertCanMutatePaper(req, paper.assignmentId);

    const updated = await prisma.generatedPaper.update({
      where: { id },
      data: {
        sections: sections || paper.sections,
        title: title || paper.title,
        totalMarks: totalMarks !== undefined ? Number(totalMarks) : paper.totalMarks,
      },
    });

    try {
      const pdfQueue = getPdfQueue();
      await pdfQueue.add('generate-pdf', {
        assignmentId: paper.assignmentId,
        paperId: paper.id,
        jobRecordId: `edit-${Date.now()}`,
      });
    } catch (err) {
      logger.warn(`[updatePaper] Failed to queue PDF update: ${err}`);
    }

    sendSuccess(res, { paper: updated }, 200, 'Paper updated successfully');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[updatePaper] Failed: ${err}`);
    sendError(res, 'Failed to update paper', 500);
  }
}

export async function regenerateQuestionHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { sectionIndex, questionIndex, topic, subject, difficulty, bloomLevel, context } = req.body;

  if (sectionIndex === undefined || questionIndex === undefined) {
    sendError(res, 'sectionIndex and questionIndex are required', 400);
    return;
  }

  try {
    const paper = await prisma.generatedPaper.findUnique({ where: { id } });
    if (!paper) {
      sendError(res, 'Paper not found', 404);
      return;
    }

    await assertCanMutatePaper(req, paper.assignmentId);

    const sections = JSON.parse(JSON.stringify(paper.sections)) as any[];
    const targetSection = sections[sectionIndex];
    if (!targetSection || !targetSection.questions[questionIndex]) {
      sendError(res, 'Question not found at index', 404);
      return;
    }

    const targetQuestion = targetSection.questions[questionIndex];

    const replacement = await generateSingleQuestion({
      topic: topic || targetSection.title || 'General',
      subject: subject || 'General',
      difficulty: difficulty || targetQuestion.difficulty || 'medium',
      bloomLevel: bloomLevel || 'APPLY',
      context: context || undefined,
    });

    targetSection.questions[questionIndex] = {
      id: targetQuestion.id,
      question: replacement.question_text,
      type: targetQuestion.type,
      difficulty: replacement.difficulty.toLowerCase() as any,
      marks: targetQuestion.marks,
      answer: {
        text: replacement.answer,
        explanation: 'AI generated replacement answer',
      },
      options: replacement.options ? replacement.options.map((o: any, idx: number) => {
        const keys = ['A', 'B', 'C', 'D'];
        return {
          key: keys[idx] || 'A',
          text: String(o).replace(/^[A-D]\.\s*/, ''),
        };
      }) : undefined,
    };

    const updated = await prisma.generatedPaper.update({
      where: { id },
      data: { sections },
    });

    try {
      const pdfQueue = getPdfQueue();
      await pdfQueue.add('generate-pdf', {
        assignmentId: paper.assignmentId,
        paperId: paper.id,
        jobRecordId: `regen-${Date.now()}`,
      });
    } catch (err) {
      logger.warn(`[regenerateQuestion] Failed to queue PDF updates: ${err}`);
    }

    sendSuccess(res, { paper: updated, newQuestion: targetSection.questions[questionIndex] }, 200, 'Question regenerated successfully');
  } catch (err) {
    if (handleAccessError(res, err)) return;
    logger.error(`[regenerateQuestion] Failed: ${err}`);
    sendError(res, 'Failed to regenerate question', 500);
  }
}
