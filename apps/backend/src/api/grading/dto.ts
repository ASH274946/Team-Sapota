export interface GradingConfigDto {
  id: string;
  assignmentId: string;
  answerKeyText: string;
  rubricId?: string;
  aiModel?: string;
  passingScore?: number;
  maxAttempts?: number;
  gradingType: 'AUTO' | 'MANUAL' | 'HYBRID';
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradingConfigDto {
  answerKeyText: string;
  rubricId?: string;
  aiModel?: string;
  passingScore?: number;
  maxAttempts?: number;
  gradingType: 'AUTO' | 'MANUAL' | 'HYBRID';
}

export interface UpdateGradingConfigDto {
  answerKeyText?: string;
  rubricId?: string;
  aiModel?: string;
  passingScore?: number;
  maxAttempts?: number;
  gradingType?: 'AUTO' | 'MANUAL' | 'HYBRID';
}

export interface SubmissionDto {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  fileUrl: string;
  fileType: string;
  status: 'PENDING' | 'GRADED' | 'FAILED';
  submittedAt: string;
  evaluatedAt?: string;
  score?: number;
  totalMarks?: number;
}

export interface EvaluationDto {
  id: string;
  submissionId: string;
  score: number;
  totalMarks: number;
  generalFeedback: string;
  criteriaGrades: CriteriaGradeDto[];
  evaluatedAt: string;
  overriddenAt?: string;
  overrideReason?: string;
}

export interface CriteriaGradeDto {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface GradeOverrideDto {
  score: number;
  reason: string;
  criteriaGrades?: CriteriaGradeDto[];
}

export interface BulkEvaluateJobDto {
  jobId: string;
  assignmentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  completed: number;
  failed: number;
  errors?: string[];
  createdAt: string;
  completedAt?: string;
}
