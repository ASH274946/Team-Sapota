import { Request, Response } from 'express';
import path from 'path';
import prisma from '../config/prisma';
import { evaluateSubmission, extractTextFromFile, overrideEvaluation } from '../services/grader.service';
import { AuditService } from '../services/audit.service';
import {
  assertCanGradeAssignment,
  loadSubmissionScoped,
  handleAccessError,
} from '../security/assignment-access';
import { requireRequestOrgId, getRequestUserId } from '../security/request-context';
import { getPaper } from '../services/paper.service';

export const saveGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const { rubricId, answerKeyText, autoEvaluate } = req.body;

    const config = await prisma.assignmentGradingConfig.upsert({
      where: { assignmentId },
      create: {
        assignmentId,
        rubricId: rubricId || null,
        answerKeyText: answerKeyText || '',
        autoEvaluate: autoEvaluate !== false,
      },
      update: {
        rubricId: rubricId || null,
        answerKeyText: answerKeyText || '',
        autoEvaluate: autoEvaluate !== false,
      },
    });

    res.json({ success: true, data: config });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to save grading config' });
  }
};

/** Upload and extract the source question paper once so every answer sheet uses it. */
export const uploadQuestionPaper = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'A question paper file is required' });
      return;
    }

    const questionPaperText = await extractTextFromFile(file.path, file.mimetype);
    const config = await prisma.assignmentGradingConfig.upsert({
      where: { assignmentId },
      create: { assignmentId, questionPaperPath: file.path, questionPaperName: file.originalname, questionPaperType: file.mimetype, questionPaperText },
      update: { questionPaperPath: file.path, questionPaperName: file.originalname, questionPaperType: file.mimetype, questionPaperText },
    });
    res.status(201).json({ success: true, data: config });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to upload question paper' });
  }
};

export const getGradingConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const config = await prisma.assignmentGradingConfig.findUnique({
      where: { assignmentId },
      include: { rubric: true },
    });
    res.json({ success: true, data: config });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to fetch grading config' });
  }
};

export const runAIEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await loadSubmissionScoped(req, req.params.submissionId);
    await assertCanGradeAssignment(req, submission.assignmentId);
    const evaluation = await evaluateSubmission(submission.id);
    res.json({ success: true, data: evaluation });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Evaluation failed' });
  }
};

export const bulkAIEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);

    // Find all un-graded submissions
    const submissions = await prisma.studentSubmission.findMany({
      where: { assignmentId, status: { not: 'GRADED' } },
    });

    if (submissions.length === 0) {
      res.json({ success: true, message: 'No ungraded submissions found.' });
      return;
    }

    const results = [];
    let successes = 0;
    
    // Evaluate sequentially to avoid API rate limits
    for (const sub of submissions) {
      try {
        const evalResult = await evaluateSubmission(sub.id);
        results.push({ submissionId: sub.id, success: true, score: evalResult.score });
        successes++;
      } catch (e: any) {
        results.push({ submissionId: sub.id, success: false, error: e.message });
      }
    }

    res.json({ 
      success: true, 
      message: `Successfully graded ${successes}/${submissions.length} submissions.`,
      data: results 
    });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Bulk evaluation failed' });
  }
};

export const getSubmissionEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const submission = await loadSubmissionScoped(req, req.params.submissionId);
    const evaluation = await prisma.submissionEvaluation.findUnique({
      where: { submissionId: submission.id },
      include: { submission: true },
    });
    
    let studentText = '';
    if (evaluation?.submission) {
      studentText = await extractTextFromFile(evaluation.submission.fileUrl, evaluation.submission.fileType);
    }
    
    const config = await prisma.assignmentGradingConfig.findUnique({
      where: { assignmentId: submission.assignmentId },
      include: { rubric: { include: { criteria: true } } },
    });
    const rubricCriteria = config?.rubric?.criteria || [];
    
    res.json({ success: true, data: { ...evaluation, studentText, rubricCriteria } });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to fetch evaluation' });
  }
};

export const manualGradeOverride = async (req: Request, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.submissionId || req.params.id;
    const submission = await loadSubmissionScoped(req, submissionId);
    await assertCanGradeAssignment(req, submission.assignmentId);
    const { overrideScore, reason, teacherFeedback, criteriaGrades } = req.body;
    const teacherId = getRequestUserId(req);

    const result = await overrideEvaluation(submission.id, {
      overrideScore: Number(overrideScore),
      reason,
      teacherFeedback,
      criteriaGrades,
      teacherId,
    });

    // Record Grade Override Audit Event
    await AuditService.logAuditEvent({
      userId: teacherId,
      organizationId: submission.organizationId,
      action: 'GRADE_OVERRIDE',
      entity: 'StudentSubmission',
      entityId: submission.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('user-agent') || 'unknown',
      metadata: {
        previousScore: result.previousScore,
        newScore: result.newScore,
        reason: reason || 'Manual teacher grade override',
        teacherFeedback: teacherFeedback || '',
      },
    });

    res.json({ success: true, data: result.evaluation });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Override failed' });
  }
};

export const listSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    requireRequestOrgId(req);

    const submissions = await prisma.studentSubmission.findMany({
      where: { assignmentId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'GRADED', 'RESULT_PUBLISHED'] } },
      include: { evaluations: true },
      orderBy: { submittedAt: 'desc' },
    });

    const studentIds = Array.from(new Set(submissions.map((s) => s.studentId)));
    const users = studentIds.length
      ? await prisma.user.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    const submissionsWithUsers = submissions.map((sub) => {
      const user = userMap.get(sub.studentId);
      return {
        ...sub,
        studentName: user ? `${user.firstName} ${user.lastName}`.trim() : sub.studentId,
      };
    });

    res.json({ success: true, data: submissionsWithUsers });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to list submissions' });
  }
};

export const uploadSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    await assertCanGradeAssignment(req, assignmentId);
    const orgId = requireRequestOrgId(req);
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files?.length) {
      res.status(400).json({ success: false, error: 'At least one answer sheet is required' });
      return;
    }
    const [config, generatedPaper] = await Promise.all([
      prisma.assignmentGradingConfig.findUnique({ where: { assignmentId } }),
      getPaper(assignmentId).catch(() => null),
    ]);
    const canEvaluate = Boolean(config && (config.answerKeyText.trim() || config.questionPaperText?.trim() || generatedPaper));
    const uploaded = [];
    for (const file of files) {
      // A stable filename-derived identity lets a corrected scan replace a previous upload.
      const stem = path.basename(file.originalname, path.extname(file.originalname)).trim().toLowerCase();
      const studentId = `uploaded:${stem || file.filename}`;
      const submission = await prisma.studentSubmission.upsert({
        where: { assignmentId_studentId: { assignmentId, studentId } },
        create: { assignmentId, studentId, organizationId: orgId, fileUrl: file.path, fileType: file.mimetype, status: 'SUBMITTED' },
        update: { fileUrl: file.path, fileType: file.mimetype, status: 'SUBMITTED', submittedAt: new Date() },
      });
      if (config?.autoEvaluate && canEvaluate) {
        try {
          const evaluation = await evaluateSubmission(submission.id);
          uploaded.push({ submission, evaluation, evaluated: true });
        } catch (error) {
          uploaded.push({ submission, evaluated: false, error: error instanceof Error ? error.message : 'Evaluation failed' });
        }
      } else {
        uploaded.push({ submission, evaluated: false, pendingReason: canEvaluate ? 'Automatic evaluation is disabled' : 'Upload a question paper or enter an answer key before evaluating' });
      }
    }

    res.status(201).json({ success: true, data: uploaded });
  } catch (err) {
    if (handleAccessError(res, err)) return;
    res.status(500).json({ success: false, error: 'Failed to upload submission' });
  }
};

export const createRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, criteria } = req.body;
    const authorId = getRequestUserId(req);
    const organizationId = requireRequestOrgId(req);

    const rubric = await prisma.rubric.create({
      data: {
        title,
        description,
        authorId,
        organizationId,
        criteria: {
          create: criteria.map((c: any) => ({
            name: c.name,
            description: c.description,
            maxMarks: Number(c.maxMarks) || 10,
          })),
        },
      },
      include: { criteria: true },
    });

    res.status(201).json({ success: true, data: rubric });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create rubric' });
  }
};

export const listRubrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const rubrics = await prisma.rubric.findMany({
      where: { organizationId },
      include: { criteria: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: rubrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list rubrics' });
  }
};

export const updateRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const { rubricId } = req.params;
    const { title, description, criteria } = req.body;
    
    // Ensure it belongs to org
    const existing = await prisma.rubric.findFirst({ where: { id: rubricId, organizationId } });
    if (!existing) {
       res.status(404).json({ success: false, error: 'Rubric not found' });
       return;
    }

    const updated = await prisma.rubric.update({
      where: { id: rubricId },
      data: {
        title,
        description,
        criteria: {
          deleteMany: {},
          create: criteria.map((c: any) => ({
            name: c.name,
            description: c.description,
            maxMarks: Number(c.maxMarks) || 10,
          })),
        }
      },
      include: { criteria: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update rubric' });
  }
};

export const deleteRubric = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizationId = requireRequestOrgId(req);
    const { rubricId } = req.params;

    const existing = await prisma.rubric.findFirst({ where: { id: rubricId, organizationId } });
    if (!existing) {
       res.status(404).json({ success: false, error: 'Rubric not found' });
       return;
    }

    await prisma.rubric.delete({ where: { id: rubricId } });
    res.json({ success: true, message: 'Rubric deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete rubric' });
  }
};
