import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageRbacService, StorageUserContext, StoredFileRecord } from '../services/storage/storage-rbac.service';

vi.mock('../config/prisma', () => ({
  default: {
    assignment: {
      findFirst: vi.fn(),
    },
    enrollment: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Storage RBAC Service', () => {
  const superAdminUser: StorageUserContext = { id: 'sa_1', role: 'SUPER_ADMIN', organizationId: 'org_1' };
  const adminUser: StorageUserContext = { id: 'admin_1', role: 'ADMIN', organizationId: 'org_1' };
  const teacherUser: StorageUserContext = { id: 'teacher_1', role: 'TEACHER', organizationId: 'org_1' };
  const studentUser1: StorageUserContext = { id: 'student_1', role: 'STUDENT', organizationId: 'org_1' };
  const studentUser2: StorageUserContext = { id: 'student_2', role: 'STUDENT', organizationId: 'org_1' };
  const otherOrgUser: StorageUserContext = { id: 'teacher_2', role: 'TEACHER', organizationId: 'org_2' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canAccessFile', () => {
    const student1PrivateFile: StoredFileRecord = {
      id: 'f1',
      key: 'students/student_1/f1-homework.pdf',
      scope: 'students',
      ownerId: 'student_1',
      organizationId: 'org_1',
      isPublic: false,
    };

    const courseSyllabusFile: StoredFileRecord = {
      id: 'f2',
      key: 'syllabus/course_1/f2-syllabus.pdf',
      scope: 'syllabus',
      ownerId: 'teacher_1',
      organizationId: 'org_1',
      isPublic: false,
    };

    it('SUPER_ADMIN has unrestricted access to any file', async () => {
      const allowed = await StorageRbacService.canAccessFile(superAdminUser, 'file:read', student1PrivateFile);
      expect(allowed).toBe(true);

      const deleteAllowed = await StorageRbacService.canAccessFile(superAdminUser, 'file:delete', student1PrivateFile);
      expect(deleteAllowed).toBe(true);
    });

    it('Denies access if user is from a different organization', async () => {
      const allowed = await StorageRbacService.canAccessFile(otherOrgUser, 'file:read', student1PrivateFile);
      expect(allowed).toBe(false);
    });

    it('Owner can access and delete their own file', async () => {
      const readAllowed = await StorageRbacService.canAccessFile(studentUser1, 'file:read', student1PrivateFile);
      expect(readAllowed).toBe(true);

      const deleteAllowed = await StorageRbacService.canAccessFile(studentUser1, 'file:delete', student1PrivateFile);
      expect(deleteAllowed).toBe(true);
    });

    it('Student CANNOT access another student private file', async () => {
      const allowed = await StorageRbacService.canAccessFile(studentUser2, 'file:read', student1PrivateFile);
      expect(allowed).toBe(false);
    });

    it('Student CAN read course syllabus file within same organization', async () => {
      const allowed = await StorageRbacService.canAccessFile(studentUser1, 'file:read', courseSyllabusFile);
      expect(allowed).toBe(true);
    });

    it('Student CANNOT delete course syllabus file', async () => {
      const allowed = await StorageRbacService.canAccessFile(studentUser1, 'file:delete', courseSyllabusFile);
      expect(allowed).toBe(false);
    });

    it('Admin can manage and moderate files within their organization', async () => {
      const allowed = await StorageRbacService.canAccessFile(adminUser, 'file:moderate', student1PrivateFile);
      expect(allowed).toBe(true);
    });
  });

  describe('canUploadToScope', () => {
    it('Super admin and admin can upload to any scope in organization', () => {
      expect(StorageRbacService.canUploadToScope(superAdminUser, 'syllabus', 'course_1')).toBe(true);
      expect(StorageRbacService.canUploadToScope(adminUser, 'teachers', 'teacher_1')).toBe(true);
    });

    it('Teacher can upload to course and syllabus scopes', () => {
      expect(StorageRbacService.canUploadToScope(teacherUser, 'syllabus', 'course_1')).toBe(true);
      expect(StorageRbacService.canUploadToScope(teacherUser, 'courses', 'course_1')).toBe(true);
      expect(StorageRbacService.canUploadToScope(teacherUser, 'teachers', 'teacher_1')).toBe(true);
      expect(StorageRbacService.canUploadToScope(teacherUser, 'teachers', 'other_teacher')).toBe(false);
    });

    it('Student can only upload to their own student folder or assignments', () => {
      expect(StorageRbacService.canUploadToScope(studentUser1, 'students', 'student_1')).toBe(true);
      expect(StorageRbacService.canUploadToScope(studentUser1, 'students', 'student_2')).toBe(false);
      expect(StorageRbacService.canUploadToScope(studentUser1, 'syllabus', 'course_1')).toBe(false);
      expect(StorageRbacService.canUploadToScope(studentUser1, 'teachers', 'teacher_1')).toBe(false);
    });
  });
});
