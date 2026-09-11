import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';
import { logger } from '../utils/logger';
import { retrieveContext } from './rag.service';
import { invalidateCache } from '../api/common/cache';

import { extractTextFromFileBuffer } from './document-extractor.service';

export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const filename = path.basename(filePath);
    return await extractTextFromFileBuffer(buffer, filename, fileType);
  } catch (error) {
    logger.error({ error, filePath, fileType }, 'Failed to extract text from file');
    return '';
  }
}

export async function evaluateSubmission(submissionId: string): Promise<any> {
  const submission = await prisma.studentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  });

  if (!submission) {
    throw new Error('Submission not found');
  }

  // Get Assignment config
  const config = await prisma.assignmentGradingConfig.findUnique({
    where: { assignmentId: submission.assignmentId },
    include: { rubric: { include: { criteria: true } } },
  });

  if (!config) {
    throw new Error('Grading configuration not found for this assignment');
  }

  const studentAnswerText = await extractTextFromFile(submission.fileUrl, submission.fileType);

  const rubricPrompt = config.rubric
    ? `Use the following AI-Structured Rubric Criteria to evaluate the student's submission.
       EVALUATE EVERY CRITERION INDEPENDENTLY.
       For each criterion:
       - Check for Semantic matches (synonyms, equivalent logic, conceptual understanding). DO NOT use strict keyword matching.
       - Use intelligent partial marking if the core concept or logic exists.
       - Provide an explicit "explanation" detailing exactly why marks were awarded, why they were deducted, what concepts were missing, and the evidence found in the answer.

       Rubric Criteria:
` +
      config.rubric.criteria.map((c: any) => 
        `- ${c.name} (ID: ${c.id}) 
         Max Marks: ${c.maxMarks}
         Description: ${c.description}
         Expected Concepts: ${c.expectedConcepts ? JSON.stringify(c.expectedConcepts) : 'N/A'}
         Teacher Notes: ${c.teacherNotes ? c.teacherNotes : 'N/A'}`
      ).join('\n\n')
    : 'No rubric provided. Evaluate overall correctness.';


  let ragContext = '';
  if (submission.assignment.organizationId) {
    try {
      ragContext = await retrieveContext(studentAnswerText.substring(0, 1000), submission.assignment.organizationId, 3);
    } catch (e) {
      logger.warn(`Failed to retrieve RAG context: ${e}`);
    }
  }

  const prompt = [
    'Answer Key:',
    config.answerKeyText,
    '',
    'Rubric with Semantic Expectations & Policies:',
    rubricPrompt,
    '',
    'Student Submission:',
    studentAnswerText,
    '',
    'Task: Evaluate the submission. You MUST return a structured JSON object containing a total score, general feedback, and an array of criteria grades. Each criterion grade must contain the criterion ID, score, and a detailed EXPLAINABLE reason highlighting missing concepts and matched evidence.'
  ].join('\n');


  logger.info({ submissionId }, 'AI Assignment Evaluation started');

  try {
    const data = await AIOrchestrator.generate({
      intent: 'EvaluateAssignment',
      context: ragContext,
      taskInstructions: prompt,
      responseFormat: { type: 'json_object' }
    });

    const correctTotalMarks = config.rubric 
      ? config.rubric.criteria.reduce((sum, c) => sum + c.maxMarks, 0)
      : submission.assignment.totalMarks;

    // Save evaluation to database
    const evaluation = await prisma.submissionEvaluation.upsert({
      where: { submissionId },
      create: {
        submissionId,
        score: Number(data.score) || 0,
        totalMarks: correctTotalMarks,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
      update: {
        score: Number(data.score) || 0,
        totalMarks: correctTotalMarks,
        generalFeedback: data.generalFeedback || '',
        criteriaGrades: data.criteriaGrades || [],
      },
    });

    await prisma.studentSubmission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' },
    });

    // Invalidate cached student-performance analytics so fresh scores are reflected
    await invalidateCache(`analytics:student:${submission.studentId}`).catch(() => {});

    logger.info({ submissionId, score: evaluation.score }, 'AI Assignment Evaluation completed');
    return evaluation;
  } catch (error) {
    logger.error(error, `AI Assignment Evaluation failed for submissionId: ${submissionId}`);
    throw error;
  }
}

export interface OverridePayload {
  overrideScore: number;
  reason?: string;
  teacherFeedback?: string;
  criteriaGrades?: any[];
  teacherId?: string;
}

export async function overrideEvaluation(submissionId: string, payload: OverridePayload) {
  const evaluation = await prisma.submissionEvaluation.findUnique({
    where: { submissionId },
  });

  if (!evaluation) {
    throw new Error('Evaluation not found for this submission');
  }

  const previousScore = evaluation.score;
  const newScore = Number(payload.overrideScore);

  const updated = await prisma.submissionEvaluation.update({
    where: { submissionId },
    data: {
      score: newScore,
      isOverridden: true,
      overrideReason: payload.reason || 'Manual teacher grade override',
      teacherFeedback: payload.teacherFeedback || payload.reason || '',
      overriddenBy: payload.teacherId || 'teacher',
      overriddenAt: new Date(),
      criteriaGrades: (payload.criteriaGrades ?? evaluation.criteriaGrades ?? []) as Prisma.InputJsonValue,
      teacherOverride: {
        originalScore: previousScore,
        overrideScore: newScore,
        reason: payload.reason,
        teacherFeedback: payload.teacherFeedback,
        updatedAt: new Date().toISOString(),
        updatedBy: payload.teacherId,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.studentSubmission.update({
    where: { id: submissionId },
    data: { status: 'GRADED' },
  });

  const sub = await prisma.studentSubmission.findUnique({ where: { id: submissionId }, select: { studentId: true } });
  if (sub?.studentId) {
    await invalidateCache(`analytics:student:${sub.studentId}`).catch(() => {});
  }

  return { evaluation: updated, previousScore, newScore };
}

