import type {
  StudentResponseDto,
  StudentProgressResponseDto,
  StudentPerformanceResponseDto,
  QuizHistoryResponseDto,
  SubmissionResponseDto,
  LearningProfileResponseDto,
  AtRiskResponseDto,
} from './dto';

export function serializeStudent(student: Record<string, unknown>): StudentResponseDto {
  const group = student.group as Record<string, unknown> | undefined;
  const user = student.user as Record<string, unknown> | undefined;
  return {
    id: student.id as string,
    userId: student.userId as string,
    firstName: user?.firstName as string || (student.firstName as string),
    lastName: user?.lastName as string || (student.lastName as string),
    email: user?.email as string || (student.email as string),
    enrollmentNumber: student.enrollmentNumber as string | null | undefined,
    groupId: student.groupId as string | null | undefined,
    groupName: group?.name as string | null | undefined,
    status: student.status as string,
    avatar: user?.avatar as string | null | undefined || (student.avatar as string | null | undefined),
    createdAt: student.createdAt as Date,
    updatedAt: student.updatedAt as Date,
  };
}

export function serializeStudentProgress(data: Record<string, unknown>): StudentProgressResponseDto {
  return {
    studentId: data.studentId as string,
    overallProgress: data.overallProgress as number,
    completionRate: data.completionRate as number,
    averageScore: data.averageScore as number,
    totalAssignments: data.totalAssignments as number,
    completedAssignments: data.completedAssignments as number,
    timeSpent: data.timeSpent as number,
    recentActivity: data.recentActivity as Record<string, unknown>[],
  };
}

export function serializeStudentPerformance(data: Record<string, unknown>): StudentPerformanceResponseDto {
  return {
    studentId: data.studentId as string,
    overallAverage: data.overallAverage as number,
    recentTrend: data.recentTrend as number[],
    subjectBreakdown: data.subjectBreakdown as Record<string, unknown>[],
    strengths: data.strengths as string[],
    weaknesses: data.weaknesses as string[],
  };
}

export function serializeQuizHistory(quiz: Record<string, unknown>): QuizHistoryResponseDto {
  return {
    id: quiz.id as string,
    quizId: quiz.quizId as string,
    title: quiz.title as string,
    score: quiz.score as number,
    maxScore: quiz.maxScore as number,
    percentage: quiz.percentage as number,
    completedAt: quiz.completedAt as Date,
    duration: quiz.duration as number,
  };
}

export function serializeSubmission(sub: Record<string, unknown>): SubmissionResponseDto {
  return {
    id: sub.id as string,
    assignmentId: sub.assignmentId as string,
    title: sub.title as string,
    status: sub.status as string,
    score: sub.score as number | null | undefined,
    maxScore: sub.maxScore as number | null | undefined,
    submittedAt: sub.submittedAt as Date,
    gradedAt: sub.gradedAt as Date | null | undefined,
  };
}

export function serializeLearningProfile(profile: Record<string, unknown>): LearningProfileResponseDto {
  return {
    studentId: profile.studentId as string,
    masteryLevel: profile.masteryLevel as number,
    knowledgeGrowth: profile.knowledgeGrowth as number,
    weakConcepts: (profile.weakConcepts as string[]) ?? [],
    strongConcepts: (profile.strongConcepts as string[]) ?? [],
    recommendedTopics: (profile.recommendedTopics as string[]) ?? [],
    studyPlan: profile.studyPlan as Record<string, unknown> | null | undefined,
  };
}

export function serializeAtRisk(data: Record<string, unknown>): AtRiskResponseDto {
  return {
    studentId: data.studentId as string,
    isAtRisk: data.isAtRisk as boolean,
    riskFactors: data.riskFactors as string[],
    confidence: data.confidence as number,
    recommendations: data.recommendations as string[],
  };
}
