import { SystemRole } from '@prisma/client';
import prisma from '../../config/prisma';
import { logger } from '../../utils/logger';

export type StorageAction =
  | 'file:read'
  | 'file:create'
  | 'file:update'
  | 'file:delete'
  | 'file:moderate';

export interface StorageUserContext {
  id: string;
  role: SystemRole | string;
  organizationId?: string | null;
}

export interface StoredFileRecord {
  id: string;
  key: string;
  scope: string;
  ownerId: string;
  organizationId?: string | null;
  entityId?: string | null;
  isPublic?: boolean;
}

export class StorageRbacService {
  /**
   * Evaluates whether a user can perform an action on a target file.
   */
  static async canAccessFile(
    user: StorageUserContext,
    action: StorageAction,
    file: StoredFileRecord
  ): Promise<boolean> {
    if (!user || !user.id) return false;

    // 1. SUPER_ADMIN has system-wide unrestricted access
    if (user.role === 'SUPER_ADMIN' || user.role === SystemRole.SUPER_ADMIN) {
      return true;
    }

    // 2. Public files can be read by any authenticated user
    if (action === 'file:read' && file.isPublic) {
      return true;
    }

    // 3. Resource ownership: users can read, update, or delete their own files
    const isOwner = file.ownerId === user.id;
    if (isOwner) {
      return true;
    }

    // 4. Multi-tenancy check: non-super-admins cannot access files from another organization
    if (user.organizationId && file.organizationId && user.organizationId !== file.organizationId) {
      logger.warn({
        userId: user.id,
        userOrg: user.organizationId,
        fileOrg: file.organizationId,
        fileId: file.id,
      }, '[StorageRBAC] Cross-tenant access denied');
      return false;
    }

    // 5. ADMIN role checks
    if (user.role === 'ADMIN' || user.role === SystemRole.ADMIN) {
      // Admins have management, read, delete, and moderation rights within their organization
      return true;
    }

    // 6. TEACHER role checks
    if (user.role === 'TEACHER' || user.role === SystemRole.TEACHER) {
      // Teachers can read course materials, syllabus, blogs, and assignments in their org
      if (action === 'file:read') {
        const readableScopes = ['courses', 'syllabus', 'assignments', 'blogs', 'documents'];
        if (readableScopes.includes(file.scope.toLowerCase())) {
          return true;
        }

        // Check if file is a student submission for teacher's assignment/course
        if (file.scope.toLowerCase() === 'students' && file.entityId) {
          const assignment = await prisma.assignment.findFirst({
            where: {
              id: file.entityId,
              createdById: user.id,
            },
          });
          if (assignment) return true;
        }
      }

      // Teachers can create/manage files in course/syllabus/assignment scopes if authorized
      if (['courses', 'syllabus', 'assignments', 'blogs'].includes(file.scope.toLowerCase())) {
        if (isOwner) return true;
      }
    }

    // 7. STUDENT role checks
    if (user.role === 'STUDENT' || user.role === SystemRole.STUDENT) {
      if (action === 'file:read') {
        // Students can access published course materials, syllabus, and public blog attachments
        if (['syllabus', 'courses', 'blogs'].includes(file.scope.toLowerCase())) {
          return true;
        }

        // Students can read assignment files assigned to their class
        if (file.scope.toLowerCase() === 'assignments' && file.entityId) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: user.id,
            },
          });
          if (enrollment) return true;
        }
      }

      // Students cannot modify, delete, or moderate files they don't own
      return false;
    }

    return false;
  }

  /**
   * Verifies if a user has permission to upload a file in the requested scope.
   */
  static canUploadToScope(
    user: StorageUserContext,
    scope: string,
    entityId: string
  ): boolean {
    if (!user || !user.id) return false;

    // Super admins can upload anywhere
    if (user.role === 'SUPER_ADMIN' || user.role === SystemRole.SUPER_ADMIN) {
      return true;
    }

    // Admins can upload to all scopes in their organization
    if (user.role === 'ADMIN' || user.role === SystemRole.ADMIN) {
      return true;
    }

    // Teachers can upload to teachers, syllabus, courses, assignments, blogs, documents
    if (user.role === 'TEACHER' || user.role === SystemRole.TEACHER) {
      const allowedScopes = ['teachers', 'syllabus', 'courses', 'assignments', 'blogs', 'documents'];
      if (allowedScopes.includes(scope.toLowerCase())) {
        if (scope.toLowerCase() === 'teachers' && entityId !== user.id) {
          return false; // Can only upload to own teacher directory
        }
        return true;
      }
      return false;
    }

    // Students can upload to students (own directory), assignments (submissions), and documents
    if (user.role === 'STUDENT' || user.role === SystemRole.STUDENT) {
      const allowedScopes = ['students', 'assignments', 'documents'];
      if (allowedScopes.includes(scope.toLowerCase())) {
        if (scope.toLowerCase() === 'students' && entityId !== user.id) {
          return false; // Cannot upload to another student's folder
        }
        return true;
      }
      return false;
    }

    return false;
  }
}
