import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp'];

const ALLOWED_TYPES: Record<string, string[]> = {
  '.pdf': ['application/pdf', 'application/x-pdf', 'application/octet-stream', 'binary/octet-stream'],
  '.txt': ['text/plain', 'text/x-plain', 'text/markdown', 'text/csv', 'application/octet-stream'],
  '.md': ['text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ],
  '.doc': ['application/msword', 'application/octet-stream'],
  '.png': ['image/png', 'image/x-png', 'application/octet-stream'],
  '.jpg': ['image/jpeg', 'image/pjpeg', 'application/octet-stream'],
  '.jpeg': ['image/jpeg', 'image/pjpeg', 'application/octet-stream'],
  '.webp': ['image/webp', 'application/octet-stream'],
};

function fileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Validate extension is known
  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    logger.warn({
      userId: req.user?.id || 'anonymous',
      fileName: file.originalname,
      mime,
      ext: fileExt,
    }, '[Upload] Rejected file — extension not allowed');
    cb(new Error(`File type not allowed. Supported extensions: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  const allowedMimes = ALLOWED_TYPES[fileExt];
  // Allow if mime matches known list or if mime is generic/empty but extension is verified
  const allowed = !allowedMimes || allowedMimes.length === 0 || allowedMimes.includes(mime) || !mime;

  if (allowed) {
    cb(null, true);
  } else {
    logger.warn({
      userId: req.user?.id || 'anonymous',
      fileName: file.originalname,
      mime,
      ext: fileExt,
    }, '[Upload] Rejected file — mime mismatch');
    cb(new Error(`File type not allowed. Mime ${mime} does not match extension ${fileExt}`));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB hard limit
    files: 10,
  },
});
