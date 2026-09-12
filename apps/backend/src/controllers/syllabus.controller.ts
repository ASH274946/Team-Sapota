import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';

// ── List all syllabuses ──
export const getSyllabuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }
    const syllabuses = await prisma.syllabus.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        topics: {
          orderBy: { topicOrder: 'asc' },
          include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
        },
      },
    });
    res.json({ success: true, data: syllabuses });
  } catch (error) {
    logger.error(`[getSyllabuses] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch syllabuses' });
  }
};

// ── Get single syllabus ──
export const getSyllabus = async (req: Request, res: Response): Promise<void> => {
  try {
    const syllabus = await prisma.syllabus.findUnique({
      where: { id: req.params.id },
      include: {
        topics: {
          orderBy: { topicOrder: 'asc' },
          include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
        },
      },
    });
    if (!syllabus) {
      res.status(404).json({ success: false, error: 'Syllabus not found' });
      return;
    }
    res.json({ success: true, data: syllabus });
  } catch (error) {
    logger.error(`[getSyllabus] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch syllabus' });
  }
};

// ── Create syllabus ──
export const createSyllabus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, grade, topics } = req.body;
    if (!title || !subject || !grade) {
      res.status(400).json({ success: false, error: 'title, subject, and grade are required' });
      return;
    }
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ success: false, error: 'Unauthorized' }); return; }

    const syllabus = await prisma.syllabus.create({
      data: {
        title,
        subject,
        grade,
        status: 'active',
        userId,
        topics: topics?.length
          ? {
              create: topics.map((t: any, idx: number) => ({
                title: t.title,
                description: t.description || null,
                duration: t.duration || 60,
                completed: t.completed || false,
                topicOrder: idx,
                subtopics: t.subtopics?.length
                  ? {
                      create: t.subtopics.map((s: any, sidx: number) => ({
                        title: s.title,
                        completed: s.completed || false,
                        topicOrder: sidx,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        topics: {
          orderBy: { topicOrder: 'asc' },
          include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
        },
      },
    });

    res.status(201).json({ success: true, data: syllabus, message: 'Syllabus created' });
  } catch (error) {
    logger.error(`[createSyllabus] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create syllabus' });
  }
};

// ── Update syllabus (title / grade / status) ──
export const updateSyllabus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subject, grade, status } = req.body;
    const syllabus = await prisma.syllabus.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(status && { status }),
      },
      include: {
        topics: {
          orderBy: { topicOrder: 'asc' },
          include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
        },
      },
    });
    res.json({ success: true, data: syllabus, message: 'Syllabus updated' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Syllabus not found' });
      return;
    }
    logger.error(`[updateSyllabus] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update syllabus' });
  }
};

// ── Delete syllabus ──
export const deleteSyllabus = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.syllabus.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Syllabus deleted' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Syllabus not found' });
      return;
    }
    logger.error(`[deleteSyllabus] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete syllabus' });
  }
};

// ── Toggle topic completion ──
export const updateTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { completed, title, description, duration } = req.body;
    const topic = await prisma.syllabusTopic.update({
      where: { id: req.params.topicId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration }),
      },
      include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
    });
    res.json({ success: true, data: topic });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Topic not found' });
      return;
    }
    logger.error(`[updateTopic] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update topic' });
  }
};

// ── Toggle subtopic completion ──
export const updateSubtopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { completed, title } = req.body;
    const subtopic = await prisma.syllabusSubtopic.update({
      where: { id: req.params.subtopicId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title && { title }),
      },
    });
    res.json({ success: true, data: subtopic });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Subtopic not found' });
      return;
    }
    logger.error(`[updateSubtopic] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update subtopic' });
  }
};

// ── Add topic to existing syllabus ──
export const addTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, duration, subtopics } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: 'title is required' });
      return;
    }
    // Determine next order
    const count = await prisma.syllabusTopic.count({ where: { syllabusId: req.params.id } });
    const topic = await prisma.syllabusTopic.create({
      data: {
        syllabusId: req.params.id,
        title,
        description: description || null,
        duration: duration || 60,
        topicOrder: count,
        subtopics: subtopics?.length
          ? {
              create: subtopics.map((s: any, i: number) => ({
                title: s.title,
                completed: s.completed || false,
                topicOrder: i,
              })),
            }
          : undefined,
      },
      include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
    });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    logger.error(`[addTopic] ${error}`);
    res.status(500).json({ success: false, error: 'Failed to add topic' });
  }
};
