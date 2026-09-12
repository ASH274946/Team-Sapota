import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import { z } from 'zod';

const markAttendanceSchema = z.object({
  classId: z.string(),
  date: z.string().or(z.date()),
  attendance: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT']),
    topics: z.array(z.string()).optional(),
  })),
});

export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const teacherId = getRequestUserId(req);
    const parsed = markAttendanceSchema.parse(req.body);
    const targetDate = new Date(parsed.date);
    targetDate.setHours(0, 0, 0, 0);

    // Ensure a valid class exists for attendance
    let classRec = await prisma.class.findFirst({
      where: { organizationId: orgId },
    });

    if (!classRec) {
      classRec = await prisma.class.create({
        data: {
          grade: '10',
          section: 'A',
          academicYear: new Date().getFullYear().toString(),
          organizationId: orgId,
        }
      });
    }
    
    // override the classId to the valid one
    const validClassId = classRec.id;

    // Process attendance updates in a transaction
    const results = await prisma.$transaction(
      parsed.attendance.map((record) => 
        prisma.attendanceRecord.upsert({
          where: {
            studentId_classId_date_subject: {
              studentId: record.studentId,
              classId: validClassId,
              date: targetDate,
              subject: req.body.subject || '',
            },
          },
          create: {
            studentId: record.studentId,
            classId: validClassId,
            date: targetDate,
            status: record.status,
            topics: record.topics || [],
            organizationId: orgId,
            recordedById: teacherId,
          },
          update: {
            status: record.status,
            topics: record.topics || [],
            recordedById: teacherId,
          },
        })
      )
    );

    res.json({ success: true, count: results.length });
  } catch (error: any) {
    logger.error(`[Attendance:mark] ${error}`);
    res.status(400).json({ success: false, error: error.message || 'Failed to mark attendance' });
  }
};

export const getAttendanceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const dateStr = req.query.date as string;
    
    if (!dateStr) {
      res.status(400).json({ success: false, error: 'Date is required' });
      return;
    }

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        organizationId: orgId,
        date: targetDate,
      },
    });

    res.json({ success: true, alreadyTaken: !!record });
  } catch (error: any) {
    logger.error(`[Attendance:status] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to check status' });
  }
};

export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const studentId = getRequestUserId(req);
    
    // Allow teacher to request specific student's attendance if query param provided
    const targetStudentId = req.query.studentId ? String(req.query.studentId) : studentId;

    const monthStr = req.query.month as string;
    const yearStr = req.query.year as string;
    
    let dateFilter = {};
    let prevDateFilter = {};
    
    if (monthStr && yearStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        }
      };
      
      const prevStartDate = new Date(year, month - 1, 1);
      const prevEndDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      prevDateFilter = {
        date: {
          gte: prevStartDate,
          lte: prevEndDate,
        }
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: targetStudentId, organizationId: orgId, ...dateFilter },
      include: {
        class: { select: { grade: true, section: true } },
      },
      orderBy: { date: 'desc' },
    });

    let previousTotalClasses = 0;
    
    if (monthStr && yearStr) {
      const prevRecords = await prisma.attendanceRecord.findMany({
         where: { studentId: targetStudentId, organizationId: orgId, ...prevDateFilter },
         select: { id: true }
      });
      previousTotalClasses = prevRecords.length;
    }

    const totalClasses = records.length;
    const presentClasses = records.filter((r: any) => ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)).length;
    const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
    
    const diffFromLastMonth = totalClasses - previousTotalClasses;

    // Group by subject
    const subjectStats: Record<string, { total: number, present: number }> = {};
    records.forEach(r => {
      const subject = r.subject || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, present: 0 };
      }
      subjectStats[subject].total++;
      if (['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)) {
        subjectStats[subject].present++;
      }
    });

    const subjectAttendance = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      percentage: Math.round((stats.present / stats.total) * 100)
    }));

    res.json({
      success: true,
      data: {
        records,
        stats: {
          totalClasses,
          presentClasses,
          percentage: Number(percentage.toFixed(2)),
          diffFromLastMonth,
          subjectAttendance
        }
      }
    });
  } catch (error: any) {
    logger.error(`[Attendance:studentView] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch attendance' });
  }
};

const leaveApplicationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Reason is required'),
  duration: z.string().min(1, 'Duration is required'),
});

export const submitLeaveApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const studentId = getRequestUserId(req);
    const parsed = leaveApplicationSchema.parse(req.body);

    const application = await prisma.leaveApplication.create({
      data: {
        studentId,
        organizationId: orgId,
        title: parsed.title,
        subject: parsed.subject,
        body: parsed.body,
        duration: parsed.duration,
        status: 'PENDING',
      }
    });

    res.json({ success: true, data: application });
  } catch (error: any) {
    logger.error(`[Attendance:submitLeave] ${error}`);
    res.status(400).json({ success: false, error: error.message || 'Failed to submit leave application' });
  }
};

export const getLeaveApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const studentId = getRequestUserId(req);

    const applications = await prisma.leaveApplication.findMany({
      where: {
        studentId,
        organizationId: orgId
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({ success: true, data: applications });
  } catch (error: any) {
    logger.error(`[Attendance:getLeaveApplications] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch leave applications' });
  }
};

export const getTeacherLeaveApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireRequestOrgId(req);
    const applications = await prisma.leaveApplication.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    const formatted = applications.map((app: any) => ({
      id: app.id,
      title: app.title,
      subject: app.subject,
      body: app.body,
      status: app.status,
      duration: app.duration,
      createdAt: app.createdAt,
      student: {
        name: app.student ? `${app.student.firstName} ${app.student.lastName}` : 'Student',
        email: app.student?.email || '',
        avatarUrl: app.student?.avatar || undefined,
      },
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    logger.error(`[Attendance:getTeacherLeave] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch leave requests' });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const updated = await prisma.leaveApplication.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error(`[Attendance:updateLeaveStatus] ${error}`);
    res.status(500).json({ success: false, error: error.message || 'Failed to update leave request status' });
  }
};

