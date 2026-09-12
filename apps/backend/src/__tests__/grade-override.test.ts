import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '../config/prisma';
import { overrideEvaluation } from '../services/grader.service';
import { AuditService } from '../services/audit.service';

vi.mock('../config/prisma', () => ({
  default: {
    submissionEvaluation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentSubmission: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../api/common/cache', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

describe('Teacher Grade Override & Audit Logging (VID-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update SubmissionEvaluation with isOverridden=true, reason, and teacherFeedback', async () => {
    const mockExistingEval = {
      id: 'eval-1',
      submissionId: 'sub-123',
      score: 75,
      totalMarks: 100,
      generalFeedback: 'Good attempt',
      criteriaGrades: [
        { criteriaId: 'crit-1', name: 'Logic', score: 35, explanation: 'Solid logic' },
        { criteriaId: 'crit-2', name: 'Syntax', score: 40, explanation: 'Minor syntax error' },
      ],
    };

    const mockUpdatedEval = {
      ...mockExistingEval,
      score: 90,
      isOverridden: true,
      overrideReason: 'Partial credit awarded for effort on syntax',
      teacherFeedback: 'Great improvement on overall structure!',
      overriddenBy: 'teacher-456',
      overriddenAt: new Date('2026-08-12T10:00:00Z'),
    };

    vi.mocked(prisma.submissionEvaluation.findUnique).mockResolvedValue(mockExistingEval as any);
    vi.mocked(prisma.submissionEvaluation.update).mockResolvedValue(mockUpdatedEval as any);
    vi.mocked(prisma.studentSubmission.update).mockResolvedValue({ id: 'sub-123', status: 'GRADED' } as any);
    vi.mocked(prisma.studentSubmission.findUnique).mockResolvedValue({ studentId: 'student-789' } as any);

    const result = await overrideEvaluation('sub-123', {
      overrideScore: 90,
      reason: 'Partial credit awarded for effort on syntax',
      teacherFeedback: 'Great improvement on overall structure!',
      teacherId: 'teacher-456',
    });

    expect(result.previousScore).toBe(75);
    expect(result.newScore).toBe(90);
    expect(result.evaluation.isOverridden).toBe(true);
    expect(result.evaluation.overrideReason).toBe('Partial credit awarded for effort on syntax');
    expect(result.evaluation.teacherFeedback).toBe('Great improvement on overall structure!');

    expect(prisma.submissionEvaluation.update).toHaveBeenCalledWith({
      where: { submissionId: 'sub-123' },
      data: expect.objectContaining({
        score: 90,
        isOverridden: true,
        overrideReason: 'Partial credit awarded for effort on syntax',
        teacherFeedback: 'Great improvement on overall structure!',
        overriddenBy: 'teacher-456',
      }),
    });
  });

  it('should log audit event using AuditService.logAuditEvent', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: 'audit-1',
      userId: 'teacher-456',
      action: 'GRADE_OVERRIDE',
      entity: 'StudentSubmission',
      entityId: 'sub-123',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      metadata: { previousScore: 70, newScore: 85, reason: 'Curved score' },
      createdAt: new Date(),
    } as any);

    await AuditService.logAuditEvent({
      userId: 'teacher-456',
      organizationId: 'org-1',
      action: 'GRADE_OVERRIDE',
      entity: 'StudentSubmission',
      entityId: 'sub-123',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      metadata: {
        previousScore: 70,
        newScore: 85,
        reason: 'Curved score',
        teacherFeedback: 'Nice work!',
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'teacher-456',
        organizationId: 'org-1',
        action: 'GRADE_OVERRIDE',
        entity: 'StudentSubmission',
        entityId: 'sub-123',
        metadata: {
          previousScore: 70,
          newScore: 85,
          reason: 'Curved score',
          teacherFeedback: 'Nice work!',
        },
      }),
    });
  });
});
