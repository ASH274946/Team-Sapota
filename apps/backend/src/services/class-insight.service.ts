import prisma from '../config/prisma';
import { AIOrchestrator } from './ai/ai-orchestrator.service';

export class ClassInsightService {

  static async getAssignedClasses(organizationId: string, _facultyId: string) {
    return prisma.class.findMany({
      where: { organizationId },
      select: { id: true, grade: true, section: true, academicYear: true }
    });
  }

  static async getDashboardInsights(organizationId: string, facultyId: string, classId: string) {
    // Security check
    const classData = await prisma.class.findFirst({
      where: { id: classId, organizationId },
      include: { students: { where: { isActive: true } } }
    });

    if (!classData) {
      throw new Error('Unauthorized or Class not found');
    }

    const students = classData.students;
    const totalStudents = students.length;

    // 1. Attendance Rate & Trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rawAttendance = await prisma.attendanceRecord.findMany({
      where: { 
        classId: classId, 
        date: { gte: thirtyDaysAgo } 
      },
      select: { studentId: true, status: true, date: true }
    });

    let presentCount = 0;
    const totalAttendance = rawAttendance.length;

    const attendanceByDate: Record<string, { present: number, absent: number, total: number }> = {};
    const studentAttendanceStats: Record<string, { present: number, total: number }> = {};

    rawAttendance.forEach(record => {
      if (record.status === 'PRESENT') presentCount++;
      if (record.status === 'LATE') { presentCount++; } // Treat late as present for rate

      const dateStr = record.date.toISOString().split('T')[0];
      if (!attendanceByDate[dateStr]) attendanceByDate[dateStr] = { present: 0, absent: 0, total: 0 };
      
      attendanceByDate[dateStr].total++;
      if (record.status === 'PRESENT' || record.status === 'LATE') attendanceByDate[dateStr].present++;
      else attendanceByDate[dateStr].absent++;

      if (!studentAttendanceStats[record.studentId]) studentAttendanceStats[record.studentId] = { present: 0, total: 0 };
      studentAttendanceStats[record.studentId].total++;
      if (record.status === 'PRESENT' || record.status === 'LATE') studentAttendanceStats[record.studentId].present++;
    });

    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    const attendanceTrend = Object.keys(attendanceByDate).sort().map(date => ({
      date,
      rate: attendanceByDate[date].total > 0 ? (attendanceByDate[date].present / attendanceByDate[date].total) * 100 : 0
    }));

    // 2. Assignment Completion & Grades
    const assignments = await prisma.assignment.findMany({
      where: { classId, organizationId },
      select: { id: true, title: true, totalMarks: true }
    });
    
    const assignmentIds = assignments.map(a => a.id);
    let assignmentCompletionRate = 0;
    let averageGrade = 0;
    let submissionTrend: any[] = [];
    
    const studentAssignmentStats: Record<string, { submitted: number, totalScore: number, totalMaxScore: number }> = {};

    if (assignmentIds.length > 0) {
      const submissions = await prisma.studentSubmission.findMany({
        where: { assignmentId: { in: assignmentIds }, organizationId },
        include: { evaluations: true }
      });

      const totalExpected = assignmentIds.length * totalStudents;
      assignmentCompletionRate = totalExpected > 0 ? (submissions.length / totalExpected) * 100 : 0;

      let totalScoreEarned = 0;
      let totalScorePossible = 0;

      const submissionsByDate: Record<string, number> = {};

      submissions.forEach(sub => {
        const dateStr = sub.submittedAt.toISOString().split('T')[0];
        submissionsByDate[dateStr] = (submissionsByDate[dateStr] || 0) + 1;

        if (!studentAssignmentStats[sub.studentId]) studentAssignmentStats[sub.studentId] = { submitted: 0, totalScore: 0, totalMaxScore: 0 };
        studentAssignmentStats[sub.studentId].submitted++;

        if (sub.evaluations && sub.evaluations.length > 0) {
          const evalRec = sub.evaluations[0];
          const assignment = assignments.find(a => a.id === sub.assignmentId);
          if (assignment) {
            totalScoreEarned += evalRec.score;
            totalScorePossible += assignment.totalMarks;
            
            studentAssignmentStats[sub.studentId].totalScore += evalRec.score;
            studentAssignmentStats[sub.studentId].totalMaxScore += assignment.totalMarks;
          }
        }
      });

      averageGrade = totalScorePossible > 0 ? (totalScoreEarned / totalScorePossible) * 100 : 0;
      submissionTrend = Object.keys(submissionsByDate).sort().map(date => ({
        date,
        submissions: submissionsByDate[date]
      }));
    }

    // 3. At-Risk Students
    const studentInsights = students.map(student => {
      const att = studentAttendanceStats[student.id] || { present: 0, total: 0 };
      const asg = studentAssignmentStats[student.id] || { submitted: 0, totalScore: 0, totalMaxScore: 0 };
      
      const attRate = att.total > 0 ? (att.present / att.total) * 100 : 100; // Default to 100 if no records
      const asgCompletion = assignmentIds.length > 0 ? (asg.submitted / assignmentIds.length) * 100 : 100;
      const gradeRate = asg.totalMaxScore > 0 ? (asg.totalScore / asg.totalMaxScore) * 100 : null;

      const isAtRisk = attRate < 70 || asgCompletion < 50 || (gradeRate !== null && gradeRate < 60);

      return {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        attendanceRate: attRate,
        assignmentCompletionRate: asgCompletion,
        averageGrade: gradeRate,
        isAtRisk
      };
    });

    const atRiskStudents = studentInsights.filter(s => s.isAtRisk);

    return {
      overview: {
        totalStudents,
        attendanceRate,
        assignmentCompletionRate,
        averageGrade,
        activeStudents: totalStudents,
        atRiskCount: atRiskStudents.length
      },
      trends: {
        attendance: attendanceTrend,
        submissions: submissionTrend
      },
      studentInsights
    };
  }

  static async generateProactiveInsights(organizationId: string, userId: string, subject: string) {
    const recentQuizzes = await prisma.quizSession.findMany({
      where: { organizationId, subject },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });

    if (recentQuizzes.length === 0) return null;

    let totalScore = 0;
    const maxPossibleScore = recentQuizzes.length * 100; 
    
    recentQuizzes.forEach(q => totalScore += q.score);
    const averageScore = (totalScore / maxPossibleScore) * 100;

    const prompt = `
Analyze the following class performance data and generate an academic insight report.
Subject: ${subject}
Average Score: ${averageScore.toFixed(1)}%
Total Quizzes Evaluated: ${recentQuizzes.length}

CRITICAL RULES:
1. Identify if the class is "On Track", "At Risk", or "Needs Revision".
2. Recommend a specific action for the teacher (e.g., "Schedule a flash revision on Chapter 4").
`;

    const responseFormat = {
      type: "json_schema",
      json_schema: {
        name: "class_insight",
        schema: {
          type: "object",
          properties: {
            classStatus: { type: "string" },
            primaryWeakness: { type: "string" },
            teacherRecommendation: { type: "string" }
          },
          required: ["classStatus", "primaryWeakness", "teacherRecommendation"]
        }
      }
    };

    const insightData = await AIOrchestrator.generate({
      intent: 'GradeAssignment', 
      context: '', 
      taskInstructions: prompt,
      responseFormat
    });

    const report = await prisma.academicReport.create({
      data: {
        userId,
        organizationId,
        title: `Proactive Insights: ${subject}`,
        reportType: 'CLASS_PERFORMANCE',
        content: insightData
      }
    });

    return report;
  }
}
