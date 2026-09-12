-- =============================================================================
-- 05_indexes.sql
-- Additional Performance Indexes for VedaAI on Supabase
-- Generated: 2026-06-24
--
-- These indexes are supplementary to those in 02_supabase_schema.sql.
-- They target high-frequency query patterns identified from the service layer.
--
-- Run AFTER 02_supabase_schema.sql.
-- Use CREATE INDEX CONCURRENTLY in production to avoid table locks.
-- =============================================================================

-- =============================================================================
-- User Lookup Indexes
-- =============================================================================

-- Full-text search on user names (used in admin user search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_firstName_idx"
  ON public."User" USING btree ("firstName");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_lastName_idx"
  ON public."User" USING btree ("lastName");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_role_status_idx"
  ON public."User" USING btree ("role", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_organizationId_role_idx"
  ON public."User" USING btree ("organizationId", "role");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_organizationId_status_idx"
  ON public."User" USING btree ("organizationId", "status");

-- Partial index: only active users (very common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_active_org_idx"
  ON public."User" ("organizationId")
  WHERE "status" = 'ACTIVE';

-- =============================================================================
-- Assignment Lookup Indexes
-- =============================================================================

-- Most-used query: org + status + paginated by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_org_status_createdAt_idx"
  ON public."Assignment" USING btree ("organizationId", "status", "createdAt" DESC);

-- Creator-specific assignment lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_createdById_status_idx"
  ON public."Assignment" USING btree ("createdById", "status");

-- Subject filter within org
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_org_subject_idx"
  ON public."Assignment" USING btree ("organizationId", "subject");

-- Partial index: only active/in-progress assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_active_idx"
  ON public."Assignment" ("organizationId", "createdAt" DESC)
  WHERE "status" IN ('DRAFT', 'GENERATING', 'GENERATED', 'PENDING_APPROVAL', 'APPROVED');

-- =============================================================================
-- GenerationJob Indexes
-- =============================================================================

-- Active job lookup (very hot path — polled during generation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "GenerationJob_active_jobs_idx"
  ON public."GenerationJob" ("assignmentId", "generationSeq" DESC)
  WHERE "status" NOT IN ('completed', 'failed', 'cancelled');

-- Failed jobs for retry logic
CREATE INDEX CONCURRENTLY IF NOT EXISTS "GenerationJob_failed_idx"
  ON public."GenerationJob" ("createdAt" DESC)
  WHERE "status" = 'failed';

-- =============================================================================
-- GeneratedPaper Indexes
-- =============================================================================

-- Latest paper per assignment (common: "show most recent paper")
CREATE INDEX CONCURRENTLY IF NOT EXISTS "GeneratedPaper_latest_per_assignment_idx"
  ON public."GeneratedPaper" USING btree ("assignmentId", "generatedAt" DESC);

-- =============================================================================
-- QuestionBank Indexes
-- =============================================================================

-- The most common question bank search: org + subject + difficulty + bloom
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuestionBank_search_idx"
  ON public."QuestionBank" USING btree ("organizationId", "subject", "difficulty", "bloomLevel");

-- Topic-specific search within subject
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuestionBank_subject_topic_idx"
  ON public."QuestionBank" USING btree ("subject", "topic");

-- Tags GIN index for array contains queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuestionBank_tags_gin_idx"
  ON public."QuestionBank" USING gin ("tags");

-- Active-only partial index
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuestionBank_active_idx"
  ON public."QuestionBank" ("organizationId", "subject")
  WHERE "isActive" = TRUE;

-- =============================================================================
-- Question Indexes
-- =============================================================================

-- Published question discovery
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Question_published_bloom_difficulty_idx"
  ON public."Question" ("bloomLevel", "difficulty")
  WHERE "isPublished" = TRUE;

-- Author question library
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Question_authorId_createdAt_idx"
  ON public."Question" USING btree ("authorId", "createdAt" DESC);

-- =============================================================================
-- Notification Indexes
-- =============================================================================

-- Unread notifications count (very frequent)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_userId_unread_idx"
  ON public."Notification" ("userId", "createdAt" DESC)
  WHERE "isRead" = FALSE;

-- =============================================================================
-- Session / Auth Token Indexes
-- =============================================================================

-- Active sessions (used in auth middleware to validate sessions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_active_user_idx"
  ON public."Session" ("userId", "expiresAt")
  WHERE "isActive" = TRUE;

-- Valid tokens (used frequently during auth)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "RefreshToken_valid_user_idx"
  ON public."RefreshToken" ("userId", "expiresAt")
  WHERE "isRevoked" = FALSE;

-- =============================================================================
-- Syllabus / Curriculum Indexes
-- =============================================================================

-- Faculty syllabus list
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Syllabus_userId_subject_idx"
  ON public."Syllabus" USING btree ("userId", "subject");

-- Org-wide curriculum browse
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Syllabus_org_grade_subject_idx"
  ON public."Syllabus" USING btree ("organizationId", "grade", "subject");

-- =============================================================================
-- StudentSubmission Indexes
-- =============================================================================

-- Grading queue: all submissions for an assignment
CREATE INDEX CONCURRENTLY IF NOT EXISTS "StudentSubmission_grading_idx"
  ON public."StudentSubmission" USING btree ("assignmentId", "status", "submittedAt");

-- Student portfolio
CREATE INDEX CONCURRENTLY IF NOT EXISTS "StudentSubmission_student_history_idx"
  ON public."StudentSubmission" USING btree ("studentId", "submittedAt" DESC);

-- =============================================================================
-- QuizSession Indexes
-- =============================================================================

-- Recent quiz history for a user
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuizSession_user_recent_idx"
  ON public."QuizSession" USING btree ("userId", "createdAt" DESC);

-- Org analytics: quiz activity by subject
CREATE INDEX CONCURRENTLY IF NOT EXISTS "QuizSession_org_subject_idx"
  ON public."QuizSession" USING btree ("organizationId", "subject", "createdAt" DESC);

-- =============================================================================
-- AuditLog Indexes
-- =============================================================================

-- Admin audit log browsing: by org, filtered by entity and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_org_entity_idx"
  ON public."AuditLog" USING btree ("organizationId", "entity", "createdAt" DESC);

-- User-specific audit trail
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_userId_idx"
  ON public."AuditLog" USING btree ("userId", "createdAt" DESC);

-- =============================================================================
-- Community Indexes
-- =============================================================================

-- Public post feed (home feed sorted by recency)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "CommunityPost_public_feed_idx"
  ON public."CommunityPost" USING btree ("createdAt" DESC)
  WHERE "visibility" = 'PUBLIC';

-- Message thread retrieval
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_conversation_idx"
  ON public."Message" USING btree ("conversationId", "createdAt" ASC);

-- =============================================================================
-- AI Features Indexes
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "LessonPlan_user_subject_idx"
  ON public."LessonPlan" USING btree ("userId", "subject", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Worksheet_user_subject_idx"
  ON public."Worksheet" USING btree ("userId", "subject", "difficulty");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "GeneratedNotes_user_topic_idx"
  ON public."GeneratedNotes" USING btree ("userId", "subject", "topic");

-- =============================================================================
-- PromptExecution Indexes (AI Usage Analytics)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "PromptExecution_org_date_idx"
  ON public."PromptExecution" USING btree ("organizationId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "PromptExecution_provider_idx"
  ON public."PromptExecution" USING btree ("providerName", "createdAt" DESC);

-- =============================================================================
-- Invitation Indexes
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Invitation_email_status_idx"
  ON public."Invitation" USING btree ("email", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Invitation_token_idx"
  ON public."Invitation" USING btree ("token")
  WHERE "status" = 'PENDING';

-- =============================================================================
-- Department Indexes
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Department_org_name_idx"
  ON public."Department" USING btree ("organizationId", "name");

-- =============================================================================
-- Classroom/Section/Group Indexes
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Section_teacherId_idx"
  ON public."Section" USING btree ("teacherId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Enrollment_studentId_idx"
  ON public."Enrollment" USING btree ("studentId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ClassGroup_org_userId_idx"
  ON public."ClassGroup" USING btree ("organizationId", "userId");

-- =============================================================================
-- Statistics Query: Summary report
-- =============================================================================

-- Count assignments by status per org (dashboard stats)
-- Usage: SELECT status, COUNT(*) FROM "Assignment" WHERE "organizationId" = $1 GROUP BY status
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_org_status_count_idx"
  ON public."Assignment" USING btree ("organizationId", "status");

-- Count users per org per role (admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_org_role_count_idx"
  ON public."User" USING btree ("organizationId", "role")
  WHERE "status" = 'ACTIVE';
