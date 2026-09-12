export interface KnowledgeQualityScoreDto {
  overallScore: number;
  semanticCompleteness: number;
  informationDensity: number;
  duplicateRisk: number;
  isTiny: boolean;
  isOversized: boolean;
  isOrphan: boolean;
  recommendation: string;
  chunkLength: number;
  chunkId: string;
  evaluatedAt: string;
}

export interface EvaluationJobDto {
  jobId: string;
  status: string;
  progress: number | null;
  error: string | null;
}

export interface ChunkQualityMetricsDto {
  chunkId: string;
  overallScore: number;
  semanticCompleteness: number;
  informationDensity: number;
  duplicateRisk: number;
  isTiny: boolean;
  isOversized: boolean;
  isOrphan: boolean;
  recommendation: string;
  chunkLength: number;
  evaluatedAt: string;
}

export interface QualityReportDto {
  totalChunks: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  tinyChunks: number;
  oversizedChunks: number;
  orphanChunks: number;
  recommendations: Record<string, number>;
  generatedAt: string;
}
