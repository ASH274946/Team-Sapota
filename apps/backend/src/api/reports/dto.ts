export interface GenerateReportDto {
  assignmentId?: string;
  studentId?: string;
  classId?: string;
  orgId?: string;
  format?: 'pdf' | 'csv' | 'json';
}

export interface ReportJobDto {
  jobId: string;
  status: string;
  progress?: number;
  resultUrl?: string;
  error?: string;
  createdAt: Date;
}

export interface AssignmentReportDto {
  assignmentId: string;
  title: string;
  totalStudents: number;
  submittedCount: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  questionAnalysis: Array<{
    questionId: string;
    averageScore: number;
    difficulty: string;
  }>;
}

export interface StudentReportDto {
  studentId: string;
  name: string;
  totalAssignments: number;
  averageScore: number;
  growthTrend: string;
  topicMastery: Array<{ topic: string; mastery: number }>;
  recommendations: string[];
}

export interface ClassReportDto {
  classId: string;
  className: string;
  totalStudents: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  topPerformers: string[];
  atRiskStudents: string[];
}

export interface OrganizationReportDto {
  orgId: string;
  name: string;
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssignments: number;
  averageScore: number;
  aiUsageTokens: number;
  aiUsageCost: number;
}

export interface DownloadReportDto {
  reportId: string;
  url: string;
  format: string;
  generatedAt: Date;
}
