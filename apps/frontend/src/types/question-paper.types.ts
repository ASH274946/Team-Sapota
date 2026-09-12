export interface PaperQuestion {
  question: string;
  marks: number;
  difficulty: string;
  type: string;
  options?: string[];
  answer?: { text: string; explanation?: string };
  hint?: string;
  bloomLevel?: string;
}

export interface PaperSection {
  title: string;
  instructions?: string;
  questions: PaperQuestion[];
}

export interface GeneratePaperData {
  assignmentId: string;
  title: string;
  totalMarks: number;
  duration: number;
  sections: PaperSection[];
}

export interface GeneratedPaper {
  id: string;
  assignmentId: string;
  organizationId: string;
  title: string;
  totalMarks: number;
  duration: number;
  sections: PaperSection[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  pdfUrl?: string;
  canonicalMetadata?: Record<string, unknown>;
  generatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
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

export interface AnswerKeySection {
  title: string;
  questions: AnswerKeyQuestion[];
}

export interface AnswerKeyQuestion {
  question: string;
  answer: { text: string; explanation?: string };
  marks: number;
}

export interface AnswerKey {
  paperId: string;
  title: string;
  sections: AnswerKeySection[];
}
