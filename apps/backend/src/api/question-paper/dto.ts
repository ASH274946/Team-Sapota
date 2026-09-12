export interface GeneratePaperDto {
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration: number;
  sections: PaperSectionDto[];
}

export interface PaperSectionDto {
  title: string;
  instructions?: string;
  questions: PaperQuestionDto[];
}

export interface PaperQuestionDto {
  question: string;
  marks: number;
  difficulty: string;
  type: string;
  options?: string[];
  answer?: { text: string; explanation?: string };
  hint?: string;
  bloomLevel?: string;
}

export interface GeneratedPaperDto {
  id: string;
  assignmentId: string;
  organizationId: string;
  title: string;
  totalMarks: number;
  duration: number;
  sections: PaperSectionDto[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  pdfUrl?: string;
  canonicalMetadata?: Record<string, unknown>;
  generatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJobDto {
  jobId: string;
  assignmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  generationSeq: number;
  error?: string;
  resultUrl?: string;
  createdAt: string;
}

export interface AnswerKeyDto {
  paperId: string;
  title: string;
  sections: AnswerKeySectionDto[];
}

export interface AnswerKeySectionDto {
  title: string;
  questions: AnswerKeyQuestionDto[];
}

export interface AnswerKeyQuestionDto {
  question: string;
  answer: { text: string; explanation?: string };
  marks: number;
}
