import type {
  KnowledgeQualityScoreDto,
  EvaluationJobDto,
  ChunkQualityMetricsDto,
  QualityReportDto,
} from './dto';

interface PrismaChunkQuality {
  chunkId: string;
  overallScore: number;
  semanticCompleteness: number;
  informationDensity: number;
  duplicateRisk: number;
  isTiny: boolean;
  isOversized: boolean;
  isOrphan: boolean;
  recommendation: string | null;
  chunkLength: number;
}

export function serializeQualityScore(quality: PrismaChunkQuality): KnowledgeQualityScoreDto {
  return {
    chunkId: quality.chunkId,
    overallScore: quality.overallScore,
    semanticCompleteness: quality.semanticCompleteness,
    informationDensity: quality.informationDensity,
    duplicateRisk: quality.duplicateRisk,
    isTiny: quality.isTiny,
    isOversized: quality.isOversized,
    isOrphan: quality.isOrphan,
    recommendation: quality.recommendation ?? '',
    chunkLength: quality.chunkLength,
    evaluatedAt: new Date().toISOString(),
  };
}

export function serializeEvaluationJob(job: {
  id: string;
  status: string;
  progress?: number | null;
  error?: string | null;
}): EvaluationJobDto {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress ?? null,
    error: job.error ?? null,
  };
}

export function serializeChunkQualityMetrics(quality: PrismaChunkQuality): ChunkQualityMetricsDto {
  return serializeQualityScore(quality);
}

export function serializeQualityReport(report: QualityReportDto): QualityReportDto {
  return report;
}
