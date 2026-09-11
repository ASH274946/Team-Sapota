import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from multiple possible locations (works in dev, PM2, containerized)
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env'),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),

  // Database
  DATABASE_URL: z
    .string()
    .optional()
    .default('postgresql://postgres:password@localhost:5432/bloom_verify?schema=public'),
  MONGODB_URI: z.string().optional(),

  // Redis (general — caching, sessions, pub/sub)
  REDIS_URL: z
    .string()
    .min(1, 'REDIS_URL is required')
    .refine(
      (v) => v.startsWith('redis://') || v.startsWith('rediss://') || v.startsWith('redis+tls://'),
      'REDIS_URL must be a TCP Redis URL (redis://, rediss://, or redis+tls://). Do not use https:// REST endpoints.'
    ),
  // Redis for BullMQ — requires TCP-compatible Redis (Upstash TCP endpoint works, REST does not)
  REDIS_BULLMQ_URL: z
    .string()
    .min(1, 'REDIS_BULLMQ_URL is required')
    .refine(
      (v) => v.startsWith('redis://') || v.startsWith('rediss://') || v.startsWith('redis+tls://'),
      'REDIS_BULLMQ_URL must be a TCP Redis URL (redis://, rediss://, or redis+tls://). Do not use https:// REST endpoints.'
    ),

  // AI Providers (at least one required for generation)
  OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  NVIDIA_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  GROQ_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 5 ? v.trim() : undefined)),

  // Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  // CORS — comma-separated list of allowed origins (no default, fails if unset in production)
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required (comma-separated)'),
  SOCKET_CORS_ORIGIN: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),

  // Upload / Storage
  STORAGE_TYPE: z.enum(['local', 's3', 'cloudinary', 'supabase']).default('local'),
  MAX_FILE_SIZE_MB: z.string().default('10').transform(Number),
  UPLOAD_DIR: z
    .string()
    .default('./uploads')
    .transform((v) => (v.startsWith('/') || v.startsWith('./') ? v : `./${v}`)),

  // Cloud storage credentials (optional, used when STORAGE_TYPE !== 'local')
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Worker configuration
  ENABLE_BACKGROUND_WORKERS: z
    .string()
    .default('true')
    .transform((value) => value.toLowerCase() !== 'false'),
  AI_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(3),
  PDF_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(2).default(2),
  // Render worker mode: 'web' = API only, 'worker' = workers only, 'both' = combined (dev only)
  RENDER_WORKER_MODE: z.enum(['web', 'worker', 'both']).default('both'),

  // Queue / Retry tuning
  QUEUE_SWEEP_INTERVAL_MS: z.coerce.number().int().min(30_000).default(120_000),
  STALL_MONITOR_INTERVAL_MS: z.coerce.number().int().min(60_000).default(300_000),

  // AI Engine & Performance
  AI_ENGINE_URL: z.string().url().default('http://localhost:8000'),
  AI_PRIMARY_TIMEOUT_MS: z.coerce.number().int().min(1000).default(12000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  process.stderr.write(' FAILED TO START — Invalid or missing environment variables:\n');
  for (const [key, messages] of Object.entries(errors)) {
    process.stderr.write(`  ${key}: ${messages?.join(', ')}\n`);
  }
  if (process.env.NODE_ENV === 'production') {
    process.stderr.write('Production environment validation failed. Fix env vars and redeploy.\n');
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

// ── Production-specific checks ──
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === 'vidya-ai-dev-secret-change-in-production') {
    process.stderr.write('CRITICAL: JWT_SECRET is still set to the development default. Set a strong random secret.\n');
    process.exit(1);
  }

  const urls = parsed.data.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean);
  const hasLocalhost = urls.some((url) => url.includes('localhost') || url.includes('127.0.0.1'));
  if (urls.length === 1 && hasLocalhost) {
    process.stderr.write('CRITICAL: FRONTEND_URL is set to localhost in production mode. Set the real frontend domain.\n');
    process.exit(1);
  }
}

// ── Warn if no AI provider is configured ──
if (
  parsed.data.NODE_ENV !== 'test' &&
  !parsed.data.OPENAI_API_KEY &&
  !parsed.data.ANTHROPIC_API_KEY &&
  !parsed.data.NVIDIA_API_KEY &&
  !parsed.data.GROQ_API_KEY &&
  !parsed.data.GEMINI_API_KEY
) {
  process.stderr.write(
    '⚠️  No AI provider API key configured. Assignment generation will fail. ' +
    'Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, NVIDIA_API_KEY, GROQ_API_KEY, GEMINI_API_KEY\n'
  );
}
