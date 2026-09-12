import type { PaginationDto } from '../common/dto';

export interface TeacherResponseDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  specialization?: string[] | null;
  status: string;
  avatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherAssignmentResponseDto {
  id: string;
  title: string;
  subject?: string | null;
  className?: string | null;
  status: string;
  dueDate?: Date | null;
  submittedCount: number;
  totalCount: number;
  createdAt: Date;
}

export interface TeacherClassResponseDto {
  id: string;
  name: string;
  subject?: string | null;
  studentCount: number;
  schedule?: string | null;
  status: string;
}

export interface TeacherPerformanceResponseDto {
  teacherId: string;
  totalAssignments: number;
  activeClasses: number;
  totalStudents: number;
  averageClassScore: number;
  gradingCompletionRate: number;
  recentActivity: Record<string, unknown>[];
}

export interface TeacherListDto {
  data: TeacherResponseDto[];
  pagination: PaginationDto;
}
