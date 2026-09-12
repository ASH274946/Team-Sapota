import type { RubricDto, RubricCriterionDto } from './dto';

function serializeCriterion(criterion: any): RubricCriterionDto {
  return {
    id: criterion.id,
    rubricId: criterion.rubricId,
    parentId: criterion.parentId ?? undefined,
    name: criterion.name,
    description: criterion.description ?? undefined,
    maxMarks: criterion.maxMarks,
    minMarks: criterion.minMarks ?? undefined,
    expectedConcepts: criterion.expectedConcepts ?? undefined,
    expectedKeywords: criterion.expectedKeywords ?? undefined,
    bloomLevel: criterion.bloomLevel ?? undefined,
    difficulty: criterion.difficulty ?? undefined,
    teacherNotes: criterion.teacherNotes ?? undefined,
    subCriteria: (criterion.subCriteria ?? []).map(serializeCriterion),
    createdAt: criterion.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeRubric(rubric: any): RubricDto {
  return {
    id: rubric.id,
    title: rubric.title,
    description: rubric.description ?? undefined,
    department: rubric.department ?? undefined,
    course: rubric.course ?? undefined,
    subject: rubric.subject ?? undefined,
    chapter: rubric.chapter ?? undefined,
    topic: rubric.topic ?? undefined,
    difficulty: rubric.difficulty ?? undefined,
    language: rubric.language ?? undefined,
    version: rubric.version,
    status: rubric.status,
    organizationId: rubric.organizationId,
    authorId: rubric.authorId,
    previousVersionId: rubric.previousVersionId ?? undefined,
    criteria: (rubric.criteria ?? []).filter((c: any) => !c.parentId).map(serializeCriterion),
    createdAt: rubric.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: rubric.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeRubricExport(rubric: any): Record<string, unknown> {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    rubric: serializeRubric(rubric),
  };
}
