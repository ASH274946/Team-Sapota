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

// Explicitly blocked dangerous executable files
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.vbs', '.com', '.scr', '.jar', '.bin', '.pif', '.cpl'
];

// Comprehensive list of educational, document, presentation, media, and archive extensions
const ALLOWED_EXTENSIONS = [
  // Documents & Text
  '.pdf', '.txt', '.md', '.markdown', '.docx', '.doc', '.odt', '.rtf', '.tex', '.epub', '.html', '.htm', '.csv', '.tsv', '.json',
  // Presentations & Spreadsheets
  '.ppt', '.pptx', '.odp', '.key', '.xls', '.xlsx', '.ods',
  // Images
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.tiff', '.ico',
  // Audio & Video
  '.mp4', '.webm', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.m4a', '.aac', '.flac',
  // Archives
  '.zip', '.rar', '.tar', '.gz', '.7z'
];

function fileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const fileExt = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // 1. Immediately reject dangerous executable extensions
  if (BLOCKED_EXTENSIONS.includes(fileExt)) {
    logger.warn({
      userId: req.user?.id || 'anonymous',
      fileName: file.originalname,
      mime,
      ext: fileExt,
    }, '[Upload] Rejected file — blocked executable extension');
    cb(new Error(`Security violation: Executable files (${fileExt}) are strictly prohibited.`));
    return;
  }

  // 2. Validate known safe extension or accept generic files if extension is in ALLOWED_EXTENSIONS
  if (ALLOWED_EXTENSIONS.includes(fileExt) || !fileExt) {
    cb(null, true);
    return;
  }

  logger.warn({
    userId: req.user?.id || 'anonymous',
    fileName: file.originalname,
    mime,
    ext: fileExt,
  }, '[Upload] Rejected file — extension not in allowed list');
  
  cb(new Error(`File format ${fileExt || 'unknown'} is not supported. Please upload standard document, presentation, media, or archive files.`));
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10,
  },
});
