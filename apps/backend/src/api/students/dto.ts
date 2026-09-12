import type { PaginationDto } from '../common/dto';

export interface StudentResponseDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  status: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgressResponseDto {
  studentId: string;
  overallProgress: number;
  completionRate: number;
  averageScore: number;
  totalAssignments: number;
  completedAssignments: number;
  timeSpent: number;
  recentActivity: Record<string, unknown>[];
}

export interface StudentPerformanceResponseDto {
  studentId: string;
  overallAverage: number;
  recentTrend: number[];
  subjectBreakdown: Record<string, unknown>[];
  strengths: string[];
  weaknesses: string[];
}

export interface QuizHistoryResponseDto {
  id: string;
  quizId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
  duration: number;
}

export interface SubmissionResponseDto {
  id: string;
  assignmentId: string;
  title: string;
  status: string;
  score?: number | null;
  maxScore?: number | null;
  submittedAt: Date;
  gradedAt?: Date | null;
}

export interface LearningProfileResponseDto {
  studentId: string;
  masteryLevel: number;
  knowledgeGrowth: number;
  weakConcepts: string[];
  strongConcepts: string[];
  recommendedTopics: string[];
  studyPlan?: Record<string, unknown> | null;
}

export interface AtRiskResponseDto {
  studentId: string;
  isAtRisk: boolean;
  riskFactors: string[];
  confidence: number;
  recommendations: string[];
}

export interface StudentListDto {
  data: StudentResponseDto[];
  pagination: PaginationDto;
}
