import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId, getRequestOrgId } from '../../security/request-context';
import { generateMultipleQuestions } from '../../services/question-generation.service';
import { AdaptiveQuizService } from '../../services/adaptive-quiz.service';
import { QuizAnalyticsService } from '../../services/quiz-analytics.service';
import prisma from '../../config/prisma';
import {
  serializeQuizSession,
  serializeQuizQuestion,
  serializeQuizHistory,
} from './serializers';

import { getStorageAdapter } from '../../services/storage';

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  const { topic, subject, difficulty, bloomLevel, count } = req.body;
  const orgId = getRequestOrgId(req);
  const userId = getRequestUserId(req);

  const questions = await generateMultipleQuestions({
    topic,
    subject,
    difficulty,
    bloomLevel: bloomLevel ?? 'APPLY',
    count,
    organizationId: orgId,
  });

  // Persist generated quiz questions to Cloudflare R2 in quizzes/ folder
  const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const storageKey = `quizzes/${quizId}.json`;
  try {
    const storage = getStorageAdapter();
    const payload = Buffer.from(JSON.stringify({
      quizId,
      topic,
      subject,
      difficulty,
      bloomLevel: bloomLevel ?? 'APPLY',
      count: questions.length,
      questions,
      createdBy: userId,
      organizationId: orgId,
      generatedAt: new Date().toISOString(),
    }, null, 2));
    await storage.save(storageKey, payload, 'application/json');
  } catch (err) {
    // Non-blocking log
  }

  sendCreated(res, { questions, count: questions.length, storageKey });
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { page, limit } = parsePagination(req);
  const { status } = req.query as Record<string, string | undefined>;

  const where: any = { userId };
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    prisma.quizSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quizSession.count({ where }),
  ]);

  sendSuccess(res, {
    data: sessions.map(serializeQuizSession),
    pagination: buildPagination(page, limit, total),
  });
};

export const createSession = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { topic, subject, difficulty, organizationId, totalQuestions } = req.body;
  const orgId = organizationId ?? getRequestOrgId(req);

  const session = await (prisma as any).quizSession.create({
    data: {
      userId,
      topic,
      subject,
      difficulty,
      organizationId: orgId ?? null,
      totalQuestions: totalQuestions ?? 10,
      masteryLevel: 0,
      status: 'IN_PROGRESS',
    },
  });

  sendCreated(res, serializeQuizSession(session));
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);

  const session = await prisma.quizSession.findFirst({
    where: { id, userId },
    include: { questions: { orderBy: { questionIndex: 'asc' } } },
  });

  if (!session) {
    throw ApiError.notFound('Quiz session not found');
  }

  sendSuccess(res, { data: serializeQuizSession(session) });
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);

  const existing = await prisma.quizSession.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound('Quiz session not found');

  const updated = await (prisma as any).quizSession.update({
    where: { id },
    data: {
      ...(req.body.score !== undefined ? { score: req.body.score } : {}),
      ...(req.body.timeSpent !== undefined ? { timeSpent: req.body.timeSpent } : {}),
      ...(req.body.attempts !== undefined ? { attempts: req.body.attempts } : {}),
      ...(req.body.status ? { status: req.body.status } : {}),
    },
  });

  sendSuccess(res, { data: serializeQuizSession(updated) });
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);

  const existing = await prisma.quizSession.findFirst({ where: { id, userId } });
  if (!existing) throw ApiError.notFound('Quiz session not found');

  await prisma.quizSessionQuestion.deleteMany({ where: { sessionId: id } });
  await prisma.quizSession.delete({ where: { id } });

  sendNoContent(res);
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { page, limit, sort, order } = parsePagination(req);

  const where = { userId, status: 'COMPLETED' as const } as any;

  const [sessions, total] = await Promise.all([
    prisma.quizSession.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quizSession.count({ where }),
  ]);

  sendSuccess(res, {
    data: sessions.map(serializeQuizHistory),
    pagination: buildPagination(page, limit, total),
  });
};

export const clearHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);

  const sessions = await (prisma as any).quizSession.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { id: true },
  });

  const sessionIds = sessions.map((s: any) => s.id);
  if (sessionIds.length > 0) {
    await prisma.quizSessionQuestion.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await prisma.quizSession.deleteMany({ where: { id: { in: sessionIds } } });
  }

  sendNoContent(res);
};

export const shareQuiz = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { sessionId } = req.body;

  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: { questions: true },
  });
  if (!session) throw ApiError.notFound('Quiz session not found');

  const shareToken = `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  sendCreated(res, {
    shareToken,
    shareUrl: `/api/v1/quizzes/shared/${shareToken}`,
  });
};

export const getSharedQuiz = async (_req: Request, _res: Response): Promise<void> => {
  throw ApiError.notFound('Shared quiz not found or expired');
};

export const startAdaptiveQuiz = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { topic, subject, initialDifficulty, organizationId } = req.body;
  const orgId = organizationId ?? getRequestOrgId(req);

  const session = await (prisma as any).quizSession.create({
    data: {
      userId,
      topic,
      subject,
      difficulty: initialDifficulty ?? 'MEDIUM',
      organizationId: orgId ?? null,
      totalQuestions: 0,
      masteryLevel: 0,
      status: 'IN_PROGRESS',
    },
  });

  const firstQuestion = await AdaptiveQuizService.generateAdaptiveQuestion(session.id);

  sendCreated(res, {
    session: serializeQuizSession({ ...session, questions: [firstQuestion] }),
    currentQuestion: serializeQuizQuestion(firstQuestion),
  });
};

export const getNextAdaptiveQuestion = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { sessionId, lastQuestionId, lastAnswer } = req.body;

  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw ApiError.notFound('Quiz session not found');

  if (lastQuestionId && lastAnswer) {
    await (prisma as any).quizSessionQuestion.update({
      where: { id: lastQuestionId },
      data: { userAnswer: lastAnswer, isCorrect: undefined },
    });
  }

  const nextQuestion = await AdaptiveQuizService.generateAdaptiveQuestion(sessionId);

  await (prisma as any).quizSession.update({
    where: { id: sessionId },
    data: { totalQuestions: { increment: 1 } },
  });

  sendSuccess(res, { data: { question: serializeQuizQuestion(nextQuestion) } });
};

export const completeAdaptiveQuiz = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const { sessionId } = req.body;

  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: { questions: true },
  });
  if (!session) throw ApiError.notFound('Quiz session not found');

  const analytics = await QuizAnalyticsService.getSessionAnalytics(sessionId);

  const updated = await (prisma as any).quizSession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      score: analytics?.masteryLevel ?? session.masteryLevel,
      totalQuestions: session.questions.length,
    },
  });

  sendSuccess(res, {
    data: {
      session: serializeQuizSession(updated),
      analytics,
    },
  });
};
