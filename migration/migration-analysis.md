# Migration Analysis — VedaAI: Neon → Supabase

## Current Architecture

### Monorepo Structure
```
TestRepo/
├── apps/
│   ├── backend/         # Express + TypeScript API (Node.js)
│   ├── frontend/        # Next.js 16 (React 19)
│   └── ai-engine/       # Python FastAPI (no DB)
├── package.json         # Workspace root
└── render.yaml          # Render.com deployment config
```

### Database Layer
| Aspect | Current (Neon) | Target (Supabase) |
|--------|---------------|-------------------|
| Provider | Neon PostgreSQL | Supabase PostgreSQL |
| ORM | Prisma 7.8 | Prisma 7.8 (unchanged) |
| Driver | `@prisma/adapter-pg` | `@prisma/adapter-pg` (unchanged) |
| Connection | `DATABASE_URL` env var | `DATABASE_URL` env var (new value) |
| Pooling | Neon pooler | Supabase Supavisor pooler or direct |
| Auth | Custom JWT (Argon2) | Custom JWT (unchanged) + Supabase Auth (optional) |
| Storage | Local filesystem / S3 | Local / S3 / Supabase Storage (additive) |
| Realtime | Socket.IO | Socket.IO (unchanged) + Supabase Realtime (additive) |

### Backend Services (48 files using Prisma)
- **Controllers (27)**: admin, analytics, assessment, assignment, auth, chat, community, export, generation, grader, group, lessons, meeting, moderation, notes, notification, paper, question-bank, question, review, student, super-admin, syllabus, tutor, usage, voice, worksheets
- **Services (30)**: ai, analytics, assignment, audit, auth, canonical-metadata, chat, community, csv-import, daily-limit, email, grader, invitation, lessons, meeting, moderation, notes, notification, paper, pdf, quality-gate, question-bank, question-generation, storage (local/s3/r2), tutor, voice, worksheets
- **Workers (2)**: aiGeneration.worker, pdf.worker
- **Queues (2)**: generation.queue, pdf.queue (BullMQ + Redis)
- **Sockets (1)**: socket.server (Socket.IO)
- **Routes (30)**: Full REST API router

### Schema Overview
**34 Prisma models** across these domains:
- Organization & multi-tenancy (Organization, Department, User, UserRole, Role, Permission)
- Auth & sessions (Session, RefreshToken, LoginHistory, EmailVerificationToken, PasswordResetToken)
- Academic structure (Classroom, Section, Enrollment, Class, Group, ClassGroup, Student)
- Invitations (Invitation)
- Assessment & Questions (Question, QuestionReview, Assessment, AssessmentQuestion, QuestionBank, QuestionVersion, QuestionCollection)
- Assignment & Papers (Assignment, GeneratedPaper, GenerationJob)
- Grading (Rubric, RubricCriterion, AssignmentGradingConfig, StudentSubmission, SubmissionEvaluation)
- AI Features (QuizSession, QuizSessionQuestion, LessonPlan, Worksheet, GeneratedNotes, AIRecommendation)
- Prompts (PromptTemplate, PromptVersion, PromptExecution)
- Subscriptions (Subscription, Invoice)
- Community (CommunityPost, CommunityGroup, GroupMember, Message, VoiceRoom, VoiceRoomParticipant, Meeting)
- Misc (Syllabus, SyllabusTopic, SyllabusSubtopic, Notification, AuditLog, ClassStudent, GroupStudent)

---

## Neon Dependencies Found

### Level 1 — Direct Neon Connection String (CRITICAL)
| File | Type | Neon Reference |
|------|------|----------------|
| `apps/backend/.env` | Environment | `DATABASE_URL` points to `ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech` |
| `apps/backend/prisma/seed.ts` | Seed script | Hardcoded Neon URL as fallback default |
| `apps/backend/prisma/seed-superadmin.ts` | Seed script | Hardcoded Neon URL as fallback default |
| `apps/backend/prisma/seed-test-users.ts` | Seed script | Hardcoded Neon URL as fallback default |
| `apps/backend/prisma/seed-test-users.js` | Seed script | Hardcoded Neon URL as fallback default |
| `apps/backend/seed.ts` | Seed script (root) | Hardcoded Neon URL as fallback default |

### Level 2 — No Neon SDK (confirmed absent)
- `@neondatabase/serverless` — **NOT present** in any package.json
- `NeonConfig` — **NOT present**
- Drizzle ORM — **NOT present**
- Any Neon-specific client code — **NOT present**

### Level 3 — Indirect (via DATABASE_URL)
All 48+ Prisma-using files inherit the Neon connection transitively through `src/config/prisma.ts`.
These files require **zero code changes** — only the env var value changes.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Schema incompatibility | LOW | Prisma schema uses standard PostgreSQL features, fully Supabase-compatible |
| Data loss during migration | MEDIUM | Generate and validate `06_data_migration.sql` before switching |
| Downtime during cutover | LOW | Both databases can run simultaneously; cutover is just an env var swap |
| RLS policy errors | MEDIUM | Test each policy with the Supabase SQL editor before going live |
| Auth trigger failures | LOW | Trigger is additive; custom JWT auth continues to work independently |
| Connection pool limits | LOW | Supabase Supavisor handles pooling; configure `?pgbouncer=true` if needed |
| Prisma driver compatibility | NONE | `@prisma/adapter-pg` is tested with Supabase PostgreSQL |

---

## Migration Complexity Score

**Overall: 2/10 (Very Low)**

- Neon-specific code: 0 lines
- Files requiring code changes: 5 seed files + 4 env files = 9 total
- Schema changes needed: None (schema is identical)
- Auth system changes: None (custom JWT is provider-agnostic)
- API changes: None
- Worker changes: None
- Frontend API changes: None

The migration is essentially an **environment variable swap** with accompanying Supabase-native setup (RLS, triggers, indexes) as best-practice additions.

---

## Files Requiring Modification

| File | Change Type | Priority |
|------|-------------|----------|
| `apps/backend/.env` | Replace DATABASE_URL value | CRITICAL |
| `apps/backend/prisma/seed.ts` | Remove hardcoded Neon URL | HIGH |
| `apps/backend/prisma/seed-superadmin.ts` | Remove hardcoded Neon URL | HIGH |
| `apps/backend/prisma/seed-test-users.ts` | Remove hardcoded Neon URL | HIGH |
| `apps/backend/prisma/seed-test-users.js` | Remove hardcoded Neon URL | HIGH |
| `apps/backend/seed.ts` | Remove hardcoded Neon URL | HIGH |
| `apps/backend/.env.example` | Update DATABASE_URL example | MEDIUM |
| `apps/frontend/.env` | Add Supabase vars | MEDIUM |
| `apps/frontend/.env.example` | Add Supabase vars | MEDIUM |

## New Files Created

| File | Purpose | Priority |
|------|---------|----------|
| `migration/sql/01_current_schema.sql` | DDL extracted from Prisma schema | HIGH |
| `migration/sql/02_supabase_schema.sql` | Supabase-optimized schema | HIGH |
| `migration/sql/03_rls_policies.sql` | Row Level Security policies | HIGH |
| `migration/sql/04_auth_triggers.sql` | Auto profile creation triggers | MEDIUM |
| `migration/sql/05_indexes.sql` | Performance indexes | MEDIUM |
| `migration/sql/06_data_migration.sql` | Data migration script | MEDIUM |
| `apps/frontend/src/lib/supabase/client.ts` | Browser Supabase client | MEDIUM |
| `apps/frontend/src/lib/supabase/server.ts` | Server Supabase client | MEDIUM |
| `apps/frontend/src/lib/supabase/admin.ts` | Admin Supabase client | MEDIUM |
| `migration/env/.env.example` | Master env template | LOW |
| `migration/docs/auth-migration.md` | Auth migration docs | LOW |
| `migration/docs/storage-migration.md` | Storage migration docs | LOW |
| `migration/realtime-plan.md` | Realtime plan | LOW |
| `migration/question-generation-migration.md` | Generation flow docs | LOW |
| `migration/migration-api-report.md` | API endpoint report | LOW |
| `migration/migration-test-plan.md` | Test checklist | LOW |
| `migration/removed-files.md` | Removed files log | LOW |
