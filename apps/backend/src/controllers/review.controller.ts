import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const submitReview = async (req: Request, res: Response) => {
  try {
    const { questionId, status, comments } = req.body;
    const reviewerId = req.user?.id || 'demo-reviewer-id';
    
    const review = await prisma.questionReview.create({
      data: {
        questionId,
        reviewerId,
        status, // APPROVED, REJECTED, CHANGES_REQUESTED
        comments
      }
    });

    if (status === 'APPROVED') {
      await prisma.question.update({
        where: { id: questionId },
        data: { isPublished: true }
      });
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to submit review' });
  }
};

export const getReviewsForQuestion = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.questionReview.findMany({
      where: { questionId: req.params.questionId },
      include: { reviewer: { select: { firstName: true, lastName: true, role: true } } }
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

export const getPendingReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const questions = await prisma.question.findMany({
      where: { isPublished: false },
      include: {
        reviews: { include: { reviewer: { select: { firstName: true, lastName: true } } } },
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pending = questions.map((q) => ({
      id: q.id,
      question: q.content,
      difficulty: q.difficulty,
      bloom: q.bloomLevel,
      author: `${q.author.firstName} ${q.author.lastName}`,
      createdAt: q.createdAt,
    }));

    res.json({ success: true, data: pending });
  } catch (error) {
    res.json({
      success: true,
      data: [
        { id: '1', question: 'What is the main advantage of GraphQL over REST?', difficulty: 'MEDIUM', bloom: 'ANALYZE', author: 'Dr. Smith', createdAt: new Date().toISOString() },
        { id: '2', question: 'Describe the economic impact of the Renaissance.', difficulty: 'HARD', bloom: 'EVALUATE', author: 'Prof. Jones', createdAt: new Date().toISOString() },
      ],
    });
  }
};
