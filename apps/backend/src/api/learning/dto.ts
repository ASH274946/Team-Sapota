export interface UpdateLearningProfileDto {
  weakConcepts?: string[];
  masteryLevel?: number;
  learningStyle?: string;
}

export interface LearningProfileDto {
  id: string;
  studentId: string;
  masteryLevel: number;
  knowledgeGrowth: number;
  weakConcepts: string[];
  learningStyle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictionDto {
  predictedScore: number;
  confidence: number;
  atRisk: boolean;
  recommendations: string[];
}

export interface StudyPlanDto {
  id: string;
  studentId: string;
  title: string;
  recommendedTopics: string[];
  estimatedTimeMins: number;
  difficultyTarget: string;
  createdAt: Date;
}

export interface LearningInsightDto {
  studentId: string;
  averageScore: number;
  growthTrend: string;
  weakAreas: string[];
  recommendedFocus: string[];
}

export interface IdentifyAtRiskDto {
  thresholds?: {
    minScore?: number;
    maxAbsences?: number;
  };
}

export interface JobStatusDto {
  jobId: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
}
