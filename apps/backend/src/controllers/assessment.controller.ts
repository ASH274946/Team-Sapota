import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { title, subjectId, totalMarks } = req.body;
    const authorId = req.user?.id || 'demo-author-id';
    const organizationId = req.user?.organizationId || 'demo-org-id';
    
    const assessment = await prisma.assessment.create({
      data: {
        title,
        subjectId,
        totalMarks: parseInt(totalMarks) || 100,
        authorId,
        organizationId,
        status: 'DRAFT'
      }
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to create assessment' });
  }
};

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    const subjectId = req.query.subject as string;
    const organizationId = req.body._requireOrganizationScope || req.user?.organizationId;

    const whereClause: any = {};
    if (subjectId) whereClause.subjectId = subjectId;
    if (organizationId) whereClause.organizationId = organizationId;

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { firstName: true, lastName: true } },
        _count: { select: { questions: true } }
      }
    });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
  }
};
