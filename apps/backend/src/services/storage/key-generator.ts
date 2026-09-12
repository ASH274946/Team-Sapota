import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export type StorageScope =
  | 'students'
  | 'teachers'
  | 'admins'
  | 'blogs'
  | 'courses'
  | 'syllabus'
  | 'assignments'
  | 'documents'
  | 'question-papers'
  | 'quizzes'
  | 'lesson-plans'
  | 'evaluations'
  | 'knowledge'
  | 'uploads';

export interface KeyGenerationOptions {
  scope: StorageScope;
  entityId: string; // studentId, teacherId, courseId, blogId, assignmentId, etc.
  filename: string;
  fileId?: string;
  subFolder?: string;
}

/**
 * Sanitizes a filename to remove dangerous characters, spaces, and path traversals.
 */
export function sanitizeFilename(filename: string): string {
  let base = path.basename(filename);
  let ext = path.extname(base).toLowerCase();

  // If filename starts with a dot and has no further ext (e.g. '.txt')
  if (!ext && base.startsWith('.') && base.length > 1) {
    ext = `.${base.slice(1).toLowerCase()}`;
    base = '';
  }

  const nameWithoutExt = ext ? base.slice(0, base.length - ext.length) : base;
  
  // Replace spaces and special characters with hyphens
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const safeName = cleanName || 'file';
  return ext ? `${safeName}${ext}` : safeName;
}

/**
 * Generates an isolated, collision-safe, structured R2 object key.
 * Format: {scope}/{entityId}/{subFolder?}/{fileId}-{sanitizedFilename}
 */
export function generateR2ObjectKey(options: KeyGenerationOptions): { key: string; fileId: string } {
  const { scope, entityId, filename, subFolder } = options;
  const fileId = options.fileId || uuidv4();
  const cleanName = sanitizeFilename(filename);

  // Validate entityId to prevent directory traversal
  const sanitizedEntityId = entityId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedEntityId) {
    throw new Error(`Invalid entity ID provided for storage scope: ${scope}`);
  }

  const parts = [scope, sanitizedEntityId];
  if (subFolder) {
    const cleanSub = subFolder.replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanSub) parts.push(cleanSub);
  }
  parts.push(`${fileId}-${cleanName}`);

  const key = parts.join('/');
  return { key, fileId };
}

/**
 * Parses an R2 object key into its constituent parts.
 */
export function parseR2ObjectKey(key: string): {
  scope: StorageScope | string;
  entityId: string;
  fileId: string;
  filename: string;
} | null {
  const parts = key.split('/');
  if (parts.length < 3) return null;

  const scope = parts[0] as StorageScope;
  const entityId = parts[1];
  const fileComponent = parts[parts.length - 1];

  // If UUID (36 chars with 4 dashes), match UUID
  const uuidMatch = fileComponent.match(/^([0-9a-fA-F-]{36})-(.*)$/);
  if (uuidMatch) {
    return {
      scope,
      entityId,
      fileId: uuidMatch[1],
      filename: uuidMatch[2],
    };
  }

  // Fallback for custom fileId prefixes (e.g. fid-333-name.pdf)
  const firstHyphen = fileComponent.indexOf('-');
  if (firstHyphen === -1) {
    return { scope, entityId, fileId: fileComponent, filename: fileComponent };
  }

  // Check if there is another hyphen before the extension
  const lastHyphen = fileComponent.lastIndexOf('-');
  const fileId = fileComponent.slice(0, lastHyphen > 0 ? lastHyphen : firstHyphen);
  const filename = fileComponent.slice((lastHyphen > 0 ? lastHyphen : firstHyphen) + 1);

  return { scope, entityId, fileId, filename };
}
