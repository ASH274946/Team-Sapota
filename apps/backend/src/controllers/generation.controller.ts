import { Request, Response } from 'express';

import { generateSingleQuestion, generateMultipleQuestions, GeneratedQuestion } from '../services/question-generation.service';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { StreakService } from '../services/streak.service';
import { processUploadedFiles } from '../services/document-extractor.service';


export const generateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, subject, difficulty, bloomLevel, context } = req.body;

    if (!topic || !subject) {
      res.status(400).json({ success: false, error: 'Topic and subject are required' });
      return;
    }

    const question = await generateSingleQuestion({
      topic,
      subject,
      difficulty: difficulty || 'MEDIUM',
      bloomLevel: bloomLevel || 'APPLY',
      context: context || undefined,
    });

    // Persist to DB so questions survive localStorage clears
    const userId = (req as any).user?.id;
    if (userId) {
      try {
        await prisma.question.upsert({
          where: { id: question.id },
          create: {
            id: question.id,
            content: question.question_text,
            options: question.options as any,
            answer: question.answer,
            hint: question.hint,
            difficulty: (difficulty || 'MEDIUM') as any,
            bloomLevel: (bloomLevel || 'APPLY') as any,
            author: {
              connect: { id: userId },
            },
            isPublished: false,
          },
          update: {},
        });
      } catch (dbErr) {
        logger.warn(`[generateQuestion] Failed to persist question to DB: ${dbErr instanceof Error ? dbErr.message : dbErr}`);
      }
    }

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate question';
    if (message.includes('AI provider') || message.includes('API key')) {
      res.status(503).json({ success: false, error: message });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
};

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, subject, difficulty, bloomLevel, context, count } = req.body;

    if (!topic || !subject) {
      res.status(400).json({ success: false, error: 'Topic and subject are required' });
      return;
    }

    const numQuestions = Math.min(25, Math.max(1, Number(count) || 5));

    const userId = (req as any).user?.id;
    const orgId = (req as any).user?.organizationId;

    const acceptedQuestions: GeneratedQuestion[] = [];
    const { DuplicateDetectionService } = await import('../services/duplicate-detection.service');
    let attempts = 0;
    const maxAttempts = 3;

    while (acceptedQuestions.length < numQuestions && attempts < maxAttempts) {
      attempts++;
      const neededCount = numQuestions - acceptedQuestions.length;

      const batch = await generateMultipleQuestions({
        topic,
        subject,
        difficulty: difficulty || 'MEDIUM',
        bloomLevel: bloomLevel || 'APPLY',
        context: context || undefined,
        organizationId: orgId,
        count: neededCount,
      });

      const candidateItems = batch.map((q) => ({
        id: q.id,
        content: q.question_text,
        options: q.options,
        answer: q.answer,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
      }));

      const dedupResult = await DuplicateDetectionService.deduplicateBatch(candidateItems, orgId);
      const acceptedIds = new Set(dedupResult.accepted.map((a) => a.id));
      const newlyAccepted = batch.filter((q) => acceptedIds.has(q.id));

      for (const q of newlyAccepted) {
        if (
          acceptedQuestions.length < numQuestions &&
          !acceptedQuestions.some((existing: GeneratedQuestion) => existing.id === q.id || existing.question_text === q.question_text)
        ) {
          acceptedQuestions.push(q);
        }
      }
    }

    if (acceptedQuestions.length === 0) {
      res.status(500).json({
        success: false,
        error: `Failed to generate valid practice questions for topic "${topic}". Please try again.`,
      });
      return;
    }

    // Persist accepted non-duplicate questions to DB
    if (userId) {
      await Promise.all(
        acceptedQuestions.map(async (question: GeneratedQuestion) => {
          try {
            await prisma.question.upsert({
              where: { id: question.id },
              create: {
                id: question.id,
                content: question.question_text,
                options: question.options as any,
                answer: question.answer,
                hint: question.hint,
                difficulty: (difficulty || 'MEDIUM') as any,
                bloomLevel: (bloomLevel || 'APPLY') as any,
                author: {
                  connect: { id: userId },
                },
                isPublished: false,
              },
              update: {},
            });
          } catch (dbErr) {
            logger.warn(`[generateQuestions] Failed to persist question to DB: ${dbErr instanceof Error ? dbErr.message : dbErr}`);
          }
        })
      );
    }

    res.status(200).json({
      success: true,
      data: acceptedQuestions,
      totalRequested: numQuestions,
      totalGenerated: acceptedQuestions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate questions';
    if (message.includes('AI provider') || message.includes('API key')) {
      res.status(503).json({ success: false, error: message });
    } else {
      res.status(500).json({ success: false, error: message });
    }
  }
};

/**
 * POST /api/v1/generate/session
 * Persist a completed quiz session (questions + score + attempts) to the database.
 */
export const saveQuizSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      topic,
      subject,
      difficulty,
      bloomLevel,
      timeLimitSeconds,
      timeTakenSeconds,
      score,
      attempts,
      questions,
    } = req.body;

    if (!topic || !subject || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'topic, subject and questions are required' });
      return;
    }

    const userId = (req as any).user?.id || 'demo-faculty-id';

    const session = await prisma.quizSession.create({
      data: {
        topic,
        subject,
        difficulty: difficulty || 'MEDIUM',
        bloomLevel: bloomLevel || 'APPLY',
        timeLimitSeconds: Number(timeLimitSeconds) || questions.length * 60,
        timeTakenSeconds: Number(timeTakenSeconds) || 0,
        totalQuestions: questions.length,
        score: Number(score) || 0,
        attempts: attempts || {},
        userId,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            questionIndex: idx,
            questionText: q.question_text,
            options: q.options || [],
            answer: q.answer || '',
            hint: q.hint || '',
            difficulty: q.difficulty || difficulty || 'MEDIUM',
            bloomLevel: q.bloomLevel || bloomLevel || 'APPLY',
            aiConfidenceScore: q.ai_confidence_score || 0.85,
          })),
        },
      },
      include: { questions: true },
    });

    logger.info({
      action: 'Quiz Created',
      userId,
      organizationId: (req as any).user?.organizationId || 'no-organization',
      requestId: req.headers['x-request-id'] || uuidv4(),
      quizId: session.id,
      timestamp: new Date().toISOString()
    }, 'Quiz Created');

    // Update Streak!
    if (userId !== 'demo-faculty-id') {
      await StreakService.recordActivity(userId);
    }

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error(`[saveQuizSession] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to save quiz session' });
  }
};

/**
 * GET /api/v1/generate/session/:id
 * Fetch a specific quiz session by ID.
 */
export const getQuizSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'demo-faculty-id';

    const session = await prisma.quizSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!session || session.userId !== userId) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    logger.error(`[getQuizSessionById] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
};

/**
 * PUT /api/v1/generate/session/:id
 * Update an existing quiz session (score, time taken, attempts).
 */
export const updateQuizSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'demo-faculty-id';
    const { score, timeTakenSeconds, attempts } = req.body;

    const session = await prisma.quizSession.findUnique({
      where: { id },
    });

    if (!session || session.userId !== userId) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const updatedSession = await prisma.quizSession.update({
      where: { id },
      data: {
        score: score !== undefined ? Number(score) : session.score,
        timeTakenSeconds: timeTakenSeconds !== undefined ? Number(timeTakenSeconds) : session.timeTakenSeconds,
        attempts: attempts || session.attempts,
      },
      include: { questions: true },
    });

    res.json({ success: true, data: updatedSession });
  } catch (error) {
    logger.error(`[updateQuizSession] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to update quiz session' });
  }
};

/**
 * GET /api/v1/generate/history
 * List all quiz sessions for the current user, newest first.
 */
export const getQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'demo-faculty-id';
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const sessions = await prisma.quizSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        questions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    logger.error(`[getQuizHistory] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch quiz history' });
  }
};

/**
 * DELETE /api/v1/generate/history
 * Clear all quiz sessions for the current user.
 */
export const clearQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || 'demo-faculty-id';

    await prisma.quizSession.deleteMany({ where: { userId } });

    res.json({ success: true, message: 'Quiz history cleared' });
  } catch (error) {
    logger.error(`[clearQuizHistory] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to clear quiz history' });
  }
};

/**
 * POST /api/v1/generate/parse
 * Extract text from uploaded document(s) (PDF, PNG, JPG, JPEG, WEBP, DOCX, TXT, MD)
 */
export const parseDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle both req.file (single file) and req.files (array or object map of files)
    let files: Express.Multer.File[] = [];

    if (req.file) {
      files = [req.file];
    } else if (Array.isArray(req.files)) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      files = Object.values(req.files).flat();
    }

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded. Please select one or more files.' });
      return;
    }

    const { content, results } = await processUploadedFiles(files);

    res.json({
      success: true,
      data: {
        content,
        results,
      },
    });
  } catch (error: any) {
    logger.error(`[parseDocument] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to parse document' });
  }
};

/**
 * POST /api/v1/generate/share
 * Save a generated quiz as a template to be shared
 */
export const shareQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, subject, difficulty, bloomLevel, questions } = req.body;

    if (!topic || !subject || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'topic, subject and questions are required' });
      return;
    }

    // Save as a QuizSession with userId = "shared"
    const session = await prisma.quizSession.create({
      data: {
        topic,
        subject,
        difficulty: difficulty || 'MEDIUM',
        bloomLevel: bloomLevel || 'APPLY',
        timeLimitSeconds: questions.length * 60,
        timeTakenSeconds: 0,
        totalQuestions: questions.length,
        score: 0,
        attempts: {},
        userId: 'shared',
        questions: {
          create: questions.map((q: any, idx: number) => ({
            questionIndex: idx,
            questionText: q.question_text || q.questionText,
            options: q.options || [],
            answer: q.answer || '',
            hint: q.hint || '',
            difficulty: q.difficulty || difficulty || 'MEDIUM',
            bloomLevel: q.bloomLevel || bloomLevel || 'APPLY',
            aiConfidenceScore: q.ai_confidence_score || q.aiConfidenceScore || 0.85,
          })),
        },
      },
    });

    res.status(201).json({ success: true, data: { sharedId: session.id } });
  } catch (error) {
    logger.error(`[shareQuiz] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to share quiz' });
  }
};

/**
 * GET /api/v1/generate/shared/:id
 * Retrieve a shared quiz template
 */
export const getSharedQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await prisma.quizSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!session || session.userId !== 'shared') {
      res.status(404).json({ success: false, error: 'Shared quiz not found' });
      return;
    }

    res.json({ success: true, data: session });
  } catch (error) {
    logger.error(`[getSharedQuiz] ${error instanceof Error ? error.message : error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch shared quiz' });
  }
};

