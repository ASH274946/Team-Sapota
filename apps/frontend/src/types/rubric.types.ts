export interface RubricCriterion {
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
  subCriteria?: RubricCriterion[];
  createdAt: string;
}

export interface Rubric {
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
  criteria: RubricCriterion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRubricData {
  title: string;
  description?: string;
  department?: string;
  course?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  language?: string;
  criteria: CreateRubricCriterion[];
}

export interface CreateRubricCriterion {
  name: string;
  description?: string;
  maxMarks: number;
  minMarks?: number;
  expectedConcepts?: string[];
  expectedKeywords?: string[];
  bloomLevel?: string;
  difficulty?: string;
  teacherNotes?: string;
  subCriteria?: CreateRubricCriterion[];
}

export interface UpdateRubricData {
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
  criteria?: CreateRubricCriterion[];
}

export interface ImportRubricData {
  title: string;
  description?: string;
  criteria: CreateRubricCriterion[];
  rawText?: string;
}
