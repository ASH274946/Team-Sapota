import type {
  TeacherResponseDto,
  TeacherAssignmentResponseDto,
  TeacherClassResponseDto,
  TeacherPerformanceResponseDto,
} from './dto';

export function serializeTeacher(teacher: Record<string, unknown>): TeacherResponseDto {
  const user = teacher.user as Record<string, unknown> | undefined;
  const dept = teacher.department as Record<string, unknown> | undefined;
  return {
    id: teacher.id as string,
    userId: teacher.userId as string,
    firstName: user?.firstName as string || (teacher.firstName as string),
    lastName: user?.lastName as string || (teacher.lastName as string),
    email: user?.email as string || (teacher.email as string),
    employeeId: teacher.employeeId as string | null | undefined,
    departmentId: teacher.departmentId as string | null | undefined,
    departmentName: dept?.name as string | null | undefined,
    specialization: teacher.specialization as string[] | null | undefined,
    status: teacher.status as string,
    avatar: user?.avatar as string | null | undefined || (teacher.avatar as string | null | undefined),
    createdAt: teacher.createdAt as Date,
    updatedAt: teacher.updatedAt as Date,
  };
}

export function serializeTeacherAssignment(assignment: Record<string, unknown>): TeacherAssignmentResponseDto {
  const subject = assignment.subject as Record<string, unknown> | undefined;
  const classGroup = assignment.classGroup as Record<string, unknown> | undefined;
  return {
    id: assignment.id as string,
    title: assignment.title as string,
    subject: (subject?.name as string) || (assignment.subjectName as string | null | undefined),
    className: classGroup?.name as string | null | undefined,
    status: assignment.status as string,
    dueDate: assignment.dueDate as Date | null | undefined,
    submittedCount: assignment.submittedCount as number || 0,
    totalCount: assignment.totalCount as number || 0,
    createdAt: assignment.createdAt as Date,
  };
}

export function serializeTeacherClass(cls: Record<string, unknown>): TeacherClassResponseDto {
  return {
    id: cls.id as string,
    name: cls.name as string,
    subject: (cls.subject as Record<string, unknown>)?.name as string | null || (cls.subjectName as string | null),
    studentCount: cls.studentCount as number || (cls._count as Record<string, number>)?.students || 0,
    schedule: cls.schedule as string | null | undefined,
    status: cls.status as string,
  };
}

export function serializeTeacherPerformance(data: Record<string, unknown>): TeacherPerformanceResponseDto {
  return {
    teacherId: data.teacherId as string,
    totalAssignments: data.totalAssignments as number,
    activeClasses: data.activeClasses as number,
    totalStudents: data.totalStudents as number,
    averageClassScore: data.averageClassScore as number,
    gradingCompletionRate: data.gradingCompletionRate as number,
    recentActivity: data.recentActivity as Record<string, unknown>[],
  };
}
