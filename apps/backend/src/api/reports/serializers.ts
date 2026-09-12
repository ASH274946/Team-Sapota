import type {
  ReportJobDto,
  AssignmentReportDto,
  StudentReportDto,
  ClassReportDto,
  OrganizationReportDto,
  DownloadReportDto,
} from './dto';

export function serializeReportJob(job: any): ReportJobDto {
  return {
    jobId: job.jobId ?? job.id,
    status: job.status,
    progress: job.progress,
    resultUrl: job.resultUrl,
    error: job.error,
    createdAt: job.createdAt,
  };
}

export function serializeAssignmentReport(data: any): AssignmentReportDto {
  return {
    assignmentId: data.assignmentId,
    title: data.title ?? '',
    totalStudents: data.totalStudents ?? 0,
    submittedCount: data.submittedCount ?? 0,
    averageScore: data.averageScore ?? 0,
    gradeDistribution: data.gradeDistribution ?? {},
    questionAnalysis: data.questionAnalysis ?? [],
  };
}

export function serializeStudentReport(data: any): StudentReportDto {
  return {
    studentId: data.studentId,
    name: data.name ?? '',
    totalAssignments: data.totalAssignments ?? 0,
    averageScore: data.averageScore ?? 0,
    growthTrend: data.growthTrend ?? 'STABLE',
    topicMastery: data.topicMastery ?? [],
    recommendations: data.recommendations ?? [],
  };
}

export function serializeClassReport(data: any): ClassReportDto {
  return {
    classId: data.classId,
    className: data.className ?? '',
    totalStudents: data.totalStudents ?? 0,
    averageScore: data.averageScore ?? 0,
    gradeDistribution: data.gradeDistribution ?? {},
    topPerformers: data.topPerformers ?? [],
    atRiskStudents: data.atRiskStudents ?? [],
  };
}

export function serializeOrganizationReport(data: any): OrganizationReportDto {
  return {
    orgId: data.orgId,
    name: data.name ?? '',
    totalUsers: data.totalUsers ?? 0,
    totalTeachers: data.totalTeachers ?? 0,
    totalStudents: data.totalStudents ?? 0,
    totalAssignments: data.totalAssignments ?? 0,
    averageScore: data.averageScore ?? 0,
    aiUsageTokens: data.aiUsageTokens ?? 0,
    aiUsageCost: data.aiUsageCost ?? 0,
  };
}

export function serializeDownloadReport(data: any): DownloadReportDto {
  return {
    reportId: data.reportId ?? data.id,
    url: data.url,
    format: data.format ?? 'pdf',
    generatedAt: data.generatedAt ?? data.createdAt,
  };
}
