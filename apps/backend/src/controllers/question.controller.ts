import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createQuestion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { content, options, answer, subjectId, unitId, difficulty, bloomLevel } = req.body;

    if (!content || !answer) {
      res.status(400).json({ success: false, error: 'Content and answer are required' });
      return;
    }

    const question = await prisma.question.create({
      data: {
        content,
        options,
        answer,
        subjectId,
        unitId,
        difficulty,
        bloomLevel,
        author: {
          connect: { id: req.user.id }
        }
      }
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create question' });
  }
};

export const getQuestions = async (_req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch questions' });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { firstName: true, lastName: true } }
      }
    });
    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch question' });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const allowedRoles = ['TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient privileges' });
      return;
    }

    const { content, options, answer, difficulty, bloomLevel } = req.body;
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { content, options, answer, difficulty, bloomLevel }
    });
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const allowedRoles = ['TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient privileges' });
      return;
    }

    await prisma.question.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
};

export const checkDuplicateQuestion = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { content, options, answer, subjectId, candidates } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Question content is required' });
      return;
    }

    const orgId = req.user.organizationId || undefined;

    let candidateQuestions: Array<{ id: string; content: string; options?: string[]; answer?: string }> = Array.isArray(candidates) ? candidates : [];

    if (candidateQuestions.length === 0 && orgId) {
      const dbQuestions = await prisma.question.findMany({
        where: {
          organizationId: orgId,
          ...(subjectId && { subjectId }),
        },
        select: {
          id: true,
          content: true,
          options: true,
          answer: true,
        },
        take: 200,
        orderBy: { createdAt: 'desc' },
      });

      candidateQuestions = dbQuestions.map((q) => ({
        id: q.id,
        content: q.content,
        options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
        answer: q.answer || undefined,
      }));
    }

    const { DuplicateDetectionService } = await import('../services/duplicate-detection.service');
    const result = await DuplicateDetectionService.evaluateQuestionDuplicates(
      { content, options, answer, subjectId, organizationId: orgId },
      candidateQuestions,
      orgId
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to perform duplicate detection check',
    });
  }
};
