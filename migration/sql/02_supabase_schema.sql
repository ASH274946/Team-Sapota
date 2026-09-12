-- =============================================================================
-- 02_supabase_schema.sql
-- Supabase-optimized schema for VedaAI
-- Generated: 2026-06-24
--
-- INSTRUCTIONS:
--   Run this in your Supabase project SQL Editor (Dashboard → SQL Editor → New Query)
--   Run BEFORE applying RLS policies (03_rls_policies.sql)
--
-- CHANGES FROM NEON SCHEMA:
--   1. Uses gen_random_uuid() — native PostgreSQL UUID generation (Supabase default)
--   2. All TEXT ids use uuid type for proper indexing and Supabase compatibility
--   3. Timestamps use TIMESTAMPTZ (timezone-aware) instead of TIMESTAMP(3)
--   4. Adds updated_at trigger function for automatic timestamp management
--   5. Tables structured to support Supabase Realtime publication
--   6. auth.users FK hooks added as optional comments for Supabase Auth integration
-- =============================================================================

-- ── Helper: auto-update updated_at timestamp ──────────────────────────────────
-- This trigger automatically sets updated_at on every UPDATE, matching Prisma's @updatedAt behavior.

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Enums ──────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM (
    'DRAFT', 'GENERATING', 'GENERATED', 'PARTIALLY_GENERATED', 'FAILED',
    'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ACTIVE',
    'COMPLETED', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM (
    'AVAILABLE', 'STARTED', 'IN_PROGRESS', 'SUBMITTED',
    'UNDER_REVIEW', 'GRADED', 'RESULT_PUBLISHED', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BloomLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Organization ────────────────────────────────────────────────────────────────
-- Change: TIMESTAMPTZ for all timestamps, gen_random_uuid() default

CREATE TABLE IF NOT EXISTS public."Organization" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"             TEXT NOT NULL,
  "slug"             TEXT,
  "code"             TEXT NOT NULL,
  "email"            TEXT,
  "phone"            TEXT,
  "address"          TEXT,
  "logo"             TEXT,
  "subscriptionPlan" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  "status"           "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Organization_slug_key" UNIQUE ("slug"),
  CONSTRAINT "Organization_code_key" UNIQUE ("code")
);

CREATE OR REPLACE TRIGGER "Organization_updated_at"
  BEFORE UPDATE ON public."Organization"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Department ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Department" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "code"           TEXT,
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "hodId"          TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Department_organizationId_idx" ON public."Department"("organizationId");

CREATE OR REPLACE TRIGGER "Department_updated_at"
  BEFORE UPDATE ON public."Department"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── User ────────────────────────────────────────────────────────────────────────
-- Note: "passwordHash" stores Argon2 hashes from the custom auth system.
--       If you later migrate to Supabase Auth, this column becomes optional
--       and a supabase_user_id column (UUID FK to auth.users) is added.

CREATE TABLE IF NOT EXISTS public."User" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"                  TEXT NOT NULL,
  "passwordHash"           TEXT NOT NULL,
  "firstName"              TEXT NOT NULL,
  "lastName"               TEXT NOT NULL,
  "role"                   "SystemRole" NOT NULL DEFAULT 'TEACHER',
  "phone"                  TEXT,
  "status"                 TEXT NOT NULL DEFAULT 'ACTIVE',
  "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT FALSE,
  "onboardingCompletedAt"  TIMESTAMPTZ,
  "forcePasswordReset"     BOOLEAN NOT NULL DEFAULT FALSE,
  "activeOrganizationId"   TEXT,
  "organizationId"         TEXT,
  "departmentId"           TEXT,
  "preferences"            JSONB,
  -- Optional: Supabase Auth integration hook
  -- "supabaseUserId"      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE SET NULL,
  CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId")
    REFERENCES public."Department"("id") ON DELETE SET NULL
);

CREATE OR REPLACE TRIGGER "User_updated_at"
  BEFORE UPDATE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Session ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Session" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON public."Session"("userId");
-- Index for expiry cleanup queries
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON public."Session"("expiresAt");

-- ── RefreshToken ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."RefreshToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tokenHash" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "isRevoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefreshToken_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON public."RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_isRevoked_idx" ON public."RefreshToken"("isRevoked");

-- ── LoginHistory ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."LoginHistory" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "country"   TEXT,
  "status"    TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LoginHistory_userId_idx" ON public."LoginHistory"("userId");

-- ── EmailVerificationToken ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."EmailVerificationToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"     TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailVerificationToken_email_key" UNIQUE ("email"),
  CONSTRAINT "EmailVerificationToken_tokenHash_key" UNIQUE ("tokenHash")
);

-- ── PasswordResetToken ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."PasswordResetToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON public."PasswordResetToken"("userId");

-- ── RBAC: Role / Permission / UserRole ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Role" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Role_name_key" UNIQUE ("name")
);

CREATE OR REPLACE TRIGGER "Role_updated_at"
  BEFORE UPDATE ON public."Role"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."Permission" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Permission_name_key" UNIQUE ("name")
);

CREATE TABLE IF NOT EXISTS public."_RolePermissions" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A")
    REFERENCES public."Permission"("id") ON DELETE CASCADE,
  CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B")
    REFERENCES public."Role"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "_RolePermissions_AB_unique" ON public."_RolePermissions"("A", "B");
CREATE INDEX IF NOT EXISTS "_RolePermissions_B_index" ON public."_RolePermissions"("B");

CREATE TABLE IF NOT EXISTS public."UserRole" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "roleId"    TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserRole_userId_roleId_key" UNIQUE ("userId", "roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId")
    REFERENCES public."Role"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserRole_userId_idx" ON public."UserRole"("userId");
CREATE INDEX IF NOT EXISTS "UserRole_roleId_idx" ON public."UserRole"("roleId");

-- ── Invitation ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Invitation" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"          TEXT NOT NULL,
  "role"           "SystemRole" NOT NULL,
  "organizationId" TEXT NOT NULL,
  "token"          TEXT NOT NULL,
  "expiresAt"      TIMESTAMPTZ NOT NULL,
  "acceptedAt"     TIMESTAMPTZ,
  "createdById"    TEXT NOT NULL,
  "status"         "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invitation_token_key" UNIQUE ("token"),
  CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES public."User"("id")
);

CREATE INDEX IF NOT EXISTS "Invitation_organizationId_idx" ON public."Invitation"("organizationId");

CREATE OR REPLACE TRIGGER "Invitation_updated_at"
  BEFORE UPDATE ON public."Invitation"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Classroom / Section / Enrollment ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Classroom" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Classroom_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Classroom_organizationId_idx" ON public."Classroom"("organizationId");

CREATE OR REPLACE TRIGGER "Classroom_updated_at"
  BEFORE UPDATE ON public."Classroom"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."Section" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "teacherId"   TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Section_classroomId_fkey" FOREIGN KEY ("classroomId")
    REFERENCES public."Classroom"("id") ON DELETE CASCADE,
  CONSTRAINT "Section_teacherId_fkey" FOREIGN KEY ("teacherId")
    REFERENCES public."User"("id")
);

CREATE INDEX IF NOT EXISTS "Section_classroomId_idx" ON public."Section"("classroomId");

CREATE TABLE IF NOT EXISTS public."Enrollment" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sectionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Enrollment_sectionId_studentId_key" UNIQUE ("sectionId", "studentId"),
  CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId")
    REFERENCES public."Section"("id") ON DELETE CASCADE,
  CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId")
    REFERENCES public."User"("id")
);

-- ── Class / ClassStudent ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Class" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "grade"          TEXT NOT NULL,
  "section"        TEXT NOT NULL,
  "academicYear"   TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "facultyId"      TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Class_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Class_facultyId_fkey" FOREIGN KEY ("facultyId")
    REFERENCES public."User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Class_organizationId_idx" ON public."Class"("organizationId");
CREATE INDEX IF NOT EXISTS "Class_facultyId_idx" ON public."Class"("facultyId");

CREATE OR REPLACE TRIGGER "Class_updated_at"
  BEFORE UPDATE ON public."Class"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."ClassStudent" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "classId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ClassStudent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClassStudent_classId_fkey" FOREIGN KEY ("classId")
    REFERENCES public."Class"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ClassStudent_classId_idx" ON public."ClassStudent"("classId");

-- ── Group / GroupStudent ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Group" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "subject"        TEXT NOT NULL DEFAULT 'General',
  "organizationId" TEXT NOT NULL,
  "facultyId"      TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Group_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Group_facultyId_fkey" FOREIGN KEY ("facultyId")
    REFERENCES public."User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Group_organizationId_idx" ON public."Group"("organizationId");
CREATE INDEX IF NOT EXISTS "Group_facultyId_idx" ON public."Group"("facultyId");

CREATE OR REPLACE TRIGGER "Group_updated_at"
  BEFORE UPDATE ON public."Group"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."GroupStudent" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GroupStudent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupStudent_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES public."Group"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "GroupStudent_groupId_idx" ON public."GroupStudent"("groupId");

-- ── Legacy ClassGroup / Student ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."ClassGroup" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "subject"        TEXT NOT NULL DEFAULT 'General',
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClassGroup_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ClassGroup_userId_idx" ON public."ClassGroup"("userId");

CREATE TABLE IF NOT EXISTS public."Student" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES public."ClassGroup"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Student_groupId_idx" ON public."Student"("groupId");

-- ── Syllabus ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Syllabus" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "grade"          TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'active',
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Syllabus_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Syllabus_userId_idx" ON public."Syllabus"("userId");
CREATE INDEX IF NOT EXISTS "Syllabus_organizationId_idx" ON public."Syllabus"("organizationId");

CREATE OR REPLACE TRIGGER "Syllabus_updated_at"
  BEFORE UPDATE ON public."Syllabus"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."SyllabusTopic" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "syllabusId"  TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "duration"    INTEGER NOT NULL DEFAULT 60,
  "completed"   BOOLEAN NOT NULL DEFAULT FALSE,
  "topicOrder"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SyllabusTopic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SyllabusTopic_syllabusId_fkey" FOREIGN KEY ("syllabusId")
    REFERENCES public."Syllabus"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SyllabusTopic_syllabusId_idx" ON public."SyllabusTopic"("syllabusId");

CREATE TABLE IF NOT EXISTS public."SyllabusSubtopic" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "topicId"    TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "completed"  BOOLEAN NOT NULL DEFAULT FALSE,
  "topicOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SyllabusSubtopic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SyllabusSubtopic_topicId_fkey" FOREIGN KEY ("topicId")
    REFERENCES public."SyllabusTopic"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SyllabusSubtopic_topicId_idx" ON public."SyllabusSubtopic"("topicId");

-- ── Questions & Assessment ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Question" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "content"        TEXT NOT NULL,
  "options"        JSONB,
  "answer"         TEXT,
  "hint"           TEXT,
  "subjectId"      TEXT,
  "unitId"         TEXT,
  "difficulty"     "Difficulty" NOT NULL,
  "bloomLevel"     "BloomLevel" NOT NULL,
  "authorId"       TEXT NOT NULL,
  "organizationId" TEXT,
  "isPublished"    BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES public."User"("id"),
  CONSTRAINT "Question_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Question_bloomLevel_idx" ON public."Question"("bloomLevel");
CREATE INDEX IF NOT EXISTS "Question_difficulty_idx" ON public."Question"("difficulty");
CREATE INDEX IF NOT EXISTS "Question_isPublished_idx" ON public."Question"("isPublished");
CREATE INDEX IF NOT EXISTS "Question_subjectId_idx" ON public."Question"("subjectId");
CREATE INDEX IF NOT EXISTS "Question_organizationId_idx" ON public."Question"("organizationId");
CREATE INDEX IF NOT EXISTS "Question_authorId_idx" ON public."Question"("authorId");

CREATE OR REPLACE TRIGGER "Question_updated_at"
  BEFORE UPDATE ON public."Question"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."QuestionReview" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "questionId"      TEXT NOT NULL,
  "reviewerId"      TEXT NOT NULL,
  "status"          TEXT NOT NULL,
  "comments"        TEXT,
  "reason"          TEXT,
  "requiredChanges" TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuestionReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionReview_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES public."Question"("id"),
  CONSTRAINT "QuestionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId")
    REFERENCES public."User"("id")
);

CREATE INDEX IF NOT EXISTS "QuestionReview_questionId_idx" ON public."QuestionReview"("questionId");
CREATE INDEX IF NOT EXISTS "QuestionReview_reviewerId_idx" ON public."QuestionReview"("reviewerId");

CREATE TABLE IF NOT EXISTS public."Assessment" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subjectId"      TEXT,
  "totalMarks"     INTEGER NOT NULL DEFAULT 100,
  "status"         TEXT NOT NULL DEFAULT 'DRAFT',
  "authorId"       TEXT NOT NULL,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Assessment_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES public."User"("id"),
  CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Assessment_organizationId_idx" ON public."Assessment"("organizationId");

CREATE TABLE IF NOT EXISTS public."AssessmentQuestion" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assessmentId" TEXT NOT NULL,
  "questionId"   TEXT NOT NULL,
  "marks"        INTEGER NOT NULL DEFAULT 1,
  "order"        INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId")
    REFERENCES public."Assessment"("id"),
  CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES public."Question"("id")
);

CREATE INDEX IF NOT EXISTS "AssessmentQuestion_assessmentId_idx" ON public."AssessmentQuestion"("assessmentId");

-- ── Assignment & Papers ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Assignment" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"                  TEXT NOT NULL,
  "subject"                TEXT NOT NULL,
  "organizationId"         TEXT NOT NULL,
  "createdById"            TEXT,
  "classId"                TEXT,
  "description"            TEXT NOT NULL DEFAULT '',
  "dueDate"                TIMESTAMPTZ NOT NULL,
  "duration"               INTEGER NOT NULL,
  "totalMarks"             INTEGER NOT NULL,
  "questionConfig"         JSONB NOT NULL,
  "uploadedFiles"          JSONB NOT NULL DEFAULT '[]',
  "additionalInstructions" TEXT NOT NULL DEFAULT '',
  "typeBreakdown"          TEXT,
  "status"                 "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "approvedBy"             TEXT,
  "approvedAt"             TIMESTAMPTZ,
  "rejectedBy"             TEXT,
  "rejectedAt"             TIMESTAMPTZ,
  "reviewComments"         TEXT,
  "publishedAt"            TIMESTAMPTZ,
  "generationMeta"         JSONB,
  "generationSeq"          INTEGER NOT NULL DEFAULT 0,
  "activeGenerationJobId"  TEXT,
  "finalizedAt"            TIMESTAMPTZ,
  "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Assignment_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES public."User"("id") ON DELETE SET NULL,
  CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId")
    REFERENCES public."Class"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "Assignment_status_createdAt_idx" ON public."Assignment"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Assignment_subject_idx" ON public."Assignment"("subject");
CREATE INDEX IF NOT EXISTS "Assignment_organizationId_idx" ON public."Assignment"("organizationId");
CREATE INDEX IF NOT EXISTS "Assignment_createdById_idx" ON public."Assignment"("createdById");
CREATE INDEX IF NOT EXISTS "Assignment_classId_idx" ON public."Assignment"("classId");

CREATE OR REPLACE TRIGGER "Assignment_updated_at"
  BEFORE UPDATE ON public."Assignment"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Realtime for Assignment (for generation progress tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public."Assignment";

CREATE TABLE IF NOT EXISTS public."GeneratedPaper" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"      TEXT NOT NULL,
  "organizationId"    TEXT NOT NULL,
  "title"             TEXT NOT NULL,
  "totalMarks"        INTEGER NOT NULL,
  "duration"          INTEGER NOT NULL DEFAULT 45,
  "sections"          JSONB NOT NULL,
  "canonicalMetadata" JSONB,
  "pdfPath"           TEXT,
  "pdfUrl"            TEXT,
  "generatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GeneratedPaper_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedPaper_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES public."Assignment"("id"),
  CONSTRAINT "GeneratedPaper_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "GeneratedPaper_assignmentId_generatedAt_idx" ON public."GeneratedPaper"("assignmentId", "generatedAt");
CREATE INDEX IF NOT EXISTS "GeneratedPaper_organizationId_idx" ON public."GeneratedPaper"("organizationId");

CREATE TABLE IF NOT EXISTS public."GenerationJob" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"    TEXT NOT NULL,
  "bullmqJobId"     TEXT NOT NULL DEFAULT '',
  "generationSeq"   INTEGER NOT NULL DEFAULT 0,
  "progressVersion" INTEGER NOT NULL DEFAULT 0,
  "stageIndex"      INTEGER NOT NULL DEFAULT 0,
  "status"          TEXT NOT NULL DEFAULT 'queued',
  "progress"        INTEGER NOT NULL DEFAULT 0,
  "error"           TEXT,
  "startedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt"     TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GenerationJob_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES public."Assignment"("id")
);

CREATE INDEX IF NOT EXISTS "GenerationJob_assignmentId_status_idx" ON public."GenerationJob"("assignmentId", "status");
CREATE INDEX IF NOT EXISTS "GenerationJob_assignmentId_generationSeq_createdAt_idx" ON public."GenerationJob"("assignmentId", "generationSeq", "createdAt");
CREATE INDEX IF NOT EXISTS "GenerationJob_status_createdAt_idx" ON public."GenerationJob"("status", "createdAt");

CREATE OR REPLACE TRIGGER "GenerationJob_updated_at"
  BEFORE UPDATE ON public."GenerationJob"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Realtime for GenerationJob
ALTER PUBLICATION supabase_realtime ADD TABLE public."GenerationJob";

-- ── QuestionBank ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."QuestionBank" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "content"        TEXT NOT NULL,
  "options"        JSONB,
  "organizationId" TEXT NOT NULL,
  "answer"         TEXT,
  "hint"           TEXT,
  "subject"        TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "difficulty"     "Difficulty" NOT NULL,
  "bloomLevel"     "BloomLevel" NOT NULL,
  "tags"           TEXT[] NOT NULL DEFAULT '{}',
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionBank_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionBank_organizationId_idx" ON public."QuestionBank"("organizationId");
CREATE INDEX IF NOT EXISTS "QuestionBank_subject_idx" ON public."QuestionBank"("subject");
CREATE INDEX IF NOT EXISTS "QuestionBank_difficulty_idx" ON public."QuestionBank"("difficulty");
CREATE INDEX IF NOT EXISTS "QuestionBank_bloomLevel_idx" ON public."QuestionBank"("bloomLevel");

CREATE OR REPLACE TRIGGER "QuestionBank_updated_at"
  BEFORE UPDATE ON public."QuestionBank"
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public."QuestionVersion" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "questionId"    TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "content"       TEXT NOT NULL,
  "options"       JSONB,
  "answer"        TEXT,
  "updatedBy"     TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES public."QuestionBank"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionVersion_questionId_idx" ON public."QuestionVersion"("questionId");

CREATE TABLE IF NOT EXISTS public."QuestionCollection" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuestionCollection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionCollection_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuestionCollection_userId_idx" ON public."QuestionCollection"("userId");

CREATE TABLE IF NOT EXISTS public."_QuestionBankToQuestionCollection" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_QuestionBankToQuestionCollection_AB_unique"
  ON public."_QuestionBankToQuestionCollection"("A", "B");
CREATE INDEX IF NOT EXISTS "_QuestionBankToQuestionCollection_B_index"
  ON public."_QuestionBankToQuestionCollection"("B");

-- ── Grading ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Rubric" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "organizationId" TEXT,
  "authorId"       TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Rubric_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Rubric_organizationId_idx" ON public."Rubric"("organizationId");

CREATE TABLE IF NOT EXISTS public."RubricCriterion" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "rubricId"    TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "maxMarks"    INTEGER NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId")
    REFERENCES public."Rubric"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RubricCriterion_rubricId_idx" ON public."RubricCriterion"("rubricId");

CREATE TABLE IF NOT EXISTS public."AssignmentGradingConfig" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"  TEXT NOT NULL,
  "rubricId"      TEXT,
  "answerKeyText" TEXT NOT NULL DEFAULT '',
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AssignmentGradingConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssignmentGradingConfig_assignmentId_key" UNIQUE ("assignmentId"),
  CONSTRAINT "AssignmentGradingConfig_rubricId_fkey" FOREIGN KEY ("rubricId")
    REFERENCES public."Rubric"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public."StudentSubmission" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"   TEXT NOT NULL,
  "studentId"      TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fileUrl"        TEXT NOT NULL,
  "fileType"       TEXT NOT NULL,
  "status"         "AttemptStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "StudentSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentSubmission_assignmentId_studentId_key" UNIQUE ("assignmentId", "studentId"),
  CONSTRAINT "StudentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES public."Assignment"("id") ON DELETE CASCADE,
  CONSTRAINT "StudentSubmission_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "StudentSubmission_assignmentId_idx" ON public."StudentSubmission"("assignmentId");
CREATE INDEX IF NOT EXISTS "StudentSubmission_studentId_idx" ON public."StudentSubmission"("studentId");
CREATE INDEX IF NOT EXISTS "StudentSubmission_organizationId_idx" ON public."StudentSubmission"("organizationId");

CREATE TABLE IF NOT EXISTS public."SubmissionEvaluation" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "submissionId"    TEXT NOT NULL,
  "score"           DOUBLE PRECISION NOT NULL,
  "totalMarks"      DOUBLE PRECISION NOT NULL,
  "generalFeedback" TEXT NOT NULL,
  "criteriaGrades"  JSONB NOT NULL,
  "teacherOverride" JSONB,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SubmissionEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionEvaluation_submissionId_key" UNIQUE ("submissionId"),
  CONSTRAINT "SubmissionEvaluation_submissionId_fkey" FOREIGN KEY ("submissionId")
    REFERENCES public."StudentSubmission"("id") ON DELETE CASCADE
);

-- ── Subscription / Invoice ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Subscription" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organizationId"   TEXT NOT NULL,
  "plan"             "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  "status"           TEXT NOT NULL DEFAULT 'ACTIVE',
  "stripeCustomerId" TEXT,
  "stripeSubId"      TEXT,
  "expiresAt"        TIMESTAMPTZ NOT NULL,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_organizationId_key" UNIQUE ("organizationId"),
  CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id")
);

CREATE INDEX IF NOT EXISTS "Subscription_organizationId_idx" ON public."Subscription"("organizationId");

CREATE TABLE IF NOT EXISTS public."Invoice" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "subscriptionId" TEXT NOT NULL,
  "amount"         DOUBLE PRECISION NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "status"         TEXT NOT NULL,
  "pdfUrl"         TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId")
    REFERENCES public."Subscription"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Invoice_subscriptionId_idx" ON public."Invoice"("subscriptionId");

-- ── AuditLog ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."AuditLog" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT,
  "organizationId" TEXT,
  "action"         TEXT NOT NULL,
  "entity"         TEXT,
  "entityId"       TEXT,
  "ipAddress"      TEXT NOT NULL,
  "userAgent"      TEXT NOT NULL,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON public."AuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON public."AuditLog"("createdAt");

-- ── Notification ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."Notification" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'INFO',
  "isRead"         BOOLEAN NOT NULL DEFAULT FALSE,
  "link"           TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON public."Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_organizationId_idx" ON public."Notification"("organizationId");

-- Enable Realtime for Notification
ALTER PUBLICATION supabase_realtime ADD TABLE public."Notification";

-- ── QuizSession ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."QuizSession" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "topic"            TEXT NOT NULL,
  "subject"          TEXT NOT NULL,
  "organizationId"   TEXT,
  "difficulty"       TEXT NOT NULL,
  "bloomLevel"       TEXT NOT NULL,
  "timeLimitSeconds" INTEGER NOT NULL,
  "timeTakenSeconds" INTEGER NOT NULL,
  "totalQuestions"   INTEGER NOT NULL,
  "score"            INTEGER NOT NULL,
  "attempts"         JSONB NOT NULL,
  "userId"           TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuizSession_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuizSession_userId_createdAt_idx" ON public."QuizSession"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "QuizSession_organizationId_idx" ON public."QuizSession"("organizationId");

CREATE TABLE IF NOT EXISTS public."QuizSessionQuestion" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionId"         TEXT NOT NULL,
  "questionIndex"     INTEGER NOT NULL,
  "questionText"      TEXT NOT NULL,
  "options"           JSONB NOT NULL,
  "answer"            TEXT NOT NULL,
  "hint"              TEXT,
  "difficulty"        TEXT NOT NULL,
  "bloomLevel"        TEXT NOT NULL,
  "aiConfidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "QuizSessionQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuizSessionQuestion_sessionId_fkey" FOREIGN KEY ("sessionId")
    REFERENCES public."QuizSession"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "QuizSessionQuestion_sessionId_idx" ON public."QuizSessionQuestion"("sessionId");

-- ── Prompt Templates ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."PromptTemplate" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "organizationId" TEXT,
  CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptTemplate_name_key" UNIQUE ("name"),
  CONSTRAINT "PromptTemplate_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PromptTemplate_organizationId_idx" ON public."PromptTemplate"("organizationId");

CREATE TABLE IF NOT EXISTS public."PromptVersion" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "templateId"    TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "systemPrompt"  TEXT NOT NULL,
  "userPrompt"    TEXT NOT NULL,
  "isActive"      BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptVersion_templateId_fkey" FOREIGN KEY ("templateId")
    REFERENCES public."PromptTemplate"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PromptVersion_templateId_idx" ON public."PromptVersion"("templateId");

CREATE TABLE IF NOT EXISTS public."PromptExecution" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "promptVersionId"  TEXT NOT NULL,
  "providerName"     TEXT NOT NULL,
  "modelName"        TEXT NOT NULL,
  "tokensPrompt"     INTEGER NOT NULL,
  "tokensCompletion" INTEGER NOT NULL,
  "costUsd"          DOUBLE PRECISION NOT NULL,
  "durationMs"       INTEGER NOT NULL,
  "status"           TEXT NOT NULL,
  "errorMessage"     TEXT,
  "userId"           TEXT NOT NULL,
  "organizationId"   TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PromptExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptExecution_promptVersionId_fkey" FOREIGN KEY ("promptVersionId")
    REFERENCES public."PromptVersion"("id"),
  CONSTRAINT "PromptExecution_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PromptExecution_organizationId_idx" ON public."PromptExecution"("organizationId");

-- ── AI Features ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."AIRecommendation" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"       TEXT,
  "groupId"         TEXT,
  "type"            TEXT NOT NULL,
  "content"         TEXT NOT NULL,
  "suggestedTopics" JSONB NOT NULL,
  "organizationId"  TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AIRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AIRecommendation_organizationId_idx" ON public."AIRecommendation"("organizationId");

CREATE TABLE IF NOT EXISTS public."LessonPlan" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "grade"          TEXT NOT NULL,
  "duration"       TEXT NOT NULL,
  "objectives"     TEXT NOT NULL,
  "activities"     JSONB NOT NULL,
  "assessments"    JSONB NOT NULL,
  "content"        TEXT NOT NULL,
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonPlan_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "LessonPlan_userId_idx" ON public."LessonPlan"("userId");
CREATE INDEX IF NOT EXISTS "LessonPlan_organizationId_idx" ON public."LessonPlan"("organizationId");

CREATE TABLE IF NOT EXISTS public."Worksheet" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "difficulty"     TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "answerKey"      TEXT NOT NULL,
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Worksheet_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Worksheet_userId_idx" ON public."Worksheet"("userId");
CREATE INDEX IF NOT EXISTS "Worksheet_organizationId_idx" ON public."Worksheet"("organizationId");

CREATE TABLE IF NOT EXISTS public."GeneratedNotes" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "type"           TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GeneratedNotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedNotes_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "GeneratedNotes_userId_idx" ON public."GeneratedNotes"("userId");
CREATE INDEX IF NOT EXISTS "GeneratedNotes_organizationId_idx" ON public."GeneratedNotes"("organizationId");

-- ── Community Hub ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public."CommunityPost" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "authorId"       TEXT NOT NULL,
  "title"          TEXT,
  "content"        TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'DISCUSSION',
  "attachments"    JSONB DEFAULT '[]',
  "tags"           JSONB DEFAULT '[]',
  "imageUrl"       TEXT,
  "likesCount"     INTEGER NOT NULL DEFAULT 0,
  "commentsCount"  INTEGER NOT NULL DEFAULT 0,
  "visibility"     TEXT NOT NULL DEFAULT 'PUBLIC',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "CommunityPost_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON public."CommunityPost"("authorId");
CREATE INDEX IF NOT EXISTS "CommunityPost_organizationId_idx" ON public."CommunityPost"("organizationId");
CREATE INDEX IF NOT EXISTS "CommunityPost_createdAt_idx" ON public."CommunityPost"("createdAt");

CREATE TABLE IF NOT EXISTS public."CommunityGroup" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "ownerId"        TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'PUBLIC',
  "avatar"         TEXT,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityGroup_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "CommunityGroup_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CommunityGroup_ownerId_idx" ON public."CommunityGroup"("ownerId");
CREATE INDEX IF NOT EXISTS "CommunityGroup_organizationId_idx" ON public."CommunityGroup"("organizationId");

CREATE TABLE IF NOT EXISTS public."GroupMember" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "role"     TEXT NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupMember_groupId_userId_key" UNIQUE ("groupId", "userId"),
  CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES public."CommunityGroup"("id") ON DELETE CASCADE,
  CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "GroupMember_userId_idx" ON public."GroupMember"("userId");

CREATE TABLE IF NOT EXISTS public."Message" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "attachments"    JSONB DEFAULT '[]',
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON public."Message"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON public."Message"("senderId");

CREATE TABLE IF NOT EXISTS public."VoiceRoom" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "createdById"    TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'CASUAL',
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "VoiceRoom_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoiceRoom_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "VoiceRoom_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "VoiceRoom_createdById_idx" ON public."VoiceRoom"("createdById");
CREATE INDEX IF NOT EXISTS "VoiceRoom_organizationId_idx" ON public."VoiceRoom"("organizationId");

CREATE TABLE IF NOT EXISTS public."VoiceRoomParticipant" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "roomId"   TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "leftAt"   TIMESTAMPTZ,
  CONSTRAINT "VoiceRoomParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoiceRoomParticipant_roomId_userId_key" UNIQUE ("roomId", "userId"),
  CONSTRAINT "VoiceRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId")
    REFERENCES public."VoiceRoom"("id") ON DELETE CASCADE,
  CONSTRAINT "VoiceRoomParticipant_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES public."User"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "VoiceRoomParticipant_roomId_idx" ON public."VoiceRoomParticipant"("roomId");
CREATE INDEX IF NOT EXISTS "VoiceRoomParticipant_userId_idx" ON public."VoiceRoomParticipant"("userId");

CREATE TABLE IF NOT EXISTS public."Meeting" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "hostId"         TEXT NOT NULL,
  "scheduledAt"    TIMESTAMPTZ NOT NULL,
  "meetingLink"    TEXT,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Meeting_hostId_fkey" FOREIGN KEY ("hostId")
    REFERENCES public."User"("id") ON DELETE CASCADE,
  CONSTRAINT "Meeting_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES public."Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Meeting_hostId_idx" ON public."Meeting"("hostId");
CREATE INDEX IF NOT EXISTS "Meeting_organizationId_idx" ON public."Meeting"("organizationId");
