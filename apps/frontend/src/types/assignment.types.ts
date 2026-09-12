export type QuestionType =
  | 'short-answer'
  | 'long-answer'
  | 'mcq'
  | 'true-false'
  | 'fill-blank';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type AssignmentStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'GENERATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIALLY_GENERATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

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
}

export interface GenerationDiagnostics {
  providerName: string;
  latencyMs: number;
  promptChars: number;
  responseChars: number;
  attemptCount: number;
}

export interface GenerationMeta {
  status: string;
  generatedQuestionCount: number;
  requestedQuestionCount: number;
  generatedMarks: number;
  requestedMarks: number;
  completedBatches: number;
  failedBatches: number;
  providerName: string | null;
  failureCategory: string | null;
  failureReason: string | null;
  completedAt: string | null;
  partialPaper: object | null;
}

export interface CanonicalPaperMetadata {
  title: string;
  subject: string;
  className: string;
  durationMinutes: number;
  requestedMarks: number;
  generatedMarks: number;
  requestedQuestionCount: number;
  generatedQuestionCount: number;
  schoolName: string;
  sections: Array<{ title: string; questionCount: number; marks: number }>;
  answerKeyReady: boolean;
  pdfReady: boolean;
}

export interface CanonicalGenerationState {
  canonicalMetadata: CanonicalPaperMetadata;
  progress: number;
  stage: import('./socket.types').GenerationStage;
  generatedQuestions: number;
  requestedQuestions: number;
  generatedMarks: number;
  requestedMarks: number;
  completionPercentage: number;
  answerKeyReady: boolean;
  pdfReady: boolean;
  generationStatus: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  questionConfig: QuestionConfig;
  uploadedFiles: FileRef[];
  additionalInstructions: string;
  status: AssignmentStatus;
  reviewComments?: string | null;
  generationMeta?: GenerationMeta;
  generationState?: CanonicalGenerationState;
  createdAt: string;
  updatedAt: string;
  generatedPapers?: any[];
  studentSubmission?: {
    id: string;
    status: string;
    submittedAt?: string;
    createdAt: string;
    fileType?: string;
    fileUrl?: string;
  } | null;
}

export interface CreateAssignmentFormData {
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number;
  totalMarks: number;
  questionConfig: QuestionConfig;
  additionalInstructions: string;
  files: File[];
}
