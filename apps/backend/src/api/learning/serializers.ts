import type {
  LearningProfileDto,
  PredictionDto,
  StudyPlanDto,
  LearningInsightDto,
  JobStatusDto,
} from './dto';

export function serializeProfile(profile: any): LearningProfileDto {
  return {
    id: profile.id,
    studentId: profile.studentId,
    masteryLevel: profile.masteryLevel,
    knowledgeGrowth: profile.knowledgeGrowth,
    weakConcepts: profile.weakConcepts ?? [],
    learningStyle: profile.learningStyle,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function serializePrediction(prediction: any): PredictionDto {
  return {
    predictedScore: prediction.predictedScore,
    confidence: prediction.confidence,
    atRisk: prediction.atRisk,
    recommendations: prediction.recommendations ?? [],
  };
}

export function serializeStudyPlan(plan: any): StudyPlanDto {
  return {
    id: plan.id,
    studentId: plan.studentId,
    title: plan.title,
    recommendedTopics: plan.recommendedTopics ?? [],
    estimatedTimeMins: plan.estimatedTimeMins,
    difficultyTarget: plan.difficultyTarget,
    createdAt: plan.createdAt,
  };
}

export function serializeInsight(insight: any): LearningInsightDto {
  return {
    studentId: insight.studentId,
    averageScore: insight.averageScore,
    growthTrend: insight.growthTrend,
    weakAreas: insight.weakAreas ?? [],
    recommendedFocus: insight.recommendedFocus ?? [],
  };
}

export function serializeJobStatus(job: any): JobStatusDto {
  return {
    jobId: job.jobId ?? job.id,
    status: job.status,
    progress: job.progress,
    resultUrl: job.resultUrl,
    error: job.error,
  };
}
