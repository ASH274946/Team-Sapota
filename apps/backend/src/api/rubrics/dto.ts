export interface RubricDto {
  id: string;
  title: string;
  description?: string;
  department?: string;
  course?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  language?: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  organizationId: string;
  authorId: string;
  previousVersionId?: string;
  criteria: RubricCriterionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RubricCriterionDto {
  id: string;
  rubricId: string;
  parentId?: string;
  name: string;
  description?: string;
  maxMarks: number;
  minMarks?: number;
  expectedConcepts?: string[];
  expectedKeywords?: string[];
  bloomLevel?: string;
  difficulty?: string;
  teacherNotes?: string;
  subCriteria?: RubricCriterionDto[];
  createdAt: string;
}

export interface CreateRubricDto {
  title: string;
  description?: string;
  department?: string;
  course?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  language?: string;
  criteria: CreateRubricCriterionDto[];
}

export interface CreateRubricCriterionDto {
  name: string;
  description?: string;
  maxMarks: number;
  minMarks?: number;
  expectedConcepts?: string[];
  expectedKeywords?: string[];
  bloomLevel?: string;
  difficulty?: string;
  teacherNotes?: string;
  subCriteria?: CreateRubricCriterionDto[];
}

export interface UpdateRubricDto {
  title?: string;
  description?: string;
  department?: string;
  course?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  language?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  criteria?: CreateRubricCriterionDto[];
}

export interface ImportRubricDto {
  title: string;
  description?: string;
  criteria: CreateRubricCriterionDto[];
  rawText?: string;
}
