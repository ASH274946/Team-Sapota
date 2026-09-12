export type QuestionType =
  | 'short-answer'
  | 'long-answer'
  | 'mcq'
  | 'true-false'
  | 'fill-blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssignmentStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'partially_generated';

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface QuestionConfig {
  types: QuestionType[];
  count: number;
  difficulty: DifficultyDistribution;
}

export interface FileRef {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface TypeBreakdownItem {
  type: string;
  count: number;
  marksPerQuestion: number;
}

export interface CreateAssignmentDTO {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  questionConfig: QuestionConfig;
  additionalInstructions?: string;
  typeBreakdown?: string;
}
