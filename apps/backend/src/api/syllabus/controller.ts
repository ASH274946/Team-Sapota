import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { getRequestUserId } from '../../security/request-context';
import { parsePagination, buildPagination } from '../common/pagination';
import { sendSuccess, sendCreated } from '../common/response';
import { ApiError } from '../common/errors';
import { serializeSyllabus, serializeTopicResponse } from './serializers';
import type { CreateSyllabusDto, UpdateSyllabusDto, CreateTopicDto, UpdateTopicDto, UpdateSubtopicsDto } from './dto';

export async function listSyllabusEntries(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, search } = parsePagination(req);
  const subject = req.query.subject as string | undefined;
  const status = req.query.status as string | undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (subject) where.subject = subject;
  if (status) where.status = status;

  const [entries, total] = await Promise.all([
    prisma.syllabus.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        topics: {
          orderBy: { topicOrder: 'asc' },
          include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
        },
      },
    }),
    prisma.syllabus.count({ where }),
  ]);

  sendSuccess(res, {
    data: entries.map(serializeSyllabus as any),
    pagination: buildPagination(page, limit, total),
  });
}

export async function createSyllabusEntry(req: Request, res: Response): Promise<void> {
  const userId = getRequestUserId(req);
  const body = req.body as CreateSyllabusDto;

  const syllabus = await (prisma as any).syllabus.create({
    data: {
      title: body.title,
      subject: body.subject,
      grade: body.grade,
      status: 'active',
      userId,
      topics: body.topics?.length
        ? {
            create: body.topics.map((t, idx) => ({
              title: t.title,
              description: t.description || null,
              duration: t.duration || 60,
              topicOrder: idx,
              subtopics: t.subtopics?.length
                ? {
                    create: t.subtopics.map((s, sidx) => ({
                      title: s.title,
                      topicOrder: sidx,
                      completed: s.completed || false,
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

  sendCreated(res, serializeSyllabus(syllabus as any));
}

export async function getSyllabusEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const syllabus = await prisma.syllabus.findUnique({
    where: { id },
    include: {
      topics: {
        orderBy: { topicOrder: 'asc' },
        include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
      },
    },
  });

  if (!syllabus) throw ApiError.notFound('Syllabus not found');

  sendSuccess(res, { data: serializeSyllabus(syllabus as any) });
}

export async function updateSyllabus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = req.body as UpdateSyllabusDto;

  const existing = await prisma.syllabus.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Syllabus not found');

  const syllabus = await prisma.syllabus.update({
    where: { id },
    data: {
      title: body.title,
      subject: body.subject,
      grade: body.grade,
      status: body.status,
    },
    include: {
      topics: {
        orderBy: { topicOrder: 'asc' },
        include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
      },
    },
  });

  sendSuccess(res, { data: serializeSyllabus(syllabus as any) });
}

export async function deleteSyllabusEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.syllabus.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Syllabus not found');

  await prisma.syllabus.delete({ where: { id } });

  sendSuccess(res, { data: { id }, message: 'Syllabus deleted successfully' });
}

export async function addTopic(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = req.body as CreateTopicDto;

  const syllabus = await prisma.syllabus.findUnique({ where: { id } });
  if (!syllabus) throw ApiError.notFound('Syllabus not found');

  const count = await prisma.syllabusTopic.count({ where: { syllabusId: id } });

  const topic = await prisma.syllabusTopic.create({
    data: {
      syllabusId: id,
      title: body.title,
      description: body.description || null,
      duration: body.duration || 60,
      topicOrder: count,
      subtopics: body.subtopics?.length
        ? {
            create: body.subtopics.map((s, i) => ({
              title: s.title,
              topicOrder: i,
              completed: s.completed || false,
            })),
          }
        : undefined,
    },
    include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
  });

  sendCreated(res, serializeTopicResponse(topic));
}

export async function updateTopic(req: Request, res: Response): Promise<void> {
  const { topicId } = req.params;
  const body = req.body as UpdateTopicDto;

  const existing = await prisma.syllabusTopic.findUnique({ where: { id: topicId } });
  if (!existing) throw ApiError.notFound('Topic not found');

  const topic = await prisma.syllabusTopic.update({
    where: { id: topicId },
    data: {
      title: body.title,
      description: body.description,
      duration: body.duration,
      completed: body.completed,
    },
    include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
  });

  sendSuccess(res, { data: serializeTopicResponse(topic) });
}

export async function removeTopic(req: Request, res: Response): Promise<void> {
  const { topicId } = req.params;

  const existing = await prisma.syllabusTopic.findUnique({ where: { id: topicId } });
  if (!existing) throw ApiError.notFound('Topic not found');

  await prisma.syllabusTopic.delete({ where: { id: topicId } });

  sendSuccess(res, { data: { id: topicId }, message: 'Topic removed successfully' });
}

export async function updateSubtopics(req: Request, res: Response): Promise<void> {
  const { topicId } = req.params;
  const body = req.body as UpdateSubtopicsDto;

  const topic = await prisma.syllabusTopic.findUnique({ where: { id: topicId } });
  if (!topic) throw ApiError.notFound('Topic not found');

  const existingSubtopicIds = (
    await prisma.syllabusSubtopic.findMany({ where: { topicId }, select: { id: true } })
  ).map((s) => s.id);

  const incomingIds = body.subtopics.filter((s) => s.id).map((s) => s.id!);
  const toDelete = existingSubtopicIds.filter((id) => !incomingIds.includes(id));

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.syllabusSubtopic.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (let i = 0; i < body.subtopics.length; i++) {
      const s = body.subtopics[i];
      if (s.id && existingSubtopicIds.includes(s.id)) {
        await tx.syllabusSubtopic.update({
          where: { id: s.id },
          data: { title: s.title, topicOrder: s.topicOrder ?? i, completed: s.completed ?? false },
        });
      } else {
        await tx.syllabusSubtopic.create({
          data: { topicId, title: s.title, topicOrder: s.topicOrder ?? i, completed: s.completed ?? false },
        });
      }
    }
  });

  const updated = await prisma.syllabusTopic.findUnique({
    where: { id: topicId },
    include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
  });

  sendSuccess(res, { data: serializeTopicResponse(updated!) });
}
