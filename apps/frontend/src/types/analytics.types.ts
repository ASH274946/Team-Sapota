export interface DashboardStats {
  totalUsers: number;
  totalSessions: number;
  activeUsers: number;
  papersGenerated: number;
  assignmentsCreated: number;
  aiTokensUsed: number;
  aiCostUsd: number;
}

export interface AssignmentAnalytics {
  totalAssignments: number;
  averageScore: number;
  submissionRate: number;
  gradeDistribution: Record<string, number>;
}

export interface QuizAnalytics {
  totalQuizzes: number;
  averageScore: number;
  completionRate: number;
  questionDistribution: Record<string, number>;
}

export interface StudentPerformance {
  studentId: string;
  averageScore: number;
  totalSubmissions: number;
  growthTrend: string;
  topicMastery: Array<{ topic: string; mastery: number }>;
  weakAreas: string[];
}

export interface TeacherPerformance {
  teacherId: string;
  name: string;
  totalAssignments: number;
  averageClassScore: number;
  papersGenerated: number;
}

export interface UsageStats {
  totalRequests: number;
  uniqueUsers: number;
  endpointBreakdown: Record<string, number>;
  dailyAverage: number;
}

export interface AiUsageStats {
  totalTokens: number;
  totalCost: number;
  providerUsage: Record<string, { tokens: number; cost: number }>;
  topModels: Array<{ model: string; usage: number }>;
}

export interface TrendData {
  labels: string[];
  values: number[];
  metric: string;
  period: string;
}
