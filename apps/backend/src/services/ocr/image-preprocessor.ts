import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface PreprocessedImage {
  hash: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
  isLikelyPhonePhoto: boolean;
  orientationHint: 'portrait' | 'landscape' | 'square';
  enhancementPromptHints: string[];
}

/**
 * Inspects buffer magic numbers to reliably detect image MIME type.
 */
export function detectImageMimeType(buffer: Buffer, fallbackMime?: string): string {
  if (!buffer || buffer.length < 4) {
    return fallbackMime || 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return 'image/gif';
  }

  // BMP: "BM"
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return 'image/bmp';
  }

  // TIFF: "II*\0" (little-endian) or "MM\0*" (big-endian)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
  ) {
    return 'image/tiff';
  }

  // HEIC / HEIF
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
      return 'image/heic';
    }
  }

  return fallbackMime || 'image/jpeg';
}

/**
 * Computes deterministic SHA-256 hash for image caching and deduplication.
 */
export function computeImageHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Fast basic dimension extractor from image headers without heavy binary dependencies.
 */
export function extractBasicDimensions(buffer: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime === 'image/png' && buffer.length >= 24) {
      // PNG IHDR chunk holds width at offset 16 (4 bytes) and height at offset 20 (4 bytes)
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (mime === 'image/jpeg') {
      // Search for SOF0 (0xFF, 0xC0) or SOF2 (0xFF, 0xC2) markers
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xff) {
          const marker = buffer[offset + 1];
          // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
          if (
            (marker >= 0xc0 && marker <= 0xc3) ||
            (marker >= 0xc5 && marker <= 0xc7) ||
            (marker >= 0xc9 && marker <= 0xcb) ||
            (marker >= 0xcd && marker <= 0xcf)
          ) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        } else {
          offset++;
        }
      }
    }
  } catch (err: any) {
    logger.debug({ error: err.message }, '[extractBasicDimensions] Could not read image dimensions from header');
  }

  return null;
}

/**
 * Analyzes and normalizes an image buffer specifically for phone-camera and handwriting processing.
 */
export function preprocessImageForOcr(
  imageBuffer: Buffer,
  originalFilename?: string,
  fallbackMime?: string
): PreprocessedImage {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Cannot preprocess an empty image buffer');
  }

  const mimeType = detectImageMimeType(imageBuffer, fallbackMime);
  const hash = computeImageHash(imageBuffer);
  const dims = extractBasicDimensions(imageBuffer, mimeType);

  let orientationHint: 'portrait' | 'landscape' | 'square' = 'portrait';
  let isLikelyPhonePhoto = false;

  if (dims) {
    const ratio = dims.width / dims.height;
    if (ratio > 1.15) {
      orientationHint = 'landscape';
    } else if (ratio < 0.85) {
      orientationHint = 'portrait';
    } else {
      orientationHint = 'square';
    }

    // Common phone camera ratios (4:3, 16:9, 19.5:9) or resolutions > 2MP
    if ((dims.width >= 1200 || dims.height >= 1200) && imageBuffer.length > 200_000) {
      isLikelyPhonePhoto = true;
    }
  } else {
    // If buffer is > 300KB, it's typically a direct camera photo
    isLikelyPhonePhoto = imageBuffer.length > 300_000;
  }

  const enhancementPromptHints: string[] = [
    'Auto-correct any tilted, slanted, or perspective-distorted document boundaries.',
    'Normalize lighting gradients, cast shadows (e.g. hand/phone shadows), and glare.',
    'Automatically detect page orientation: if text is rotated 90°, 180°, or 270°, transcribe in the natural reading direction.',
    'Ignore background artifacts (wooden desks, fingers, shadows, margins) and transcribe only the paper document content.',
  ];

  if (isLikelyPhonePhoto) {
    enhancementPromptHints.push('High-resolution phone capture: maintain high precision on handwritten characters, cursive loops, accents, superscripts, subscripts, and mathematical symbols.');
  }

  const base64Data = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    hash,
    mimeType,
    dataUrl,
    sizeBytes: imageBuffer.length,
    isLikelyPhonePhoto,
    orientationHint,
    enhancementPromptHints,
  };
}
