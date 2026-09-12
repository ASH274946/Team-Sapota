import type { GenerationStage } from './socket.types';
import type { GenerationStatus } from './generation.types';

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
  sections: Array<{
    title: string;
    questionCount: number;
    marks: number;
  }>;
  answerKeyReady: boolean;
  pdfReady: boolean;
}

export interface CanonicalGenerationState {
  canonicalMetadata: CanonicalPaperMetadata;
  progress: number;
  stage: GenerationStage;
  generatedQuestions: number;
  requestedQuestions: number;
  generatedMarks: number;
  requestedMarks: number;
  completionPercentage: number;
  answerKeyReady: boolean;
  pdfReady: boolean;
  generationStatus: GenerationStatus | 'generating' | 'draft';
}
