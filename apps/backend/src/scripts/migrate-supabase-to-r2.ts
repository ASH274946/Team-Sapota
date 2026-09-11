import { createClient } from '@supabase/supabase-js';
import prisma from '../config/prisma';
import { getR2Storage } from '../services/storage/r2-storage';
import { sanitizeFilename } from '../services/storage/key-generator';
import { logger } from '../utils/logger';

export interface MigrationOptions {
  dryRun?: boolean;
  cleanupSupabase?: boolean;
  targetBucket?: string;
}

export interface MigrationStats {
  scanned: number;
  migrated: number;
  alreadyInR2: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

export async function migrateSupabaseToR2(options: MigrationOptions = {}): Promise<MigrationStats> {
  const { dryRun = false, cleanupSupabase = false, targetBucket } = options;
  const stats: MigrationStats = {
    scanned: 0,
    migrated: 0,
    alreadyInR2: 0,
    failed: 0,
    errors: [],
  };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.warn('[Migration] Supabase credentials not found. Skipping live Supabase bucket scan.');
    return stats;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const r2 = getR2Storage();

  const bucketsToMigrate = targetBucket ? [targetBucket] : ['uploads', 'documents', 'assignments', 'blogs'];

  logger.info(`[Migration] Starting Supabase Storage -> Cloudflare R2 migration (dryRun=${dryRun})`);

  for (const bucketName of bucketsToMigrate) {
    try {
      const { data: files, error } = await supabase.storage.from(bucketName).list('', {
        limit: 1000,
        offset: 0,
      });

      if (error) {
        logger.warn(`[Migration] Bucket "${bucketName}" not accessible or does not exist: ${error.message}`);
        continue;
      }

      if (!files || files.length === 0) {
        logger.info(`[Migration] Bucket "${bucketName}" is empty.`);
        continue;
      }

      for (const item of files) {
        if (item.id === null) continue; // Directory/folder marker
        stats.scanned++;

        const originalName = item.name;
        const mappedKey = `documents/migration/${item.id || sanitizeFilename(originalName)}`;

        try {
          // 1. Check if already in R2
          const alreadyExists = await r2.exists(mappedKey);
          if (alreadyExists) {
            stats.alreadyInR2++;
            logger.info(`[Migration] File already exists in R2: ${mappedKey}`);
            continue;
          }

          if (dryRun) {
            stats.migrated++;
            logger.info(`[DryRun] Would migrate ${bucketName}/${originalName} -> ${mappedKey}`);
            continue;
          }

          // 2. Download from Supabase
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(item.name);

          if (downloadError || !fileData) {
            throw new Error(`Failed to download from Supabase: ${downloadError?.message || 'Empty data'}`);
          }

          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = (item.metadata as any)?.mimetype || 'application/octet-stream';

          // 3. Upload to R2
          await r2.save(mappedKey, buffer, mimeType);

          // 4. Verify R2 object
          const verified = await r2.exists(mappedKey);
          if (!verified) {
            throw new Error(`R2 verification failed for key: ${mappedKey}`);
          }

          // 5. Create or update StoredFile record
          const systemUser = await prisma.user.findFirst();
          if (systemUser) {
            await prisma.storedFile.upsert({
              where: { key: mappedKey },
              create: {
                key: mappedKey,
                bucket: process.env.R2_BUCKET_NAME || 'vidyaai-uploads',
                originalName,
                mimeType,
                sizeBytes: buffer.length,
                scope: 'documents',
                ownerId: systemUser.id,
                organizationId: systemUser.organizationId,
                isPublic: false,
                metadata: { migratedFrom: `supabase://${bucketName}/${originalName}` },
              },
              update: {
                sizeBytes: buffer.length,
              },
            });
          }

          stats.migrated++;
          logger.info(`[Migration] Successfully migrated ${bucketName}/${originalName} -> ${mappedKey}`);

          // 6. Safe cleanup from Supabase if explicitly requested
          if (cleanupSupabase) {
            await supabase.storage.from(bucketName).remove([originalName]);
            logger.info(`[Migration] Cleaned up original file from Supabase: ${bucketName}/${originalName}`);
          }
        } catch (fileErr: any) {
          stats.failed++;
          stats.errors.push({ file: `${bucketName}/${originalName}`, error: fileErr.message });
          logger.error(`[Migration] Error migrating ${bucketName}/${originalName}: ${fileErr.message}`);
        }
      }
    } catch (bucketErr: any) {
      logger.error(`[Migration] Error processing bucket ${bucketName}: ${bucketErr.message}`);
    }
  }

  logger.info(`[Migration] Completed. Scanned: ${stats.scanned}, Migrated: ${stats.migrated}, Existing: ${stats.alreadyInR2}, Failed: ${stats.failed}`);
  return stats;
}

// Run CLI directly if executed from command line
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  const doCleanup = process.argv.includes('--cleanup-supabase');
  
  migrateSupabaseToR2({ dryRun: isDryRun, cleanupSupabase: doCleanup })
    .then((result) => {
      console.log('Migration Result:', JSON.stringify(result, null, 2));
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
