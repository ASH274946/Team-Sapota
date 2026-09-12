import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { invalidateByPattern } from '../api/common/cache';


/**
 * Save a question to the central Question Bank
 */
export async function saveToQuestionBank(params: {
  content: string;
  options?: any;
  answer?: string;
  hint?: string;
  subject: string;
  topic: string;
  organizationId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  tags?: string[];
}) {
  try {
    const question = await prisma.questionBank.create({
      data: {
        content: params.content,
        options: params.options || null,
        organizationId: params.organizationId,
        answer: params.answer || null,
        hint: params.hint || null,
        subject: params.subject,
        topic: params.topic,
        difficulty: params.difficulty,
        bloomLevel: params.bloomLevel,
        tags: params.tags || [],
      },
    });

    // Seed version 1
    await prisma.questionVersion.create({
      data: {
        questionId: question.id,
        versionNumber: 1,
        content: question.content,
        options: question.options as any,
        answer: question.answer,
        updatedBy: 'system',
      },
    });

    // Invalidate cached org-scoped analytics (dashboard question-bank aggregates)
    await invalidateByPattern(`analytics:${params.organizationId}:*`).catch(() => {});

    return question;
  } catch (err) {
    logger.error(`[saveToQuestionBank] Failed: ${err}`);
    throw err;
  }
}

