import { describe, it, expect, vi } from 'vitest';
import type { Request } from 'express';
import { hasPermission } from '../security/roles';
import { PERMISSIONS } from '../security/permissions';
import {
  normalizeRole,
  isFacultyRole,
  isStudentRole,
  isAdminRole,
} from '../security/request-context';
import {
  assertFacultyOwnsAssignment,
  AccessDeniedError,
} from '../security/assignment-access';

vi.mock('../config/prisma', () => {
  return {
    default: {
      enrollment: {
        findFirst: vi.fn().mockImplementation(async ({ where }) => {
          // If the student matches org-a, return an enrollment, otherwise return null
          if (where.studentId === 'student-1' && where.section?.classroom?.organizationId === 'org-a') {
            return { id: 'enroll-1' };
          }
          return null;
        }),
      },
      user: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === 'student-1') {
            return { organizationId: 'org-a' };
          }
          if (where.id === 'student-other') {
            return { organizationId: 'org-b' };
          }
          return null;
        }),
      },
    },
  };
});

function mockReq(overrides: Partial<NonNullable<Request['user']>> = {}): Request {
  return {
    user: {
      id: 'student-1',
      email: 'test@example.com',
      role: 'TEACHER',
      organizationId: 'org-a',
      activeOrganizationId: 'org-a',
      ...overrides,
    },
    body: { _requireOrganizationScope: 'org-a' },
  } as Request;
}

describe('RBAC — role permissions', () => {
  it('SUPER_ADMIN has all permissions', () => {
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.MANAGE_SYSTEM)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.CREATE_ASSIGNMENT)).toBe(true);
    expect(hasPermission('SUPER_ADMIN', PERMISSIONS.GRADE_ASSESSMENT)).toBe(true);
  });

  it('ADMIN can approve/publish but not create assignments', () => {
    expect(hasPermission('ADMIN', PERMISSIONS.APPROVE_PAPER)).toBe(true);
    expect(hasPermission('ADMIN', PERMISSIONS.PUBLISH_PAPER)).toBe(true);
    expect(hasPermission('ADMIN', PERMISSIONS.CREATE_ASSIGNMENT)).toBe(false);
    expect(hasPermission('ADMIN', PERMISSIONS.GRADE_ASSESSMENT)).toBe(false);
  });

  it('TEACHER can create and grade assignments', () => {
    expect(hasPermission('TEACHER', PERMISSIONS.CREATE_ASSIGNMENT)).toBe(true);
    expect(hasPermission('TEACHER', PERMISSIONS.GENERATE_PAPER)).toBe(true);
    expect(hasPermission('TEACHER', PERMISSIONS.GRADE_ASSESSMENT)).toBe(true);
    expect(hasPermission('TEACHER', PERMISSIONS.APPROVE_PAPER)).toBe(false);
  });

  it('FACULTY alias maps to TEACHER permissions', () => {
    expect(hasPermission('FACULTY', PERMISSIONS.CREATE_ASSIGNMENT)).toBe(true);
    expect(hasPermission('FACULTY', PERMISSIONS.VIEW_PAPER)).toBe(true);
  });

  it('STUDENT can submit and view results and published assignments', () => {
    expect(hasPermission('STUDENT', PERMISSIONS.SUBMIT_ASSESSMENT)).toBe(true);
    expect(hasPermission('STUDENT', PERMISSIONS.VIEW_RESULTS)).toBe(true);
    expect(hasPermission('STUDENT', PERMISSIONS.VIEW_ASSIGNMENT)).toBe(true);
    expect(hasPermission('STUDENT', PERMISSIONS.CREATE_ASSIGNMENT)).toBe(false);

    expect(hasPermission('STUDENT', PERMISSIONS.GRADE_ASSESSMENT)).toBe(false);
  });

  it('unknown role has no permissions', () => {
    expect(hasPermission('GUEST', PERMISSIONS.VIEW_ASSIGNMENT)).toBe(false);
  });
});

describe('RBAC — request context helpers', () => {
  it('normalizes FACULTY to TEACHER', () => {
    expect(normalizeRole('FACULTY')).toBe('TEACHER');
    expect(normalizeRole('faculty')).toBe('TEACHER');
  });

  it('identifies role categories', () => {
    expect(isFacultyRole('TEACHER')).toBe(true);
    expect(isFacultyRole('FACULTY')).toBe(true);
    expect(isFacultyRole('ADMIN')).toBe(false);
    expect(isStudentRole('STUDENT')).toBe(true);
    expect(isAdminRole('ADMIN')).toBe(true);
    expect(isAdminRole('SUPER_ADMIN')).toBe(true);
  });
});

describe('RBAC — assignment ownership', () => {
  const baseAssignment = {
    id: 'a1',
    title: 'Test',
    subject: 'Math',
    organizationId: 'org-a',
    createdById: 'user-1',
  } as any;

  it('allows creator faculty to modify own assignment', () => {
    const req = mockReq({ id: 'user-1', role: 'TEACHER' });
    expect(() => assertFacultyOwnsAssignment(req, baseAssignment)).not.toThrow();
  });

  it('denies other faculty from modifying assignment they did not create', () => {
    const req = mockReq({ id: 'user-2', role: 'TEACHER' });
    expect(() => assertFacultyOwnsAssignment(req, baseAssignment)).toThrow(AccessDeniedError);
  });

  it('allows admin to bypass ownership', () => {
    const req = mockReq({ id: 'admin-1', role: 'ADMIN' });
    expect(() => assertFacultyOwnsAssignment(req, baseAssignment)).not.toThrow();
  });

  it('allows any faculty when createdById is null (legacy assignments)', () => {
    const legacy = { ...baseAssignment, createdById: null };
    const req = mockReq({ id: 'user-2', role: 'TEACHER' });
    expect(() => assertFacultyOwnsAssignment(req, legacy)).not.toThrow();
  });
});

describe('RBAC — student tenant isolation & assignment visibility', () => {
  const publishedAssignment = {
    id: 'a1',
    status: 'PUBLISHED',
    organizationId: 'org-a',
  } as any;

  const draftAssignment = {
    id: 'a2',
    status: 'DRAFT',
    organizationId: 'org-a',
  } as any;

  it('denies students from viewing draft assignments', async () => {
    const req = mockReq({ id: 'student-1', role: 'STUDENT', organizationId: 'org-a' });
    const { assertStudentCanViewAssignment } = await import('../security/assignment-access');
    await expect(assertStudentCanViewAssignment(req, draftAssignment)).rejects.toThrow(AccessDeniedError);
  });

  it('denies students from other organizations from viewing published assignments', async () => {
    const req = mockReq({ id: 'student-other', role: 'STUDENT', organizationId: 'org-b', activeOrganizationId: 'org-b' });
    const { assertStudentCanViewAssignment } = await import('../security/assignment-access');
    await expect(assertStudentCanViewAssignment(req, publishedAssignment)).rejects.toThrow(AccessDeniedError);
  });
});
