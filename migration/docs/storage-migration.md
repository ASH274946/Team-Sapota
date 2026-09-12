# Storage Migration — VedaAI: Neon → Supabase

## Current Storage Architecture

The backend uses a **modular StorageAdapter** pattern that supports multiple backends. Storage itself is independent of Neon and continues to work unchanged after the database migration.

```
apps/backend/src/services/storage/
├── storage.service.ts       # Factory: returns LocalStorageAdapter or S3StorageAdapter
├── local.storage.ts         # LocalStorageAdapter (default for development)
├── s3.storage.ts            # S3StorageAdapter (production, also works with R2/DigitalOcean)
└── r2.storage.ts            # CloudflareR2 adapter (if configured)
```

### Current Config (`STORAGE_TYPE` env var)

| Value | Backend | Use Case |
|-------|---------|---------|
| `local` | Local filesystem (`./uploads`) | Development, single-instance |
| `s3` | AWS S3 / Cloudflare R2 | Production, scalable |
| `cloudinary` | Cloudinary CDN | Image-heavy use cases |

---

## What Changed in This Migration

**Nothing.** Storage is independent of the database provider. Your existing local/S3 storage setup continues to work identically with Supabase.

The Render deployment mounts a disk at `/opt/render/project/uploads` for local storage, which remains unchanged.

---

## Optional: Migrate to Supabase Storage

If you want to centralize everything on Supabase (database + storage), here's the setup:

### Step 1: Create Supabase Storage Buckets

Run in Supabase SQL Editor:

```sql
-- Create buckets for VedaAI files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads',     'uploads',     FALSE, 52428800, ARRAY['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('papers',      'papers',      FALSE, 52428800, ARRAY['application/pdf']),
  ('submissions', 'submissions', FALSE, 52428800, ARRAY['application/pdf', 'image/*']),
  ('avatars',     'avatars',     TRUE,  5242880,  ARRAY['image/*']);
```

### Step 2: Storage RLS Policies

```sql
-- Users can read files in their organization's folder
CREATE POLICY "uploads: org members can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('uploads', 'papers', 'submissions')
    AND (storage.foldername(name))[1] IN (
      SELECT "organizationId" FROM public."User"
      WHERE "id" = public.current_app_user_id()
    )
  );

-- Users can upload to their org folder
CREATE POLICY "uploads: org members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('uploads', 'submissions')
    AND (storage.foldername(name))[1] IN (
      SELECT "organizationId" FROM public."User"
      WHERE "id" = public.current_app_user_id()
    )
  );

-- Avatars are public
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.current_app_user_id() IS NOT NULL
  );
```

### Step 3: Add SupabaseStorageAdapter to backend

Create `apps/backend/src/services/storage/supabase.storage.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { StorageAdapter } from './storage.service';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export class SupabaseStorageAdapter implements StorageAdapter {
  async upload(file: Buffer, filename: string, mimeType: string, prefix = 'uploads'): Promise<string> {
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${prefix}/${filename}`, file, { contentType: mimeType, upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  async delete(path: string): Promise<void> {
    const { error } = await supabase.storage.from('uploads').remove([path]);
    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from('uploads').createSignedUrl(path, expiresIn);
    if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
    return data.signedUrl;
  }
}
```

### Step 4: Update storage.service.ts factory

```typescript
import { SupabaseStorageAdapter } from './supabase.storage';

function createStorageAdapter(): StorageAdapter {
  const type = process.env.STORAGE_TYPE || 'local';
  switch (type) {
    case 'supabase': return new SupabaseStorageAdapter();
    case 's3':       return new S3StorageAdapter();
    default:         return new LocalStorageAdapter();
  }
}
```

### Step 5: Set env var

```env
STORAGE_TYPE=supabase
```

---

## Migration File URLs (If Migrating Existing Files)

If you have existing uploaded files on local disk or S3 that need moving to Supabase Storage, use the migration script:

```bash
# Example: migrate from local uploads/ directory to Supabase Storage
node migration/scripts/migrate-storage.js
```

The `GeneratedPaper.pdfPath` and `GeneratedPaper.pdfUrl` columns in the DB store file references. These would need to be updated after file migration.

---

## Recommendation

**Keep local/S3 storage for now.** Storage migration is entirely optional and independent of the database migration. You can migrate to Supabase Storage later without touching any other part of the codebase.
