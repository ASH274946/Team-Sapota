import type {
  DashboardStatsDto,
  AssignmentAnalyticsDto,
  QuizAnalyticsDto,
  StudentPerformanceDto,
  TeacherPerformanceDto,
  UsageStatsDto,
  AiUsageStatsDto,
  TrendDataDto,
} from './dto';

export function serializeDashboard(stats: any): DashboardStatsDto {
  return {
    totalUsers: stats.totalUsers ?? stats.totals?.users ?? 0,
    totalSessions: stats.totalSessions ?? 0,
    activeUsers: stats.activeUsers ?? stats.totals?.activeUsers ?? 0,
    papersGenerated: stats.papersGenerated ?? stats.totals?.papersGenerated ?? 0,
    assignmentsCreated: stats.assignmentsCreated ?? stats.totals?.assignmentsCreated ?? 0,
    aiTokensUsed: stats.aiTokensUsed ?? stats.aiAnalytics?.totalTokens ?? 0,
    aiCostUsd: stats.aiCostUsd ?? stats.aiAnalytics?.totalCost ?? 0,
  };
}

export function serializeAssignmentAnalytics(data: any): AssignmentAnalyticsDto {
  return {
    totalAssignments: data.totalAssignments ?? 0,
    averageScore: data.averageScore ?? 0,
    submissionRate: data.submissionRate ?? 0,
    gradeDistribution: data.gradeDistribution ?? {},
  };
}

export function serializeQuizAnalytics(data: any): QuizAnalyticsDto {
  return {
    totalQuizzes: data.totalQuizzes ?? 0,
    averageScore: data.averageScore ?? 0,
    completionRate: data.completionRate ?? 0,
    questionDistribution: data.questionDistribution ?? {},
  };
}

export function serializeStudentPerformance(data: any): StudentPerformanceDto {
  return {
    studentId: data.studentId,
    averageScore: data.averageScore ?? 0,
    totalSubmissions: data.totalSubmissions ?? data.scoresHistory?.length ?? 0,
    growthTrend: data.growthTrend ?? 'STABLE',
    topicMastery: data.topicMastery ?? [],
    weakAreas: data.weakAreas ?? [],
  };
}

export function serializeTeacherPerformance(data: any): TeacherPerformanceDto {
  return {
    teacherId: data.teacherId ?? data.id,
    name: data.name ?? '',
    totalAssignments: data.totalAssignments ?? 0,
    averageClassScore: data.averageClassScore ?? 0,
    papersGenerated: data.papersGenerated ?? 0,
  };
}

export function serializeUsageStats(data: any): UsageStatsDto {
  return {
    totalRequests: data.totalRequests ?? 0,
    uniqueUsers: data.uniqueUsers ?? 0,
    endpointBreakdown: data.endpointBreakdown ?? {},
    dailyAverage: data.dailyAverage ?? 0,
  };
}

export function serializeAiUsage(data: any): AiUsageStatsDto {
  return {
    totalTokens: data.totalTokens ?? 0,
    totalCost: data.totalCost ?? 0,
    providerUsage: data.providerUsage ?? {},
    topModels: data.topModels ?? [],
  };
}

export function serializeTrendData(data: any): TrendDataDto {
  return {
    labels: data.labels ?? [],
    values: data.values ?? [],
    metric: data.metric ?? 'score',
    period: data.period ?? '30d',
  };
}
