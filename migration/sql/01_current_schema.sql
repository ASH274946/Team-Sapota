-- =============================================================================
-- 01_current_schema.sql
-- Current VedaAI schema extracted from apps/backend/prisma/schema.prisma
-- Generated: 2026-06-24
-- This is the SOURCE OF TRUTH for the existing Neon database structure.
-- Use this as a reference when validating the Supabase migration.
-- =============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT');

CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'ARCHIVED');

CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

CREATE TYPE "WorkflowStatus" AS ENUM (
  'DRAFT', 'GENERATING', 'GENERATED', 'PARTIALLY_GENERATED', 'FAILED',
  'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ACTIVE',
  'COMPLETED', 'ARCHIVED'
);

CREATE TYPE "AttemptStatus" AS ENUM (
  'AVAILABLE', 'STARTED', 'IN_PROGRESS', 'SUBMITTED',
  'UNDER_REVIEW', 'GRADED', 'RESULT_PUBLISHED', 'ARCHIVED'
);

CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

CREATE TYPE "BloomLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- ── Organization ────────────────────────────────────────────────────────────

CREATE TABLE "Organization" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"             TEXT NOT NULL,
  "slug"             TEXT UNIQUE,
  "code"             TEXT NOT NULL UNIQUE,
  "email"            TEXT,
  "phone"            TEXT,
  "address"          TEXT,
  "logo"             TEXT,
  "subscriptionPlan" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  "status"           "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- ── Department ───────────────────────────────────────────────────────────────

CREATE TABLE "Department" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "code"           TEXT,
  "status"         TEXT NOT NULL DEFAULT 'ACTIVE',
  "hodId"          TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- ── User ─────────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"                  TEXT NOT NULL UNIQUE,
  "passwordHash"           TEXT NOT NULL,
  "firstName"              TEXT NOT NULL,
  "lastName"               TEXT NOT NULL,
  "role"                   "SystemRole" NOT NULL DEFAULT 'TEACHER',
  "phone"                  TEXT,
  "status"                 TEXT NOT NULL DEFAULT 'ACTIVE',
  "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT FALSE,
  "onboardingCompletedAt"  TIMESTAMP(3),
  "forcePasswordReset"     BOOLEAN NOT NULL DEFAULT FALSE,
  "activeOrganizationId"   TEXT,
  "organizationId"         TEXT,
  "departmentId"           TEXT,
  "preferences"            JSONB,
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId")
    REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ── Session ──────────────────────────────────────────────────────────────────

CREATE TABLE "Session" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- ── RefreshToken ─────────────────────────────────────────────────────────────

CREATE TABLE "RefreshToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userId"    TEXT NOT NULL,
  "isRevoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- ── LoginHistory ─────────────────────────────────────────────────────────────

CREATE TABLE "LoginHistory" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "country"   TEXT,
  "status"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- ── EmailVerificationToken ───────────────────────────────────────────────────

CREATE TABLE "EmailVerificationToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"     TEXT NOT NULL UNIQUE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- ── PasswordResetToken ───────────────────────────────────────────────────────

CREATE TABLE "PasswordResetToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- ── Role / Permission / UserRole (RBAC) ──────────────────────────────────────

CREATE TABLE "Role" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_RolePermissions" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE,
  CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "_RolePermissions_AB_unique" ON "_RolePermissions"("A", "B");
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

CREATE TABLE "UserRole" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "roleId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserRole_userId_roleId_key" UNIQUE ("userId", "roleId"),
  CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
);

CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- ── Invitation ───────────────────────────────────────────────────────────────

CREATE TABLE "Invitation" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"          TEXT NOT NULL,
  "role"           "SystemRole" NOT NULL,
  "organizationId" TEXT NOT NULL,
  "token"          TEXT NOT NULL UNIQUE,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "acceptedAt"     TIMESTAMP(3),
  "createdById"    TEXT NOT NULL,
  "status"         "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Invitation_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "User"("id") ON UPDATE CASCADE
);

CREATE INDEX "Invitation_organizationId_idx" ON "Invitation"("organizationId");

-- ── Classroom / Section / Enrollment ─────────────────────────────────────────

CREATE TABLE "Classroom" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Classroom_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Classroom_organizationId_idx" ON "Classroom"("organizationId");

CREATE TABLE "Section" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "teacherId"   TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Section_classroomId_fkey" FOREIGN KEY ("classroomId")
    REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Section_teacherId_fkey" FOREIGN KEY ("teacherId")
    REFERENCES "User"("id") ON UPDATE CASCADE
);

CREATE INDEX "Section_classroomId_idx" ON "Section"("classroomId");

CREATE TABLE "Enrollment" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sectionId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Enrollment_sectionId_studentId_key" UNIQUE ("sectionId", "studentId"),
  CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId")
    REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId")
    REFERENCES "User"("id") ON UPDATE CASCADE
);

-- ── Class / Group (with student rosters) ─────────────────────────────────────

CREATE TABLE "Class" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "grade"          TEXT NOT NULL,
  "section"        TEXT NOT NULL,
  "academicYear"   TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "facultyId"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Class_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Class_facultyId_fkey" FOREIGN KEY ("facultyId")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Class_organizationId_idx" ON "Class"("organizationId");
CREATE INDEX "Class_facultyId_idx" ON "Class"("facultyId");

CREATE TABLE "ClassStudent" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "classId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassStudent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClassStudent_classId_fkey" FOREIGN KEY ("classId")
    REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ClassStudent_classId_idx" ON "ClassStudent"("classId");

CREATE TABLE "Group" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "subject"        TEXT NOT NULL DEFAULT 'General',
  "organizationId" TEXT NOT NULL,
  "facultyId"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Group_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Group_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Group_facultyId_fkey" FOREIGN KEY ("facultyId")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Group_organizationId_idx" ON "Group"("organizationId");
CREATE INDEX "Group_facultyId_idx" ON "Group"("facultyId");

CREATE TABLE "GroupStudent" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupStudent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupStudent_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GroupStudent_groupId_idx" ON "GroupStudent"("groupId");

-- ── Legacy ClassGroup / Student ───────────────────────────────────────────────

CREATE TABLE "ClassGroup" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "subject"        TEXT NOT NULL DEFAULT 'General',
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClassGroup_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ClassGroup_userId_idx" ON "ClassGroup"("userId");

CREATE TABLE "Student" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "rollNo"   TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- ── Syllabus ─────────────────────────────────────────────────────────────────

CREATE TABLE "Syllabus" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "grade"          TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'active',
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Syllabus_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Syllabus_userId_idx" ON "Syllabus"("userId");
CREATE INDEX "Syllabus_organizationId_idx" ON "Syllabus"("organizationId");

CREATE TABLE "SyllabusTopic" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "syllabusId"  TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "duration"    INTEGER NOT NULL DEFAULT 60,
  "completed"   BOOLEAN NOT NULL DEFAULT FALSE,
  "topicOrder"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyllabusTopic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SyllabusTopic_syllabusId_fkey" FOREIGN KEY ("syllabusId")
    REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SyllabusTopic_syllabusId_idx" ON "SyllabusTopic"("syllabusId");

CREATE TABLE "SyllabusSubtopic" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "topicId"    TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "completed"  BOOLEAN NOT NULL DEFAULT FALSE,
  "topicOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SyllabusSubtopic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SyllabusSubtopic_topicId_fkey" FOREIGN KEY ("topicId")
    REFERENCES "SyllabusTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SyllabusSubtopic_topicId_idx" ON "SyllabusSubtopic"("topicId");

-- ── Questions & Assessment ────────────────────────────────────────────────────

CREATE TABLE "Question" (
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
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES "User"("id") ON UPDATE CASCADE,
  CONSTRAINT "Question_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Question_bloomLevel_idx" ON "Question"("bloomLevel");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
CREATE INDEX "Question_isPublished_idx" ON "Question"("isPublished");
CREATE INDEX "Question_subjectId_idx" ON "Question"("subjectId");
CREATE INDEX "Question_organizationId_idx" ON "Question"("organizationId");

CREATE TABLE "QuestionReview" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "questionId"      TEXT NOT NULL,
  "reviewerId"      TEXT NOT NULL,
  "status"          TEXT NOT NULL,
  "comments"        TEXT,
  "reason"          TEXT,
  "requiredChanges" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionReview_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES "Question"("id") ON UPDATE CASCADE,
  CONSTRAINT "QuestionReview_reviewerId_fkey" FOREIGN KEY ("reviewerId")
    REFERENCES "User"("id") ON UPDATE CASCADE
);

CREATE INDEX "QuestionReview_questionId_idx" ON "QuestionReview"("questionId");
CREATE INDEX "QuestionReview_reviewerId_idx" ON "QuestionReview"("reviewerId");

CREATE TABLE "Assessment" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subjectId"      TEXT,
  "totalMarks"     INTEGER NOT NULL DEFAULT 100,
  "status"         TEXT NOT NULL DEFAULT 'DRAFT',
  "authorId"       TEXT NOT NULL,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Assessment_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES "User"("id") ON UPDATE CASCADE,
  CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Assessment_organizationId_idx" ON "Assessment"("organizationId");

CREATE TABLE "AssessmentQuestion" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assessmentId" TEXT NOT NULL,
  "questionId"   TEXT NOT NULL,
  "marks"        INTEGER NOT NULL DEFAULT 1,
  "order"        INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId")
    REFERENCES "Assessment"("id") ON UPDATE CASCADE,
  CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES "Question"("id") ON UPDATE CASCADE
);

CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- ── Assignment & Papers ───────────────────────────────────────────────────────

CREATE TABLE "Assignment" (
  "id"                     TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"                  TEXT NOT NULL,
  "subject"                TEXT NOT NULL,
  "organizationId"         TEXT NOT NULL,
  "createdById"            TEXT,
  "classId"                TEXT,
  "description"            TEXT NOT NULL DEFAULT '',
  "dueDate"                TIMESTAMP(3) NOT NULL,
  "duration"               INTEGER NOT NULL,
  "totalMarks"             INTEGER NOT NULL,
  "questionConfig"         JSONB NOT NULL,
  "uploadedFiles"          JSONB NOT NULL DEFAULT '[]',
  "additionalInstructions" TEXT NOT NULL DEFAULT '',
  "typeBreakdown"          TEXT,
  "status"                 "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "approvedBy"             TEXT,
  "approvedAt"             TIMESTAMP(3),
  "rejectedBy"             TEXT,
  "rejectedAt"             TIMESTAMP(3),
  "reviewComments"         TEXT,
  "publishedAt"            TIMESTAMP(3),
  "generationMeta"         JSONB,
  "generationSeq"          INTEGER NOT NULL DEFAULT 0,
  "activeGenerationJobId"  TEXT,
  "finalizedAt"            TIMESTAMP(3),
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Assignment_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId")
    REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Assignment_status_createdAt_idx" ON "Assignment"("status", "createdAt");
CREATE INDEX "Assignment_subject_idx" ON "Assignment"("subject");
CREATE INDEX "Assignment_organizationId_idx" ON "Assignment"("organizationId");
CREATE INDEX "Assignment_createdById_idx" ON "Assignment"("createdById");
CREATE INDEX "Assignment_classId_idx" ON "Assignment"("classId");

CREATE TABLE "GeneratedPaper" (
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
  "generatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GeneratedPaper_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedPaper_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES "Assignment"("id") ON UPDATE CASCADE,
  CONSTRAINT "GeneratedPaper_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GeneratedPaper_assignmentId_generatedAt_idx" ON "GeneratedPaper"("assignmentId", "generatedAt");
CREATE INDEX "GeneratedPaper_organizationId_idx" ON "GeneratedPaper"("organizationId");

CREATE TABLE "GenerationJob" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"    TEXT NOT NULL,
  "bullmqJobId"     TEXT NOT NULL DEFAULT '',
  "generationSeq"   INTEGER NOT NULL DEFAULT 0,
  "progressVersion" INTEGER NOT NULL DEFAULT 0,
  "stageIndex"      INTEGER NOT NULL DEFAULT 0,
  "status"          TEXT NOT NULL DEFAULT 'queued',
  "progress"        INTEGER NOT NULL DEFAULT 0,
  "error"           TEXT,
  "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GenerationJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GenerationJob_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES "Assignment"("id") ON UPDATE CASCADE
);

CREATE INDEX "GenerationJob_assignmentId_status_idx" ON "GenerationJob"("assignmentId", "status");
CREATE INDEX "GenerationJob_assignmentId_generationSeq_createdAt_idx" ON "GenerationJob"("assignmentId", "generationSeq", "createdAt");
CREATE INDEX "GenerationJob_status_createdAt_idx" ON "GenerationJob"("status", "createdAt");

-- ── QuestionBank ──────────────────────────────────────────────────────────────

CREATE TABLE "QuestionBank" (
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
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionBank_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuestionBank_organizationId_idx" ON "QuestionBank"("organizationId");

CREATE TABLE "QuestionVersion" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "questionId"    TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "content"       TEXT NOT NULL,
  "options"       JSONB,
  "answer"        TEXT,
  "updatedBy"     TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId")
    REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuestionVersion_questionId_idx" ON "QuestionVersion"("questionId");

CREATE TABLE "QuestionCollection" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "userId"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuestionCollection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionCollection_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuestionCollection_userId_idx" ON "QuestionCollection"("userId");

CREATE TABLE "_QuestionBankToQuestionCollection" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_QuestionBankToQuestionCollection_AB_unique" ON "_QuestionBankToQuestionCollection"("A", "B");
CREATE INDEX "_QuestionBankToQuestionCollection_B_index" ON "_QuestionBankToQuestionCollection"("B");

-- ── Grading ───────────────────────────────────────────────────────────────────

CREATE TABLE "Rubric" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "organizationId" TEXT,
  "authorId"       TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Rubric_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Rubric_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Rubric_organizationId_idx" ON "Rubric"("organizationId");

CREATE TABLE "RubricCriterion" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "rubricId"    TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "maxMarks"    INTEGER NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId")
    REFERENCES "Rubric"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RubricCriterion_rubricId_idx" ON "RubricCriterion"("rubricId");

CREATE TABLE "AssignmentGradingConfig" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"  TEXT NOT NULL UNIQUE,
  "rubricId"      TEXT,
  "answerKeyText" TEXT NOT NULL DEFAULT '',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssignmentGradingConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssignmentGradingConfig_rubricId_fkey" FOREIGN KEY ("rubricId")
    REFERENCES "Rubric"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "StudentSubmission" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"   TEXT NOT NULL,
  "studentId"      TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "fileUrl"        TEXT NOT NULL,
  "fileType"       TEXT NOT NULL,
  "status"         "AttemptStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentSubmission_assignmentId_studentId_key" UNIQUE ("assignmentId", "studentId"),
  CONSTRAINT "StudentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId")
    REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StudentSubmission_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "StudentSubmission_assignmentId_idx" ON "StudentSubmission"("assignmentId");
CREATE INDEX "StudentSubmission_studentId_idx" ON "StudentSubmission"("studentId");
CREATE INDEX "StudentSubmission_organizationId_idx" ON "StudentSubmission"("organizationId");

CREATE TABLE "SubmissionEvaluation" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "submissionId"    TEXT NOT NULL UNIQUE,
  "score"           DOUBLE PRECISION NOT NULL,
  "totalMarks"      DOUBLE PRECISION NOT NULL,
  "generalFeedback" TEXT NOT NULL,
  "criteriaGrades"  JSONB NOT NULL,
  "teacherOverride" JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubmissionEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionEvaluation_submissionId_fkey" FOREIGN KEY ("submissionId")
    REFERENCES "StudentSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Subscription / Invoice ────────────────────────────────────────────────────

CREATE TABLE "Subscription" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organizationId"   TEXT NOT NULL UNIQUE,
  "plan"             "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  "status"           TEXT NOT NULL DEFAULT 'ACTIVE',
  "stripeCustomerId" TEXT,
  "stripeSubId"      TEXT,
  "expiresAt"        TIMESTAMP(3) NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON UPDATE CASCADE
);

CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

CREATE TABLE "Invoice" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "subscriptionId" TEXT NOT NULL,
  "amount"         DOUBLE PRECISION NOT NULL,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "status"         TEXT NOT NULL,
  "pdfUrl"         TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId")
    REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- ── Audit Log ─────────────────────────────────────────────────────────────────

CREATE TABLE "AuditLog" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT,
  "organizationId" TEXT,
  "action"         TEXT NOT NULL,
  "entity"         TEXT,
  "entityId"       TEXT,
  "ipAddress"      TEXT NOT NULL,
  "userAgent"      TEXT NOT NULL,
  "metadata"       JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ── Notification ──────────────────────────────────────────────────────────────

CREATE TABLE "Notification" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'INFO',
  "isRead"         BOOLEAN NOT NULL DEFAULT FALSE,
  "link"           TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- ── QuizSession ───────────────────────────────────────────────────────────────

CREATE TABLE "QuizSession" (
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
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuizSession_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuizSession_userId_createdAt_idx" ON "QuizSession"("userId", "createdAt");
CREATE INDEX "QuizSession_organizationId_idx" ON "QuizSession"("organizationId");

CREATE TABLE "QuizSessionQuestion" (
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
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizSessionQuestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuizSessionQuestion_sessionId_fkey" FOREIGN KEY ("sessionId")
    REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "QuizSessionQuestion_sessionId_idx" ON "QuizSessionQuestion"("sessionId");

-- ── Prompt Templates ──────────────────────────────────────────────────────────

CREATE TABLE "PromptTemplate" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL UNIQUE,
  "description"    TEXT,
  "organizationId" TEXT,
  CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptTemplate_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PromptTemplate_organizationId_idx" ON "PromptTemplate"("organizationId");

CREATE TABLE "PromptVersion" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "templateId"    TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "systemPrompt"  TEXT NOT NULL,
  "userPrompt"    TEXT NOT NULL,
  "isActive"      BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptVersion_templateId_fkey" FOREIGN KEY ("templateId")
    REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PromptVersion_templateId_idx" ON "PromptVersion"("templateId");

CREATE TABLE "PromptExecution" (
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
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromptExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromptExecution_promptVersionId_fkey" FOREIGN KEY ("promptVersionId")
    REFERENCES "PromptVersion"("id") ON UPDATE CASCADE,
  CONSTRAINT "PromptExecution_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PromptExecution_organizationId_idx" ON "PromptExecution"("organizationId");

-- ── AI Features ───────────────────────────────────────────────────────────────

CREATE TABLE "AIRecommendation" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"      TEXT,
  "groupId"        TEXT,
  "type"           TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "suggestedTopics" JSONB NOT NULL,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AIRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AIRecommendation_organizationId_idx" ON "AIRecommendation"("organizationId");

CREATE TABLE "LessonPlan" (
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
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonPlan_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LessonPlan_userId_idx" ON "LessonPlan"("userId");
CREATE INDEX "LessonPlan_organizationId_idx" ON "LessonPlan"("organizationId");

CREATE TABLE "Worksheet" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "difficulty"     TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "answerKey"      TEXT NOT NULL,
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Worksheet_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Worksheet_userId_idx" ON "Worksheet"("userId");
CREATE INDEX "Worksheet_organizationId_idx" ON "Worksheet"("organizationId");

CREATE TABLE "GeneratedNotes" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "topic"          TEXT NOT NULL,
  "type"           TEXT NOT NULL,
  "content"        TEXT NOT NULL,
  "userId"         TEXT NOT NULL DEFAULT 'demo-faculty-id',
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedNotes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedNotes_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GeneratedNotes_userId_idx" ON "GeneratedNotes"("userId");
CREATE INDEX "GeneratedNotes_organizationId_idx" ON "GeneratedNotes"("organizationId");

-- ── Community Hub ─────────────────────────────────────────────────────────────

CREATE TABLE "CommunityPost" (
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
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityPost_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
CREATE INDEX "CommunityPost_organizationId_idx" ON "CommunityPost"("organizationId");
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");

CREATE TABLE "CommunityGroup" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "ownerId"        TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'PUBLIC',
  "avatar"         TEXT,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityGroup_ownerId_fkey" FOREIGN KEY ("ownerId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CommunityGroup_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CommunityGroup_ownerId_idx" ON "CommunityGroup"("ownerId");
CREATE INDEX "CommunityGroup_organizationId_idx" ON "CommunityGroup"("organizationId");

CREATE TABLE "GroupMember" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "groupId"  TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "role"     TEXT NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupMember_groupId_userId_key" UNIQUE ("groupId", "userId"),
  CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId")
    REFERENCES "CommunityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

CREATE TABLE "Message" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "message"        TEXT NOT NULL,
  "attachments"    JSONB DEFAULT '[]',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

CREATE TABLE "VoiceRoom" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "createdById"    TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'CASUAL',
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoiceRoom_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoiceRoom_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VoiceRoom_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VoiceRoom_createdById_idx" ON "VoiceRoom"("createdById");
CREATE INDEX "VoiceRoom_organizationId_idx" ON "VoiceRoom"("organizationId");

CREATE TABLE "VoiceRoomParticipant" (
  "id"       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "roomId"   TEXT NOT NULL,
  "userId"   TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt"   TIMESTAMP(3),
  CONSTRAINT "VoiceRoomParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoiceRoomParticipant_roomId_userId_key" UNIQUE ("roomId", "userId"),
  CONSTRAINT "VoiceRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId")
    REFERENCES "VoiceRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VoiceRoomParticipant_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VoiceRoomParticipant_roomId_idx" ON "VoiceRoomParticipant"("roomId");
CREATE INDEX "VoiceRoomParticipant_userId_idx" ON "VoiceRoomParticipant"("userId");

CREATE TABLE "Meeting" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "hostId"         TEXT NOT NULL,
  "scheduledAt"    TIMESTAMP(3) NOT NULL,
  "meetingLink"    TEXT,
  "organizationId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Meeting_hostId_fkey" FOREIGN KEY ("hostId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Meeting_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Meeting_hostId_idx" ON "Meeting"("hostId");
CREATE INDEX "Meeting_organizationId_idx" ON "Meeting"("organizationId");
