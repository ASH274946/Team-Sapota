import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import { parsePagination, buildPagination } from '../common/pagination';
import { sendSuccess, sendCreated } from '../common/response';
import { ApiError } from '../common/errors';
import { serializeSubject, serializeSubjectSyllabus } from './serializers';
import type { CreateSubjectDto, UpdateSubjectDto } from './dto';

export async function listSubjects(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, search } = parsePagination(req);
  const orgId = requireRequestOrgId(req);

  const where: any = { organizationId: orgId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [subjects, total] = await Promise.all([
    prisma.classGroup.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.classGroup.count({ where }),
  ]);

  sendSuccess(res, {
    data: subjects.map(serializeSubject as any),
    pagination: buildPagination(page, limit, total),
  });
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);
  const body = req.body as CreateSubjectDto;

  const existing = await prisma.classGroup.findFirst({
    where: { name: body.name, organizationId: orgId },
  });
  if (existing) {
    throw ApiError.conflict(`Subject with name '${body.name}' already exists`);
  }

  const subject = await prisma.classGroup.create({
    data: {
      name: body.name,
      subject: body.code ?? '',
      organizationId: orgId,
      userId,
    },
  });

  sendCreated(res, serializeSubject(subject as any));
}

export async function getSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const subject = await prisma.classGroup.findUnique({ where: { id } });
  if (!subject) throw ApiError.notFound('Subject not found');

  sendSuccess(res, { data: serializeSubject(subject as any) });
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = req.body as UpdateSubjectDto;

  const existing = await prisma.classGroup.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Subject not found');

  const subject = await prisma.classGroup.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      subject: body.code ?? existing.subject,
    },
  });

  sendSuccess(res, { data: serializeSubject(subject as any) });
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const existing = await prisma.classGroup.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Subject not found');

  await prisma.classGroup.delete({ where: { id } });

  sendSuccess(res, { data: { id }, message: 'Subject deleted successfully' });
}

export async function getSubjectSyllabus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const subject = await prisma.classGroup.findUnique({ where: { id } });
  if (!subject) throw ApiError.notFound('Subject not found');

  const syllabus = await prisma.syllabus.findFirst({
    where: { subject: subject.name },
    include: {
      topics: {
        orderBy: { topicOrder: 'asc' },
        include: { subtopics: { orderBy: { topicOrder: 'asc' } } },
      },
    },
  });

  if (!syllabus) throw ApiError.notFound('Syllabus not found for this subject');

  sendSuccess(res, { data: serializeSubjectSyllabus(syllabus as any) });
}

export async function getSubjectTeachers(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const subject = await prisma.classGroup.findUnique({ where: { id } });
  if (!subject) throw ApiError.notFound('Subject not found');

  sendSuccess(res, { data: [] });
}
