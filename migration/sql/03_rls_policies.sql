-- =============================================================================
-- 03_rls_policies.sql
-- Row Level Security Policies for VedaAI on Supabase
-- Generated: 2026-06-24
--
-- IMPORTANT: This file assumes the custom JWT auth system is in place.
-- The backend sets the JWT claim "id" as the user identifier.
-- RLS policies use current_setting('app.current_user_id', TRUE) which is
-- set by the backend via: SET LOCAL app.current_user_id = '<userId>';
--
-- ARCHITECTURE NOTE:
-- The VedaAI backend uses custom JWTs (not Supabase Auth). Two approaches:
--
-- OPTION A (RECOMMENDED - Current Setup):
--   RLS is enforced at the APPLICATION layer via Prisma queries that always
--   include organizationId/userId filters. The SQL policies below are a
--   defense-in-depth layer using a custom session variable approach.
--
-- OPTION B (Future - Supabase Auth):
--   If you migrate to Supabase Auth, replace current_setting() with auth.uid()
--   and the policies become fully automatic.
--
-- Run this file AFTER 02_supabase_schema.sql
-- =============================================================================

-- ── Helper function: get current user from session variable ──────────────────
-- The backend sets this via: SET LOCAL app.current_user_id = '<userId>'
-- This allows RLS to work without Supabase Auth.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.current_user_id', TRUE);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User"
    WHERE "id" = public.current_app_user_id()
    AND "role" = 'SUPER_ADMIN'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS TEXT AS $$
  SELECT "organizationId" FROM public."User"
  WHERE "id" = public.current_app_user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================================================
-- Enable RLS on all tables
-- =============================================================================

ALTER TABLE public."Organization"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Department"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RefreshToken"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LoginHistory"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PasswordResetToken"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Permission"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserRole"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Invitation"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Classroom"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Section"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Enrollment"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Class"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassStudent"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Group"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GroupStudent"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassGroup"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Student"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Syllabus"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyllabusTopic"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyllabusSubtopic"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Question"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionReview"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Assessment"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AssessmentQuestion"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Assignment"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GeneratedPaper"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GenerationJob"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionBank"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionVersion"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionCollection"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Rubric"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RubricCriterion"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AssignmentGradingConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentSubmission"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SubmissionEvaluation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Invoice"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuizSession"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuizSessionQuestion"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromptTemplate"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromptVersion"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromptExecution"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIRecommendation"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LessonPlan"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Worksheet"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GeneratedNotes"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunityPost"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommunityGroup"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GroupMember"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VoiceRoom"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VoiceRoomParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Meeting"              ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SERVICE ROLE BYPASS (Backend uses service role key — bypasses RLS)
-- =============================================================================
-- IMPORTANT: The VedaAI backend connects with the SERVICE ROLE KEY which
-- bypasses RLS entirely. These policies are a safety net for direct client
-- connections and future Supabase Auth integration.
-- The backend Prisma client is NOT affected by RLS.

-- =============================================================================
-- Organization Policies
-- =============================================================================

-- Users can see their own organization. SUPER_ADMIN can see all.
CREATE POLICY "Organization: users see their org"
  ON public."Organization" FOR SELECT
  USING (
    public.is_super_admin()
    OR "id" = public.current_user_org_id()
  );

CREATE POLICY "Organization: super admin manage all"
  ON public."Organization" FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- =============================================================================
-- Department Policies
-- =============================================================================

CREATE POLICY "Department: users see their org departments"
  ON public."Department" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Department: admins manage departments"
  ON public."Department" FOR ALL
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

-- =============================================================================
-- User Policies
-- =============================================================================

-- Users can see members of their organization. Users can always see themselves.
CREATE POLICY "User: see own profile"
  ON public."User" FOR SELECT
  USING (
    public.is_super_admin()
    OR "id" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

-- Users can update their own profile
CREATE POLICY "User: update own profile"
  ON public."User" FOR UPDATE
  USING ("id" = public.current_app_user_id())
  WITH CHECK ("id" = public.current_app_user_id());

-- Only admins can create/delete users
CREATE POLICY "User: admins manage users"
  ON public."User" FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."User"
      WHERE "id" = public.current_app_user_id()
      AND "role" IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- =============================================================================
-- Session / RefreshToken / LoginHistory Policies (own data only)
-- =============================================================================

CREATE POLICY "Session: own sessions only"
  ON public."Session" FOR ALL
  USING ("userId" = public.current_app_user_id())
  WITH CHECK ("userId" = public.current_app_user_id());

CREATE POLICY "RefreshToken: own tokens only"
  ON public."RefreshToken" FOR ALL
  USING ("userId" = public.current_app_user_id())
  WITH CHECK ("userId" = public.current_app_user_id());

CREATE POLICY "LoginHistory: own history only"
  ON public."LoginHistory" FOR SELECT
  USING ("userId" = public.current_app_user_id());

CREATE POLICY "LoginHistory: insert own"
  ON public."LoginHistory" FOR INSERT
  WITH CHECK ("userId" = public.current_app_user_id());

-- =============================================================================
-- Token Tables (service role only — no direct user access needed)
-- =============================================================================

CREATE POLICY "EmailVerificationToken: service role only"
  ON public."EmailVerificationToken" FOR ALL
  USING (FALSE); -- Only accessible via service role (bypasses RLS)

CREATE POLICY "PasswordResetToken: own tokens"
  ON public."PasswordResetToken" FOR ALL
  USING ("userId" = public.current_app_user_id())
  WITH CHECK ("userId" = public.current_app_user_id());

-- =============================================================================
-- RBAC Tables
-- =============================================================================

CREATE POLICY "Role: all authenticated users can read"
  ON public."Role" FOR SELECT
  USING (public.current_app_user_id() IS NOT NULL);

CREATE POLICY "Role: super admin manages roles"
  ON public."Role" FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Permission: all authenticated users can read"
  ON public."Permission" FOR SELECT
  USING (public.current_app_user_id() IS NOT NULL);

CREATE POLICY "UserRole: users see their own roles"
  ON public."UserRole" FOR SELECT
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u."id" = public.current_app_user_id()
      AND u."role" IN ('ADMIN', 'SUPER_ADMIN')
      AND EXISTS (
        SELECT 1 FROM public."User" target
        WHERE target."id" = "UserRole"."userId"
        AND target."organizationId" = u."organizationId"
      )
    )
  );

-- =============================================================================
-- Invitation Policies
-- =============================================================================

CREATE POLICY "Invitation: org members can read invitations"
  ON public."Invitation" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Invitation: admins can create invitations"
  ON public."Invitation" FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

-- =============================================================================
-- Classroom / Section / Enrollment Policies
-- =============================================================================

CREATE POLICY "Classroom: org members can read"
  ON public."Classroom" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Classroom: admins manage"
  ON public."Classroom" FOR ALL
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'TEACHER', 'SUPER_ADMIN')
      )
    )
  )
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "Section: org members can read"
  ON public."Section" FOR SELECT
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Classroom" c
      WHERE c."id" = "Section"."classroomId"
      AND c."organizationId" = public.current_user_org_id()
    )
  );

CREATE POLICY "Enrollment: students see their own, teachers see their sections"
  ON public."Enrollment" FOR SELECT
  USING (
    public.is_super_admin()
    OR "studentId" = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public."Section" s
      WHERE s."id" = "Enrollment"."sectionId"
      AND s."teacherId" = public.current_app_user_id()
    )
  );

-- =============================================================================
-- Class / ClassStudent Policies
-- =============================================================================

CREATE POLICY "Class: org members can read"
  ON public."Class" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Class: teachers and admins manage"
  ON public."Class" FOR ALL
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'TEACHER', 'SUPER_ADMIN')
      )
    )
  )
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "ClassStudent: class faculty can manage"
  ON public."ClassStudent" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Class" c
      WHERE c."id" = "ClassStudent"."classId"
      AND (
        c."organizationId" = public.current_user_org_id()
        AND (c."facultyId" = public.current_app_user_id()
          OR public.is_super_admin()
          OR EXISTS (
            SELECT 1 FROM public."User"
            WHERE "id" = public.current_app_user_id()
            AND "role" IN ('ADMIN', 'SUPER_ADMIN')
          )
        )
      )
    )
  );

-- =============================================================================
-- Group / GroupStudent Policies
-- =============================================================================

CREATE POLICY "Group: org members can read"
  ON public."Group" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Group: faculty and admins manage"
  ON public."Group" FOR ALL
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND (
        "facultyId" = public.current_app_user_id()
        OR EXISTS (
          SELECT 1 FROM public."User"
          WHERE "id" = public.current_app_user_id()
          AND "role" IN ('ADMIN', 'SUPER_ADMIN')
        )
      )
    )
  )
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "GroupStudent: group faculty can manage"
  ON public."GroupStudent" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Group" g
      WHERE g."id" = "GroupStudent"."groupId"
      AND g."organizationId" = public.current_user_org_id()
    )
  );

-- =============================================================================
-- Syllabus Policies
-- =============================================================================

CREATE POLICY "Syllabus: org members can read"
  ON public."Syllabus" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
    OR "userId" = public.current_app_user_id()
  );

CREATE POLICY "Syllabus: owner can manage"
  ON public."Syllabus" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "SyllabusTopic: inherit from Syllabus"
  ON public."SyllabusTopic" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Syllabus" s
      WHERE s."id" = "SyllabusTopic"."syllabusId"
      AND (
        s."userId" = public.current_app_user_id()
        OR s."organizationId" = public.current_user_org_id()
      )
    )
  );

CREATE POLICY "SyllabusSubtopic: inherit from SyllabusTopic"
  ON public."SyllabusSubtopic" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."SyllabusTopic" t
      JOIN public."Syllabus" s ON s."id" = t."syllabusId"
      WHERE t."id" = "SyllabusSubtopic"."topicId"
      AND (
        s."userId" = public.current_app_user_id()
        OR s."organizationId" = public.current_user_org_id()
      )
    )
  );

-- =============================================================================
-- Assignment Policies (Critical — central to the app)
-- =============================================================================

CREATE POLICY "Assignment: org members can read"
  ON public."Assignment" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Assignment: creator and admins can manage"
  ON public."Assignment" FOR ALL
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND (
        "createdById" = public.current_app_user_id()
        OR EXISTS (
          SELECT 1 FROM public."User"
          WHERE "id" = public.current_app_user_id()
          AND "role" IN ('ADMIN', 'SUPER_ADMIN')
        )
      )
    )
  )
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "GeneratedPaper: org members can read"
  ON public."GeneratedPaper" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "GeneratedPaper: service manages"
  ON public."GeneratedPaper" FOR INSERT
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "GenerationJob: org members can read"
  ON public."GenerationJob" FOR SELECT
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Assignment" a
      WHERE a."id" = "GenerationJob"."assignmentId"
      AND a."organizationId" = public.current_user_org_id()
    )
  );

CREATE POLICY "GenerationJob: service manages"
  ON public."GenerationJob" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Assignment" a
      WHERE a."id" = "GenerationJob"."assignmentId"
      AND a."organizationId" = public.current_user_org_id()
    )
  );

-- =============================================================================
-- Question / QuestionBank Policies
-- =============================================================================

CREATE POLICY "Question: org members and public questions"
  ON public."Question" FOR SELECT
  USING (
    public.is_super_admin()
    OR "isPublished" = TRUE
    OR "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Question: authors manage their questions"
  ON public."Question" FOR ALL
  USING (
    public.is_super_admin()
    OR "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "QuestionBank: org members can read"
  ON public."QuestionBank" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "QuestionBank: org members manage"
  ON public."QuestionBank" FOR ALL
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK ("organizationId" = public.current_user_org_id());

CREATE POLICY "QuestionCollection: owner manages"
  ON public."QuestionCollection" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
  )
  WITH CHECK ("userId" = public.current_app_user_id());

-- =============================================================================
-- Notification Policies
-- =============================================================================

CREATE POLICY "Notification: users see their own"
  ON public."Notification" FOR SELECT
  USING ("userId" = public.current_app_user_id());

CREATE POLICY "Notification: users can update their own (mark read)"
  ON public."Notification" FOR UPDATE
  USING ("userId" = public.current_app_user_id())
  WITH CHECK ("userId" = public.current_app_user_id());

CREATE POLICY "Notification: service can insert"
  ON public."Notification" FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

-- =============================================================================
-- AuditLog Policies
-- =============================================================================

CREATE POLICY "AuditLog: admins can read org logs"
  ON public."AuditLog" FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "AuditLog: service can insert"
  ON public."AuditLog" FOR INSERT
  WITH CHECK (TRUE); -- Backend writes all audit logs with service role

-- =============================================================================
-- StudentSubmission Policies
-- =============================================================================

CREATE POLICY "StudentSubmission: students see own, teachers see org"
  ON public."StudentSubmission" FOR SELECT
  USING (
    public.is_super_admin()
    OR "studentId" = public.current_app_user_id()
    OR (
      "organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('TEACHER', 'ADMIN', 'SUPER_ADMIN')
      )
    )
  );

CREATE POLICY "StudentSubmission: students submit their own"
  ON public."StudentSubmission" FOR INSERT
  WITH CHECK (
    "studentId" = public.current_app_user_id()
    AND "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "SubmissionEvaluation: teachers and students can read"
  ON public."SubmissionEvaluation" FOR SELECT
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."StudentSubmission" ss
      WHERE ss."id" = "SubmissionEvaluation"."submissionId"
      AND (
        ss."studentId" = public.current_app_user_id()
        OR ss."organizationId" = public.current_user_org_id()
      )
    )
  );

-- =============================================================================
-- Subscription / Invoice Policies
-- =============================================================================

CREATE POLICY "Subscription: org members can read their subscription"
  ON public."Subscription" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Invoice: org admins can read invoices"
  ON public."Invoice" FOR SELECT
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Subscription" sub
      WHERE sub."id" = "Invoice"."subscriptionId"
      AND sub."organizationId" = public.current_user_org_id()
      AND EXISTS (
        SELECT 1 FROM public."User"
        WHERE "id" = public.current_app_user_id()
        AND "role" IN ('ADMIN', 'SUPER_ADMIN')
      )
    )
  );

-- =============================================================================
-- QuizSession Policies
-- =============================================================================

CREATE POLICY "QuizSession: users see their own"
  ON public."QuizSession" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "QuizSessionQuestion: inherit from QuizSession"
  ON public."QuizSessionQuestion" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."QuizSession" qs
      WHERE qs."id" = "QuizSessionQuestion"."sessionId"
      AND (
        qs."userId" = public.current_app_user_id()
        OR qs."organizationId" = public.current_user_org_id()
      )
    )
  );

-- =============================================================================
-- AI Feature Policies
-- =============================================================================

CREATE POLICY "LessonPlan: owner and org members"
  ON public."LessonPlan" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Worksheet: owner and org members"
  ON public."Worksheet" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "GeneratedNotes: owner and org members"
  ON public."GeneratedNotes" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

-- =============================================================================
-- Community Policies
-- =============================================================================

CREATE POLICY "CommunityPost: public posts visible to all authenticated"
  ON public."CommunityPost" FOR SELECT
  USING (
    public.current_app_user_id() IS NOT NULL
    AND (
      "visibility" = 'PUBLIC'
      OR "authorId" = public.current_app_user_id()
      OR "organizationId" = public.current_user_org_id()
    )
  );

CREATE POLICY "CommunityPost: authors manage their posts"
  ON public."CommunityPost" FOR ALL
  USING (
    public.is_super_admin()
    OR "authorId" = public.current_app_user_id()
  )
  WITH CHECK ("authorId" = public.current_app_user_id());

CREATE POLICY "CommunityGroup: members can read public groups"
  ON public."CommunityGroup" FOR SELECT
  USING (
    public.current_app_user_id() IS NOT NULL
    AND (
      "type" = 'PUBLIC'
      OR "ownerId" = public.current_app_user_id()
      OR "organizationId" = public.current_user_org_id()
      OR EXISTS (
        SELECT 1 FROM public."GroupMember"
        WHERE "groupId" = "CommunityGroup"."id"
        AND "userId" = public.current_app_user_id()
      )
    )
  );

CREATE POLICY "CommunityGroup: owners manage their groups"
  ON public."CommunityGroup" FOR ALL
  USING (
    public.is_super_admin()
    OR "ownerId" = public.current_app_user_id()
  )
  WITH CHECK ("ownerId" = public.current_app_user_id());

CREATE POLICY "GroupMember: members see group memberships"
  ON public."GroupMember" FOR SELECT
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public."CommunityGroup" cg
      WHERE cg."id" = "GroupMember"."groupId"
      AND cg."ownerId" = public.current_app_user_id()
    )
  );

CREATE POLICY "Message: participants can see messages"
  ON public."Message" FOR SELECT
  USING (
    public.is_super_admin()
    OR "senderId" = public.current_app_user_id()
    -- Note: full participant check requires app-layer enforcement for DM rooms
  );

CREATE POLICY "Message: authenticated users can send"
  ON public."Message" FOR INSERT
  WITH CHECK (
    "senderId" = public.current_app_user_id()
  );

CREATE POLICY "VoiceRoom: org members can see rooms"
  ON public."VoiceRoom" FOR SELECT
  USING (
    public.is_super_admin()
    OR "createdById" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
    OR ("isActive" = TRUE AND "organizationId" IS NULL)
  );

CREATE POLICY "VoiceRoom: authenticated users can create"
  ON public."VoiceRoom" FOR INSERT
  WITH CHECK ("createdById" = public.current_app_user_id());

CREATE POLICY "Meeting: org members can see meetings"
  ON public."Meeting" FOR SELECT
  USING (
    public.is_super_admin()
    OR "hostId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Meeting: authenticated users can create"
  ON public."Meeting" FOR INSERT
  WITH CHECK ("hostId" = public.current_app_user_id());

-- =============================================================================
-- Legacy ClassGroup / Student Policies
-- =============================================================================

CREATE POLICY "ClassGroup: owner and org can see"
  ON public."ClassGroup" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "userId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Student: inherit from ClassGroup"
  ON public."Student" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."ClassGroup" cg
      WHERE cg."id" = "Student"."groupId"
      AND (
        cg."userId" = public.current_app_user_id()
        OR cg."organizationId" = public.current_user_org_id()
      )
    )
  );

-- =============================================================================
-- Prompt Template Policies
-- =============================================================================

CREATE POLICY "PromptTemplate: org members can read"
  ON public."PromptTemplate" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
    OR "organizationId" IS NULL
  );

CREATE POLICY "PromptVersion: inherit from PromptTemplate"
  ON public."PromptVersion" FOR SELECT
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."PromptTemplate" pt
      WHERE pt."id" = "PromptVersion"."templateId"
      AND (pt."organizationId" = public.current_user_org_id() OR pt."organizationId" IS NULL)
    )
  );

CREATE POLICY "PromptExecution: org members read their executions"
  ON public."PromptExecution" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
    OR "userId" = public.current_app_user_id()
  );

CREATE POLICY "AIRecommendation: org members read"
  ON public."AIRecommendation" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
    OR "studentId" = public.current_app_user_id()
  );

-- Assessment policies
CREATE POLICY "Assessment: org members can read"
  ON public."Assessment" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
    OR "authorId" = public.current_app_user_id()
  );

CREATE POLICY "Assessment: authors manage"
  ON public."Assessment" FOR ALL
  USING (
    public.is_super_admin()
    OR "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "AssessmentQuestion: inherit from Assessment"
  ON public."AssessmentQuestion" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Assessment" a
      WHERE a."id" = "AssessmentQuestion"."assessmentId"
      AND (
        a."authorId" = public.current_app_user_id()
        OR a."organizationId" = public.current_user_org_id()
      )
    )
  );

-- QuestionReview policies
CREATE POLICY "QuestionReview: org members can read"
  ON public."QuestionReview" FOR SELECT
  USING (
    public.is_super_admin()
    OR "reviewerId" = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public."Question" q
      WHERE q."id" = "QuestionReview"."questionId"
      AND (
        q."authorId" = public.current_app_user_id()
        OR q."organizationId" = public.current_user_org_id()
      )
    )
  );

-- QuestionVersion policies
CREATE POLICY "QuestionVersion: inherit from QuestionBank"
  ON public."QuestionVersion" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."QuestionBank" qb
      WHERE qb."id" = "QuestionVersion"."questionId"
      AND qb."organizationId" = public.current_user_org_id()
    )
  );

-- Rubric policies
CREATE POLICY "Rubric: org members can read"
  ON public."Rubric" FOR SELECT
  USING (
    public.is_super_admin()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "Rubric: authors manage"
  ON public."Rubric" FOR ALL
  USING (
    public.is_super_admin()
    OR "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  )
  WITH CHECK (
    "authorId" = public.current_app_user_id()
    OR "organizationId" = public.current_user_org_id()
  );

CREATE POLICY "RubricCriterion: inherit from Rubric"
  ON public."RubricCriterion" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Rubric" r
      WHERE r."id" = "RubricCriterion"."rubricId"
      AND (r."authorId" = public.current_app_user_id() OR r."organizationId" = public.current_user_org_id())
    )
  );

CREATE POLICY "AssignmentGradingConfig: org teachers can manage"
  ON public."AssignmentGradingConfig" FOR ALL
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public."Assignment" a
      WHERE a."id" = "AssignmentGradingConfig"."assignmentId"
      AND a."organizationId" = public.current_user_org_id()
    )
  );

CREATE POLICY "VoiceRoomParticipant: participants and admins"
  ON public."VoiceRoomParticipant" FOR ALL
  USING (
    public.is_super_admin()
    OR "userId" = public.current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public."VoiceRoom" vr
      WHERE vr."id" = "VoiceRoomParticipant"."roomId"
      AND (vr."createdById" = public.current_app_user_id() OR vr."organizationId" = public.current_user_org_id())
    )
  )
  WITH CHECK ("userId" = public.current_app_user_id());
