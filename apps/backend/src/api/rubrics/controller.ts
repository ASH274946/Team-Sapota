import { Request, Response } from 'express';
import { sendSuccess, sendCreated, sendNoContent } from '../common/response';
import { ApiError } from '../common/errors';
import { parsePagination, buildPagination } from '../common/pagination';
import { getRequestUserId, requireRequestOrgId } from '../../security/request-context';
import { RubricService } from '../../services/rubric.service';
import { RubricParserService } from '../../services/rubric-parser.service';
import prisma from '../../config/prisma';
import { serializeRubric, serializeRubricExport } from './serializers';

export const listRubrics = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order, search } = parsePagination(req);
  const orgId = requireRequestOrgId(req);

  const where: any = { organizationId: orgId };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [rubrics, total] = await Promise.all([
    prisma.rubric.findMany({
      where,
      include: { criteria: true },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.rubric.count({ where }),
  ]);

  sendSuccess(res, {
    data: rubrics.map(serializeRubric),
    pagination: buildPagination(page, limit, total),
  });
};

export const createRubric = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const { title, description, department, course, subject, chapter, topic, difficulty, language, criteria } = req.body;

  const rubric = await prisma.rubric.create({
    data: {
      title,
      description: description ?? null,
      department: department ?? null,
      course: course ?? null,
      subject: subject ?? null,
      chapter: chapter ?? null,
      topic: topic ?? null,
      difficulty: difficulty ?? null,
      language: language ?? null,
      version: 1,
      status: 'DRAFT',
      organizationId: orgId,
      authorId: userId,
      criteria: {
        create: criteria.map((c: any) => ({
          name: c.name,
          description: c.description ?? null,
          maxMarks: c.maxMarks,
          minMarks: c.minMarks ?? null,
          expectedConcepts: c.expectedConcepts ?? null,
          expectedKeywords: c.expectedKeywords ?? null,
          bloomLevel: c.bloomLevel ?? null,
          difficulty: c.difficulty ?? null,
          teacherNotes: c.teacherNotes ?? null,
          subCriteria: c.subCriteria
            ? { create: c.subCriteria.map((sc: any) => ({
                name: sc.name,
                description: sc.description ?? null,
                maxMarks: sc.maxMarks,
                minMarks: sc.minMarks ?? null,
                expectedConcepts: sc.expectedConcepts ?? null,
                expectedKeywords: sc.expectedKeywords ?? null,
                bloomLevel: sc.bloomLevel ?? null,
                difficulty: sc.difficulty ?? null,
                teacherNotes: sc.teacherNotes ?? null,
              })) }
            : undefined,
        })),
      },
    },
    include: { criteria: { include: { subCriteria: true } } },
  });

  sendCreated(res, serializeRubric(rubric));
};

export const getRubric = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const rubric = await RubricService.getRubricWithCriteria(id);

  if (!rubric) {
    throw ApiError.notFound('Rubric not found');
  }

  sendSuccess(res, { data: serializeRubric(rubric) });
};

export const updateRubric = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await prisma.rubric.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Rubric not found');

  const { criteria, ...rubricFields } = req.body;

  if (criteria) {
    await prisma.rubricCriterion.deleteMany({ where: { rubricId: id, parentId: null } });
    await prisma.rubricCriterion.deleteMany({ where: { rubricId: id } });
  }

  const rubric = await prisma.rubric.update({
    where: { id },
    data: {
      ...rubricFields,
      ...(criteria
        ? {
            criteria: {
              create: criteria.map((c: any) => ({
                name: c.name,
                description: c.description ?? null,
                maxMarks: c.maxMarks,
                minMarks: c.minMarks ?? null,
                expectedConcepts: c.expectedConcepts ?? null,
                expectedKeywords: c.expectedKeywords ?? null,
                bloomLevel: c.bloomLevel ?? null,
                difficulty: c.difficulty ?? null,
                teacherNotes: c.teacherNotes ?? null,
                subCriteria: c.subCriteria
                  ? { create: c.subCriteria.map((sc: any) => ({
                      name: sc.name,
                      description: sc.description ?? null,
                      maxMarks: sc.maxMarks,
                      minMarks: sc.minMarks ?? null,
                      expectedConcepts: sc.expectedConcepts ?? null,
                      expectedKeywords: sc.expectedKeywords ?? null,
                      bloomLevel: sc.bloomLevel ?? null,
                      difficulty: sc.difficulty ?? null,
                      teacherNotes: sc.teacherNotes ?? null,
                    })) }
                  : undefined,
              })),
            },
          }
        : {}),
    },
    include: { criteria: { include: { subCriteria: true } } },
  });

  sendSuccess(res, { data: serializeRubric(rubric) });
};

export const deleteRubric = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await prisma.rubric.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Rubric not found');

  await prisma.rubricCriterion.deleteMany({ where: { rubricId: id } });
  await prisma.rubric.delete({ where: { id } });

  sendNoContent(res);
};

export const duplicateRubric = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = getRequestUserId(req);

  const existing = await RubricService.getRubricWithCriteria(id);
  if (!existing) throw ApiError.notFound('Rubric not found');

  const newVersion = await RubricService.createNewVersion(id, userId);

  const rubric = await RubricService.getRubricWithCriteria(newVersion.id);
  sendCreated(res, serializeRubric(rubric));
};

export const exportRubric = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const rubric = await RubricService.getRubricWithCriteria(id);
  if (!rubric) throw ApiError.notFound('Rubric not found');

  sendSuccess(res, { data: serializeRubricExport(rubric) });
};

export const importRubric = async (req: Request, res: Response): Promise<void> => {
  const userId = getRequestUserId(req);
  const orgId = requireRequestOrgId(req);

  const { title, description, criteria, rawText } = req.body;

  let resolvedCriteria = criteria;

  if (rawText && !criteria) {
    const parsed = await RubricParserService.parseUnstructuredRubric(rawText);
    resolvedCriteria = parsed.criteria ?? [];
  }

  if (!resolvedCriteria || resolvedCriteria.length === 0) {
    throw ApiError.badRequest('No criteria provided or parsed from input');
  }

  const rubric = await prisma.rubric.create({
    data: {
      title,
      description: description ?? null,
      version: 1,
      status: 'DRAFT',
      organizationId: orgId,
      authorId: userId,
      criteria: {
        create: resolvedCriteria.map((c: any) => ({
          name: c.name,
          description: c.description ?? null,
          maxMarks: c.maxMarks,
          minMarks: c.minMarks ?? null,
          expectedConcepts: c.expectedConcepts ?? null,
          expectedKeywords: c.expectedKeywords ?? null,
          bloomLevel: c.bloomLevel ?? null,
          difficulty: c.difficulty ?? null,
          teacherNotes: c.teacherNotes ?? null,
          subCriteria: c.subCriteria
            ? { create: c.subCriteria.map((sc: any) => ({
                name: sc.name,
                description: sc.description ?? null,
                maxMarks: sc.maxMarks,
                minMarks: sc.minMarks ?? null,
                expectedConcepts: sc.expectedConcepts ?? null,
                expectedKeywords: sc.expectedKeywords ?? null,
                bloomLevel: sc.bloomLevel ?? null,
                difficulty: sc.difficulty ?? null,
                teacherNotes: sc.teacherNotes ?? null,
              })) }
            : undefined,
        })),
      },
    },
    include: { criteria: { include: { subCriteria: true } } },
  });

  sendCreated(res, serializeRubric(rubric));
};
