import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateSupabaseToR2 } from '../scripts/migrate-supabase-to-r2';
import * as r2Module from '../services/storage/r2-storage';
import * as supabaseModule from '@supabase/supabase-js';

vi.mock('../services/storage/r2-storage', () => ({
  getR2Storage: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('../config/prisma', () => ({
  default: {
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: 'u1', organizationId: 'org1' }),
    },
    storedFile: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('Supabase Storage to Cloudflare R2 Migration', () => {
  let mockR2: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

    mockR2 = {
      exists: vi.fn(),
      save: vi.fn().mockResolvedValue('https://r2/download'),
    };
    (r2Module.getR2Storage as any).mockReturnValue(mockR2);

    mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [
              { id: 'f1', name: 'sample-doc.pdf', metadata: { mimetype: 'application/pdf' } },
            ],
            error: null,
          }),
          download: vi.fn().mockResolvedValue({
            data: {
              arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
            },
            error: null,
          }),
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    };
    (supabaseModule.createClient as any).mockReturnValue(mockSupabase);
  });

  it('runs dry run without modifying R2 or Supabase', async () => {
    mockR2.exists.mockResolvedValue(false);

    const stats = await migrateSupabaseToR2({ dryRun: true, targetBucket: 'documents' });

    expect(stats.scanned).toBe(1);
    expect(stats.migrated).toBe(1);
    expect(stats.failed).toBe(0);
    expect(mockR2.save).not.toHaveBeenCalled();
  });

  it('migrates missing files to R2 and creates metadata records', async () => {
    mockR2.exists
      .mockResolvedValueOnce(false) // Initial existence check: false
      .mockResolvedValueOnce(true);  // Post-upload verification: true

    const stats = await migrateSupabaseToR2({ dryRun: false, targetBucket: 'documents' });

    expect(stats.scanned).toBe(1);
    expect(stats.migrated).toBe(1);
    expect(stats.failed).toBe(0);
    expect(mockR2.save).toHaveBeenCalled();
  });

  it('skips files already present in R2 (idempotent)', async () => {
    mockR2.exists.mockResolvedValue(true);

    const stats = await migrateSupabaseToR2({ dryRun: false, targetBucket: 'documents' });

    expect(stats.scanned).toBe(1);
    expect(stats.alreadyInR2).toBe(1);
    expect(stats.migrated).toBe(0);
    expect(mockR2.save).not.toHaveBeenCalled();
  });
});
