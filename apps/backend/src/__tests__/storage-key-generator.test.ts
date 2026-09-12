import { describe, it, expect } from 'vitest';
import {
  generateR2ObjectKey,
  parseR2ObjectKey,
  sanitizeFilename,
} from '../services/storage/key-generator';

describe('Storage Key Generator & Sanitizer', () => {
  describe('sanitizeFilename', () => {
    it('cleans special characters, spaces, and path traversals', () => {
      expect(sanitizeFilename('../../../dangerous file #1 (draft).pdf')).toBe('dangerous-file-1-draft.pdf');
      expect(sanitizeFilename('my cool image.PNG')).toBe('my-cool-image.png');
      expect(sanitizeFilename('syllabus_2026---final.docx')).toBe('syllabus_2026-final.docx');
    });

    it('handles empty or weird filenames safely', () => {
      expect(sanitizeFilename('.txt')).toBe('file.txt');
      expect(sanitizeFilename('$$$$.pdf')).toBe('file.pdf');
    });
  });

  describe('generateR2ObjectKey', () => {
    it('generates structured isolated keys across all scopes', () => {
      const studentKey = generateR2ObjectKey({
        scope: 'students',
        entityId: 'student_123',
        filename: 'My Math Homework.pdf',
        fileId: 'fid-111',
      });
      expect(studentKey.key).toBe('students/student_123/fid-111-my-math-homework.pdf');
      expect(studentKey.fileId).toBe('fid-111');

      const teacherKey = generateR2ObjectKey({
        scope: 'teachers',
        entityId: 'teacher_abc',
        filename: 'Unit 1 Lesson Plan.docx',
        fileId: 'fid-222',
      });
      expect(teacherKey.key).toBe('teachers/teacher_abc/fid-222-unit-1-lesson-plan.docx');

      const syllabusKey = generateR2ObjectKey({
        scope: 'syllabus',
        entityId: 'course_cse101',
        filename: 'OS_Syllabus.pdf',
        fileId: 'fid-333',
        subFolder: '2026',
      });
      expect(syllabusKey.key).toBe('syllabus/course_cse101/2026/fid-333-os_syllabus.pdf');
    });

    it('throws when entity ID is empty or invalid', () => {
      expect(() => {
        generateR2ObjectKey({
          scope: 'students',
          entityId: '   ///   ',
          filename: 'test.pdf',
        });
      }).toThrow('Invalid entity ID provided for storage scope: students');
    });
  });

  describe('parseR2ObjectKey', () => {
    it('correctly parses constituent parts of R2 key', () => {
      const parsed = parseR2ObjectKey('syllabus/course_cse101/fid-333-os_syllabus.pdf');
      expect(parsed).toEqual({
        scope: 'syllabus',
        entityId: 'course_cse101',
        fileId: 'fid-333',
        filename: 'os_syllabus.pdf',
      });
    });

    it('returns null for malformed keys', () => {
      expect(parseR2ObjectKey('invalid-key')).toBeNull();
    });
  });
});
