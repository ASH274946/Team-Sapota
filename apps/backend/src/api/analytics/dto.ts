export interface DashboardStatsDto {
  totalUsers: number;
  totalSessions: number;
  activeUsers: number;
  papersGenerated: number;
  assignmentsCreated: number;
  aiTokensUsed: number;
  aiCostUsd: number;
}

export interface AssignmentAnalyticsDto {
  totalAssignments: number;
  averageScore: number;
  submissionRate: number;
  gradeDistribution: Record<string, number>;
}

export interface QuizAnalyticsDto {
  totalQuizzes: number;
  averageScore: number;
  completionRate: number;
  questionDistribution: Record<string, number>;
}

export interface StudentPerformanceDto {
  studentId: string;
  averageScore: number;
  totalSubmissions: number;
  growthTrend: string;
  topicMastery: Array<{ topic: string; mastery: number }>;
  weakAreas: string[];
}

export interface TeacherPerformanceDto {
  teacherId: string;
  name: string;
  totalAssignments: number;
  averageClassScore: number;
  papersGenerated: number;
}

export interface UsageStatsDto {
  totalRequests: number;
  uniqueUsers: number;
  endpointBreakdown: Record<string, number>;
  dailyAverage: number;
}

export interface AiUsageStatsDto {
  totalTokens: number;
  totalCost: number;
  providerUsage: Record<string, { tokens: number; cost: number }>;
  topModels: Array<{ model: string; usage: number }>;
}

export interface TrendDataDto {
  labels: string[];
  values: number[];
  metric: string;
  period: string;
}
