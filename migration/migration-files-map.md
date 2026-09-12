# Migration Files Map — VedaAI: Neon → Supabase

## Legend
- 🔴 **CRITICAL** — Must change for migration to work
- 🟠 **HIGH** — Should change before going live
- 🟡 **MEDIUM** — Important for best practices
- 🟢 **LOW** — Documentation / informational

---

## Files to MODIFY

| File Path | Purpose | Change Required | Priority |
|-----------|---------|-----------------|----------|
| `apps/backend/.env` | Backend environment variables | Replace `DATABASE_URL` Neon URL with Supabase URL | 🔴 CRITICAL |
| `apps/backend/prisma/seed.ts` | DB seed script (roles, permissions, demo data) | Replace hardcoded Neon fallback URL | 🟠 HIGH |
| `apps/backend/prisma/seed-superadmin.ts` | Seed super admin user | Replace hardcoded Neon fallback URL | 🟠 HIGH |
| `apps/backend/prisma/seed-test-users.ts` | Seed test users for all roles | Replace hardcoded Neon fallback URL | 🟠 HIGH |
| `apps/backend/prisma/seed-test-users.js` | JS version of test user seed | Replace hardcoded Neon fallback URL | 🟠 HIGH |
| `apps/backend/seed.ts` | Root-level legacy seed script | Replace hardcoded Neon fallback URL | 🟠 HIGH |
| `apps/backend/.env.example` | Backend env template | Update DATABASE_URL example to generic PostgreSQL | 🟡 MEDIUM |
| `apps/frontend/.env` | Frontend environment variables | Add NEXT_PUBLIC_SUPABASE_URL + anon key | 🟡 MEDIUM |
| `apps/frontend/.env.example` | Frontend env template | Add Supabase env var examples | 🟡 MEDIUM |

---

## Files CREATED (New)

### SQL Migration Files

| File Path | Purpose | Priority |
|-----------|---------|----------|
| `migration/sql/01_current_schema.sql` | Complete DDL extracted from Prisma schema (source of truth for current DB) | 🟠 HIGH |
| `migration/sql/02_supabase_schema.sql` | Supabase-compatible schema with native enums, UUID defaults, realtime-ready | 🟠 HIGH |
| `migration/sql/03_rls_policies.sql` | Row Level Security policies for all 34 tables | 🟡 MEDIUM |
| `migration/sql/04_auth_triggers.sql` | Trigger: auto-create app user record when Supabase Auth user signs up | 🟡 MEDIUM |
| `migration/sql/05_indexes.sql` | Missing and composite indexes for query performance | 🟡 MEDIUM |
| `migration/sql/06_data_migration.sql` | INSERT INTO ... SELECT ... data migration from Neon to Supabase | 🟡 MEDIUM |

### Frontend Supabase Client Library

| File Path | Purpose | Priority |
|-----------|---------|----------|
| `apps/frontend/src/lib/supabase/client.ts` | Browser-side Supabase client (Client Components) | 🟡 MEDIUM |
| `apps/frontend/src/lib/supabase/server.ts` | Server-side Supabase client (Server Components, API routes) | 🟡 MEDIUM |
| `apps/frontend/src/lib/supabase/admin.ts` | Admin Supabase client with service role key (server-only) | 🟡 MEDIUM |

### Documentation Files

| File Path | Purpose | Priority |
|-----------|---------|----------|
| `migration/env/.env.example` | Master consolidated environment template | 🟢 LOW |
| `migration/docs/auth-migration.md` | Auth flow documentation (current → Supabase-compatible) | 🟢 LOW |
| `migration/docs/storage-migration.md` | Storage migration plan (local/S3 → Supabase Storage) | 🟢 LOW |
| `migration/realtime-plan.md` | Realtime strategy (Socket.IO + Supabase Realtime) | 🟢 LOW |
| `migration/question-generation-migration.md` | Generation flow trace and validation | 🟢 LOW |
| `migration/migration-api-report.md` | Before/after for every API endpoint | 🟢 LOW |
| `migration/migration-test-plan.md` | Complete test checklist | 🟢 LOW |
| `migration/removed-files.md` | Audit of files deleted (none required) | 🟢 LOW |

---

## Files NOT Changed (Provider-Agnostic)

| File Path | Reason No Change Needed |
|-----------|------------------------|
| `apps/backend/src/config/prisma.ts` | Uses `@prisma/adapter-pg` — works with any PostgreSQL |
| `apps/backend/src/config/env.ts` | `DATABASE_URL` variable name stays identical |
| `apps/backend/src/config/redis.ts` | Redis is independent of database provider |
| `apps/backend/src/services/auth.service.ts` | Custom JWT — provider-agnostic |
| `apps/backend/src/controllers/auth.controller.ts` | Pure Prisma queries |
| `apps/backend/src/controllers/admin.controller.ts` | Pure Prisma queries |
| `apps/backend/src/controllers/assignment.controller.ts` | Pure Prisma queries |
| `apps/backend/src/controllers/generation.controller.ts` | Pure Prisma queries |
| `apps/backend/src/workers/aiGeneration.worker.ts` | Pure Prisma queries |
| `apps/backend/src/workers/pdf.worker.ts` | Pure Prisma queries |
| `apps/backend/src/sockets/socket.server.ts` | Socket.IO — no DB dependency |
| `apps/backend/src/queues/generation.queue.ts` | BullMQ — no DB dependency |
| `apps/backend/src/queues/pdf.queue.ts` | BullMQ — no DB dependency |
| `apps/backend/src/services/storage/*.ts` | Local/S3 storage — no DB dependency |
| All 27 remaining controllers | Pure Prisma queries |
| All 30 remaining services | Pure Prisma queries |
| All 30 route files | No DB dependency |
| `apps/frontend/src/lib/api.ts` | REST API client — no direct DB |
| `apps/frontend/src/lib/socket.ts` | Socket.IO client — no direct DB |
| `apps/backend/prisma/schema.prisma` | Schema is PostgreSQL-standard — works on Supabase |
| `apps/backend/prisma.config.ts` | Reads DATABASE_URL — no change needed |
| `apps/backend/package.json` | No Neon packages to remove |
| `apps/frontend/package.json` | No Neon packages to remove |
| `render.yaml` | DATABASE_URL is set as env var in Render dashboard |

---

## Neon URL Occurrences (All Hardcoded Fallbacks)

```
postgresql://neondb_owner:npg_o0OQsB4nRHTU@ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Found in **6 locations** — all replaced with generic fallback or env-var-only pattern.

---

## Migration Execution Order

```
Step 1: Create Supabase project (manual — user action)
Step 2: Run 02_supabase_schema.sql on Supabase
Step 3: Run 03_rls_policies.sql on Supabase  
Step 4: Run 04_auth_triggers.sql on Supabase
Step 5: Run 05_indexes.sql on Supabase
Step 6: (If migrating data) Run 06_data_migration.sql
Step 7: Update DATABASE_URL in apps/backend/.env
Step 8: Run `npx prisma generate` to regenerate client
Step 9: Test with npm run dev
Step 10: Deploy to Render with new DATABASE_URL
```
