// Re-export all types from individual files
export type {
  QuestionType,
  DifficultyLevel,
  AssignmentStatus,
  DifficultyDistribution,
  QuestionConfig,
  FileRef,
  Assignment,
  CreateAssignmentFormData,
} from './assignment.types';

export type { MCQOption, Question, Section, GeneratedPaper } from './paper.types';
export type { GenerationStage, GenerationProgressPayload, GenerationCompletedPayload, GenerationFailedPayload } from './socket.types';
export type { Assignment as default } from './assignment.types';
