import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER']));

// Teacher Dashboard Stats
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  // Get teacher's sections and classes
  const [teacherSections, teacherClasses] = await Promise.all([
    prisma.section.findMany({ where: { teacherId: userId }, select: { id: true } }),
    prisma.class.findMany({ where: { facultyId: userId }, select: { id: true } })
  ]);
  const sectionIds = teacherSections.map(s => s.id);
  const classIds = teacherClasses.map(c => c.id);

  // Get distinct students from Enrollments and ClassStudent
  const [enrollments, classStudents] = await Promise.all([
    prisma.enrollment.findMany({ where: { sectionId: { in: sectionIds } }, select: { studentId: true }, distinct: ['studentId'] }),
    prisma.classStudent.findMany({ where: { classId: { in: classIds } }, select: { email: true } })
  ]);
  
  const studentIdsFromSections = enrollments.map(e => e.studentId);
  const studentEmailsFromClasses = classStudents.map(cs => cs.email);

  const [
    totalStudents,
    presentToday,
    testsConducted,
    assignmentsCreated,
    pendingEvaluations,
  ] = await Promise.all([
    prisma.user.count({
      where: { 
        role: 'STUDENT',
        OR: [
          { id: { in: studentIdsFromSections } },
          { email: { in: studentEmailsFromClasses } }
        ]
      },
    }),
    prisma.user.count({
      where: {
        role: 'STUDENT',
        OR: [
          { id: { in: studentIdsFromSections } },
          { email: { in: studentEmailsFromClasses } }
        ],
        // Last seen today
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.assignment.count({
      where: { createdById: userId },
    }),
    prisma.assignment.count({
      where: { createdById: userId },
    }),
    prisma.studentSubmission.count({
      where: { status: { not: 'GRADED' }, assignment: { createdById: userId } }, // Only submissions for this teacher's assignments
    }),
  ]);

  // Fetch recent tests from Assignment table
  const recentTestsRaw = await prisma.assignment.findMany({
    where: { createdById: userId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, title: true, createdAt: true },
  });

  const testIds = recentTestsRaw.map(t => t.id);
  const evaluationsForTests = await prisma.submissionEvaluation.findMany({
    where: { submission: { assignmentId: { in: testIds } } },
    select: {
      id: true,
      score: true,
      totalMarks: true,
      submission: { select: { assignmentId: true, studentId: true } },
    },
  });

  const recentTests = recentTestsRaw.map(t => {
    const evals = evaluationsForTests.filter(e => e.submission.assignmentId === t.id);
    const avgScore = evals.length > 0 ? Math.round(evals.reduce((acc, e) => acc + ((e.score || 0) / (e.totalMarks || 100)) * 100, 0) / evals.length) : 0;
    return {
      id: t.id,
      name: t.title,
      date: t.createdAt.toISOString().split('T')[0],
      score: avgScore,
    };
  });

  // Fetch top students from submissions
  const evaluationsRaw = await prisma.submissionEvaluation.findMany({
    orderBy: { score: 'desc' },
    take: 3,
    select: {
      id: true,
      score: true,
      totalMarks: true,
      submission: { select: { studentId: true } },
    },
  });

  const topStudentIds = evaluationsRaw.map(e => e.submission.studentId);
  const studentsUsers = await prisma.user.findMany({
    where: { id: { in: topStudentIds } },
    select: { id: true, firstName: true, lastName: true }
  });

  const topStudents = evaluationsRaw.map(e => {
    const student = studentsUsers.find(u => u.id === e.submission.studentId);
    return {
      id: e.submission.studentId,
      name: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
      rollNo: 'N/A', // User doesn't have rollNo
      average: Math.round(((e.score || 0) / (e.totalMarks || 100)) * 100),
    };
  });

  const absent = Math.max(0, totalStudents - presentToday);
  const averageClassScore = topStudents.length > 0 ? Math.round(topStudents.reduce((acc, s) => acc + s.average, 0) / topStudents.length) : 0;
  
  const ongoingExams = await prisma.assignment.count({
    where: { createdById: userId, status: 'ACTIVE' },
  });

  res.json({
    success: true,
    data: {
      totalStudents,
      presentToday,
      absent,
      testsConducted,
      assignmentsCreated,
      averageClassScore,
      ongoingExams,
      pendingEvaluations,
      recentTests,
      topStudents,
    },
  });
}));

import { uploadMiddleware } from '../middlewares/upload.middleware';
import { ingestionQueue } from '../queues/ingestion.queue';
import { requireRequestOrgId } from '../security/request-context';

// POST /upload-material
router.post('/upload-material', uploadMiddleware.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }
  
  const orgId = requireRequestOrgId(req);
  const fileUrl = req.file.path;
  const fileType = req.file.mimetype;
  const filename = req.file.originalname;

  await ingestionQueue.add('ingest-document', {
    fileUrl,
    fileType,
    organizationId: orgId,
    filename
  });

  res.json({ success: true, message: 'File uploaded and queued for processing', data: { path: fileUrl } });
}));

// GET /attendance - Fetch attendance records for a specific date
router.get('/attendance', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
  const { date } = req.query;

  if (!userId || !orgId || !date) {
    res.status(400).json({ success: false, error: 'Missing required parameters' });
    return;
  }

  // Parse as local midnight to avoid UTC off-by-one
  const [year, month, day] = (date as string).split('-').map(Number);
  const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      organizationId: orgId,
      date: {
        gte: attendanceDate,
        lt: new Date(year, month - 1, day + 1, 0, 0, 0, 0),
      }
    }
  });

  res.json({ success: true, data: records });
}));

// POST /attendance - Save attendance records
router.post('/attendance', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
  const { date, subject, records, adminOverride } = req.body;

  if (!userId || !orgId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (!date || !records || !Array.isArray(records)) {
    res.status(400).json({ success: false, error: 'date and records are required' });
    return;
  }

  // Parse date as local midnight
  const [year, month, day] = (date as string).split('-').map(Number);
  const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Block future dates
  if (attendanceDate > today) {
    res.status(400).json({ success: false, error: 'Cannot record attendance for a future date.' });
    return;
  }

  // Block past dates unless admin override
  if (attendanceDate < today) {
    const userRole = req.user?.role;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole || '');
    if (!isAdmin || !adminOverride) {
      res.status(403).json({
        success: false,
        error: 'Attendance for past dates is locked. Admin permission required to modify.',
        requiresAdminOverride: true,
      });
      return;
    }
  }

  // Find a class to associate with the attendance records
  let targetClass = await prisma.class.findFirst({ where: { facultyId: userId } });
  if (!targetClass) {
    targetClass = await prisma.class.findFirst({ where: { organizationId: orgId } });
  }
  if (!targetClass) {
    res.status(400).json({ success: false, error: 'No classes found in the organization' });
    return;
  }

  // Upsert all records
  for (const record of records) {
    const existing = await prisma.attendanceRecord.findFirst({
      where: { studentId: record.studentId, date: attendanceDate },
    });

    if (existing) {
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: record.status, subject, classId: targetClass.id },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: {
          studentId: record.studentId,
          classId: targetClass.id,
          subject,
          date: attendanceDate,
          status: record.status,
          organizationId: orgId,
          recordedById: userId,
        },
      });
    }
  }

  res.json({ success: true, message: 'Attendance recorded successfully' });
}));

// POST /announcements - Create a new announcement for classes
router.post('/announcements', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const orgId = req.user?.organizationId;
  const { title, message, audience } = req.body;

  if (!userId || !orgId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const post = await prisma.communityPost.create({
    data: {
      title,
      content: message,
      type: 'ANNOUNCEMENT',
      authorId: userId,
      organizationId: orgId,
      visibility: 'ORG_ONLY',
      tags: [audience]
    }
  });

  res.json({ success: true, data: post });
}));

// GET /announcements - Fetch teacher's announcements
router.get('/announcements', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const orgId = req.user?.organizationId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const posts = await prisma.communityPost.findMany({
    where: {
      authorId: userId,
      type: 'ANNOUNCEMENT',
      ...(orgId ? { organizationId: orgId } : {})
    },
    orderBy: { createdAt: 'desc' }
  });

  const formatted = posts.map(p => {
    let audience = 'All Enrolled Students';
    if (p.tags && Array.isArray(p.tags) && p.tags.length > 0) {
      audience = String(p.tags[0]);
    }
    return {
      id: p.id,
      title: p.title || '',
      message: p.content,
      audience,
      date: p.createdAt.toISOString()
    };
  });

  res.json({ success: true, data: formatted });
}));

// PUT /announcements/:id - Update an announcement
router.put('/announcements/:id', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { title, message, audience } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  // Ensure the post exists and belongs to the teacher
  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing || existing.authorId !== userId) {
    res.status(404).json({ success: false, error: 'Announcement not found or unauthorized' });
    return;
  }

  const updated = await prisma.communityPost.update({
    where: { id },
    data: {
      title,
      content: message,
      ...(audience ? { tags: [audience] } : {})
    }
  });

  res.json({ success: true, data: updated });
}));

// DELETE /announcements/:id - Delete an announcement
router.delete('/announcements/:id', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const existing = await prisma.communityPost.findUnique({ where: { id } });
  if (!existing || existing.authorId !== userId) {
    res.status(404).json({ success: false, error: 'Announcement not found or unauthorized' });
    return;
  }

  await prisma.communityPost.delete({ where: { id } });
  res.json({ success: true, message: 'Announcement deleted successfully' });
}));

// GET /obe - Fetch OBE data
router.get('/obe', asyncHandler(async (req, res) => {
  const orgId = req.user?.organizationId;
  
  if (!orgId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const [courseOutcomes, programOutcomes, mappingsRaw] = await Promise.all([
    prisma.courseOutcome.findMany({ where: { organizationId: orgId } }),
    prisma.programOutcome.findMany({ where: { organizationId: orgId } }),
    prisma.coPoMapping.findMany()
  ]);

  const coIds = courseOutcomes.map(co => co.id);
  const poIds = programOutcomes.map(po => po.id);

  // Filter mappings for these COs and POs
  const mappings = mappingsRaw.filter(m => coIds.includes(m.coId) && poIds.includes(m.poId));

  // Build the matrix
  const mappingMatrix: Record<string, Record<string, number | null>> = {};
  for (const co of courseOutcomes) {
    mappingMatrix[co.code] = {};
    for (const po of programOutcomes) {
      const mapping = mappings.find(m => m.coId === co.id && m.poId === po.id);
      mappingMatrix[co.code][po.code] = mapping ? mapping.weightage : null;
    }
  }

  res.json({
    success: true,
    data: {
      courseOutcomes: courseOutcomes.map(co => ({ id: co.code, desc: co.description, bloom: co.bloomLevel })),
      programOutcomes: programOutcomes.map(po => po.code),
      mapping: mappingMatrix
    }
  });
}));

// GET /students - Returns students in the organization for the teacher
router.get('/students', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const orgId = req.user?.activeOrganizationId || req.user?.organizationId;
  
  if (!userId || !orgId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const [users, classStudentsRaw] = await Promise.all([
    prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        organizationId: orgId
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 1000,
    }),
    prisma.classStudent.findMany({
      where: { class: { organizationId: orgId } }
    })
  ]);

  const students = users.map(u => {
    const cs = classStudentsRaw.find(c => c.email === u.email);
    return {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      rollNo: cs ? cs.rollNo : 'N/A',
      status: 'NONE' // Used for attendance frontend state
    };
  });

  students.sort((a, b) => {
    if (a.rollNo === 'N/A') return 1;
    if (b.rollNo === 'N/A') return -1;
    return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' });
  });
  
  res.json({ success: true, data: students });
}));

export default router;

