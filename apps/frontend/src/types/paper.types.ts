import type { QuestionType, DifficultyLevel } from './assignment.types';

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  options?: MCQOption[];
  blanks?: number;
  answer?: string | { text: string; explanation?: string };
}



export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration?: number;
  sections: Section[];
  pdfUrl: string | null;
  generatedAt: string;
  canonicalMetadata?: import('./assignment.types').CanonicalPaperMetadata;
}
