import type { GradingConfigDto, SubmissionDto, EvaluationDto, BulkEvaluateJobDto } from './dto';

export function serializeGradingConfig(config: any): GradingConfigDto {
  return {
    id: config.id,
    assignmentId: config.assignmentId,
    answerKeyText: config.answerKeyText,
    rubricId: config.rubricId ?? undefined,
    aiModel: config.aiModel ?? undefined,
    passingScore: config.passingScore ?? undefined,
    maxAttempts: config.maxAttempts ?? undefined,
    gradingType: config.gradingType,
    status: config.status,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function serializeSubmission(submission: any): SubmissionDto {
  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    studentName: submission.student?.name ?? undefined,
    fileUrl: submission.fileUrl,
    fileType: submission.fileType,
    status: submission.status,
    submittedAt: submission.createdAt.toISOString(),
    evaluatedAt: submission.evaluatedAt?.toISOString() ?? undefined,
    score: submission.score ?? undefined,
    totalMarks: submission.totalMarks ?? undefined,
  };
}

export function serializeEvaluation(evaluation: any): EvaluationDto {
  return {
    id: evaluation.id,
    submissionId: evaluation.submissionId,
    score: evaluation.score,
    totalMarks: evaluation.totalMarks,
    generalFeedback: evaluation.generalFeedback,
    criteriaGrades: (evaluation.criteriaGrades ?? []).map((g: any) => ({
      criterionId: g.criterionId,
      criterionName: g.criterionName ?? '',
      score: g.score,
      maxScore: g.maxScore ?? g.maxMarks ?? 0,
      explanation: g.explanation ?? '',
    })),
    evaluatedAt: evaluation.createdAt?.toISOString() ?? new Date().toISOString(),
    overriddenAt: evaluation.overriddenAt?.toISOString() ?? undefined,
    overrideReason: evaluation.overrideReason ?? undefined,
  };
}

export function serializeBulkEvaluateJob(job: any): BulkEvaluateJobDto {
  return {
    jobId: job.id,
    assignmentId: job.assignmentId,
    status: job.status,
    progress: job.progress ?? 0,
    total: job.total ?? 0,
    completed: job.completed ?? 0,
    failed: job.failed ?? 0,
    errors: job.errors ?? undefined,
    createdAt: job.createdAt?.toISOString() ?? new Date().toISOString(),
    completedAt: job.completedAt?.toISOString() ?? undefined,
  };
}
