-- =============================================================================
-- 06_data_migration.sql
-- Data Migration Script: Neon → Supabase
-- Generated: 2026-06-24
--
-- INSTRUCTIONS:
--   1. First run 02_supabase_schema.sql to create all tables
--   2. Set up a database link or use pg_dump/pg_restore
--   3. Run this script with both databases accessible
--
-- METHOD A: pg_dump → pg_restore (RECOMMENDED for production)
--   pg_dump --no-owner --no-acl --data-only \
--     --format=custom \
--     "postgresql://neondb_owner:...@ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech/neondb" \
--     -f neon_data.dump
--
--   pg_restore --no-owner --no-acl --data-only \
--     -d "postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
--     neon_data.dump
--
-- METHOD B: Foreign Data Wrapper (live migration with zero downtime)
--   See the instructions below.
--
-- METHOD C: Script-based row-by-row (use this file's INSERT...SELECT pattern
--   when using a DB migration tool like Flyway or custom script).
-- =============================================================================

-- =============================================================================
-- PHASE 0: Pre-migration checks
-- =============================================================================

-- Check if Supabase tables are empty before migration
DO $$
DECLARE
  v_user_count    INTEGER;
  v_org_count     INTEGER;
  v_assign_count  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM public."User";
  SELECT COUNT(*) INTO v_org_count FROM public."Organization";
  SELECT COUNT(*) INTO v_assign_count FROM public."Assignment";

  RAISE NOTICE '=== Pre-migration table counts ===';
  RAISE NOTICE 'Organization: %', v_org_count;
  RAISE NOTICE 'User: %', v_user_count;
  RAISE NOTICE 'Assignment: %', v_assign_count;

  IF v_user_count > 0 THEN
    RAISE WARNING 'User table is not empty (% rows). This migration may create duplicates.', v_user_count;
  END IF;
END $$;

-- =============================================================================
-- METHOD B: Foreign Data Wrapper (FDW) Setup
-- If you prefer live migration, enable the postgres_fdw extension in Supabase
-- Dashboard → Database → Extensions → Enable postgres_fdw
-- =============================================================================

-- STEP 1: Enable FDW (run in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- STEP 2: Create foreign server pointing at Neon
-- CREATE SERVER neon_source
--   FOREIGN DATA WRAPPER postgres_fdw
--   OPTIONS (
--     host 'ep-small-bird-attn88l3-pooler.c-9.us-east-1.aws.neon.tech',
--     port '5432',
--     dbname 'neondb',
--     sslmode 'require'
--   );

-- STEP 3: Create user mapping
-- CREATE USER MAPPING FOR postgres
--   SERVER neon_source
--   OPTIONS (
--     user 'neondb_owner',
--     password 'YOUR_NEON_PASSWORD'
--   );

-- STEP 4: Create foreign schema
-- CREATE SCHEMA IF NOT EXISTS neon;
-- IMPORT FOREIGN SCHEMA public FROM SERVER neon_source INTO neon;

-- STEP 5: Then use the INSERT...SELECT patterns below:

-- =============================================================================
-- MIGRATION ORDER (respects foreign key constraints)
-- =============================================================================

-- Order matters: migrate parent tables before child tables
-- 1.  Organization
-- 2.  Department
-- 3.  User
-- 4.  Role, Permission, _RolePermissions
-- 5.  UserRole
-- 6.  Invitation
-- 7.  Session, RefreshToken, LoginHistory, EmailVerificationToken, PasswordResetToken
-- 8.  Classroom, Section, Enrollment
-- 9.  Class, ClassStudent
-- 10. Group, GroupStudent
-- 11. ClassGroup, Student (Legacy)
-- 12. Syllabus, SyllabusTopic, SyllabusSubtopic
-- 13. Question, QuestionReview
-- 14. Assessment, AssessmentQuestion
-- 15. Assignment
-- 16. GeneratedPaper, GenerationJob
-- 17. QuestionBank, QuestionVersion, QuestionCollection
-- 18. Rubric, RubricCriterion, AssignmentGradingConfig
-- 19. StudentSubmission, SubmissionEvaluation
-- 20. Subscription, Invoice
-- 21. AuditLog, Notification
-- 22. QuizSession, QuizSessionQuestion
-- 23. PromptTemplate, PromptVersion, PromptExecution
-- 24. AIRecommendation, LessonPlan, Worksheet, GeneratedNotes
-- 25. CommunityPost, CommunityGroup, GroupMember
-- 26. Message, VoiceRoom, VoiceRoomParticipant, Meeting

-- =============================================================================
-- IF USING FDW: Run these INSERT...SELECT statements
-- Replace "neon." prefix with your foreign schema name
-- =============================================================================

/*

-- 1. Organization
INSERT INTO public."Organization"
SELECT * FROM neon."Organization"
ON CONFLICT ("id") DO NOTHING;

-- 2. Department
INSERT INTO public."Department"
SELECT * FROM neon."Department"
ON CONFLICT ("id") DO NOTHING;

-- 3. User
INSERT INTO public."User"
SELECT * FROM neon."User"
ON CONFLICT ("id") DO NOTHING;

-- 4. Role
INSERT INTO public."Role"
SELECT * FROM neon."Role"
ON CONFLICT ("id") DO NOTHING;

-- 5. Permission
INSERT INTO public."Permission"
SELECT * FROM neon."Permission"
ON CONFLICT ("id") DO NOTHING;

-- 6. _RolePermissions (join table)
INSERT INTO public."_RolePermissions" ("A", "B")
SELECT "A", "B" FROM neon."_RolePermissions"
ON CONFLICT DO NOTHING;

-- 7. UserRole
INSERT INTO public."UserRole"
SELECT * FROM neon."UserRole"
ON CONFLICT ("id") DO NOTHING;

-- 8. Invitation
INSERT INTO public."Invitation"
SELECT * FROM neon."Invitation"
ON CONFLICT ("id") DO NOTHING;

-- 9. Session
INSERT INTO public."Session"
SELECT * FROM neon."Session"
ON CONFLICT ("id") DO NOTHING;

-- 10. RefreshToken
INSERT INTO public."RefreshToken"
SELECT * FROM neon."RefreshToken"
ON CONFLICT ("id") DO NOTHING;

-- 11. LoginHistory
INSERT INTO public."LoginHistory"
SELECT * FROM neon."LoginHistory"
ON CONFLICT ("id") DO NOTHING;

-- 12. EmailVerificationToken
INSERT INTO public."EmailVerificationToken"
SELECT * FROM neon."EmailVerificationToken"
ON CONFLICT ("id") DO NOTHING;

-- 13. PasswordResetToken
INSERT INTO public."PasswordResetToken"
SELECT * FROM neon."PasswordResetToken"
ON CONFLICT ("id") DO NOTHING;

-- 14. Classroom
INSERT INTO public."Classroom"
SELECT * FROM neon."Classroom"
ON CONFLICT ("id") DO NOTHING;

-- 15. Section
INSERT INTO public."Section"
SELECT * FROM neon."Section"
ON CONFLICT ("id") DO NOTHING;

-- 16. Enrollment
INSERT INTO public."Enrollment"
SELECT * FROM neon."Enrollment"
ON CONFLICT ("id") DO NOTHING;

-- 17. Class
INSERT INTO public."Class"
SELECT * FROM neon."Class"
ON CONFLICT ("id") DO NOTHING;

-- 18. ClassStudent
INSERT INTO public."ClassStudent"
SELECT * FROM neon."ClassStudent"
ON CONFLICT ("id") DO NOTHING;

-- 19. Group
INSERT INTO public."Group"
SELECT * FROM neon."Group"
ON CONFLICT ("id") DO NOTHING;

-- 20. GroupStudent
INSERT INTO public."GroupStudent"
SELECT * FROM neon."GroupStudent"
ON CONFLICT ("id") DO NOTHING;

-- 21. ClassGroup (Legacy)
INSERT INTO public."ClassGroup"
SELECT * FROM neon."ClassGroup"
ON CONFLICT ("id") DO NOTHING;

-- 22. Student (Legacy)
INSERT INTO public."Student"
SELECT * FROM neon."Student"
ON CONFLICT ("id") DO NOTHING;

-- 23. Syllabus
INSERT INTO public."Syllabus"
SELECT * FROM neon."Syllabus"
ON CONFLICT ("id") DO NOTHING;

-- 24. SyllabusTopic
INSERT INTO public."SyllabusTopic"
SELECT * FROM neon."SyllabusTopic"
ON CONFLICT ("id") DO NOTHING;

-- 25. SyllabusSubtopic
INSERT INTO public."SyllabusSubtopic"
SELECT * FROM neon."SyllabusSubtopic"
ON CONFLICT ("id") DO NOTHING;

-- 26. Question
INSERT INTO public."Question"
SELECT * FROM neon."Question"
ON CONFLICT ("id") DO NOTHING;

-- 27. QuestionReview
INSERT INTO public."QuestionReview"
SELECT * FROM neon."QuestionReview"
ON CONFLICT ("id") DO NOTHING;

-- 28. Assessment
INSERT INTO public."Assessment"
SELECT * FROM neon."Assessment"
ON CONFLICT ("id") DO NOTHING;

-- 29. AssessmentQuestion
INSERT INTO public."AssessmentQuestion"
SELECT * FROM neon."AssessmentQuestion"
ON CONFLICT ("id") DO NOTHING;

-- 30. Assignment
INSERT INTO public."Assignment"
SELECT * FROM neon."Assignment"
ON CONFLICT ("id") DO NOTHING;

-- 31. GeneratedPaper
INSERT INTO public."GeneratedPaper"
SELECT * FROM neon."GeneratedPaper"
ON CONFLICT ("id") DO NOTHING;

-- 32. GenerationJob
INSERT INTO public."GenerationJob"
SELECT * FROM neon."GenerationJob"
ON CONFLICT ("id") DO NOTHING;

-- 33. QuestionBank
INSERT INTO public."QuestionBank"
SELECT * FROM neon."QuestionBank"
ON CONFLICT ("id") DO NOTHING;

-- 34. QuestionVersion
INSERT INTO public."QuestionVersion"
SELECT * FROM neon."QuestionVersion"
ON CONFLICT ("id") DO NOTHING;

-- 35. QuestionCollection
INSERT INTO public."QuestionCollection"
SELECT * FROM neon."QuestionCollection"
ON CONFLICT ("id") DO NOTHING;

-- 36. _QuestionBankToQuestionCollection (join table)
INSERT INTO public."_QuestionBankToQuestionCollection" ("A", "B")
SELECT "A", "B" FROM neon."_QuestionBankToQuestionCollection"
ON CONFLICT DO NOTHING;

-- 37. Rubric
INSERT INTO public."Rubric"
SELECT * FROM neon."Rubric"
ON CONFLICT ("id") DO NOTHING;

-- 38. RubricCriterion
INSERT INTO public."RubricCriterion"
SELECT * FROM neon."RubricCriterion"
ON CONFLICT ("id") DO NOTHING;

-- 39. AssignmentGradingConfig
INSERT INTO public."AssignmentGradingConfig"
SELECT * FROM neon."AssignmentGradingConfig"
ON CONFLICT ("id") DO NOTHING;

-- 40. StudentSubmission
INSERT INTO public."StudentSubmission"
SELECT * FROM neon."StudentSubmission"
ON CONFLICT ("id") DO NOTHING;

-- 41. SubmissionEvaluation
INSERT INTO public."SubmissionEvaluation"
SELECT * FROM neon."SubmissionEvaluation"
ON CONFLICT ("id") DO NOTHING;

-- 42. Subscription
INSERT INTO public."Subscription"
SELECT * FROM neon."Subscription"
ON CONFLICT ("id") DO NOTHING;

-- 43. Invoice
INSERT INTO public."Invoice"
SELECT * FROM neon."Invoice"
ON CONFLICT ("id") DO NOTHING;

-- 44. AuditLog
INSERT INTO public."AuditLog"
SELECT * FROM neon."AuditLog"
ON CONFLICT ("id") DO NOTHING;

-- 45. Notification
INSERT INTO public."Notification"
SELECT * FROM neon."Notification"
ON CONFLICT ("id") DO NOTHING;

-- 46. QuizSession
INSERT INTO public."QuizSession"
SELECT * FROM neon."QuizSession"
ON CONFLICT ("id") DO NOTHING;

-- 47. QuizSessionQuestion
INSERT INTO public."QuizSessionQuestion"
SELECT * FROM neon."QuizSessionQuestion"
ON CONFLICT ("id") DO NOTHING;

-- 48. PromptTemplate
INSERT INTO public."PromptTemplate"
SELECT * FROM neon."PromptTemplate"
ON CONFLICT ("id") DO NOTHING;

-- 49. PromptVersion
INSERT INTO public."PromptVersion"
SELECT * FROM neon."PromptVersion"
ON CONFLICT ("id") DO NOTHING;

-- 50. PromptExecution
INSERT INTO public."PromptExecution"
SELECT * FROM neon."PromptExecution"
ON CONFLICT ("id") DO NOTHING;

-- 51. AIRecommendation
INSERT INTO public."AIRecommendation"
SELECT * FROM neon."AIRecommendation"
ON CONFLICT ("id") DO NOTHING;

-- 52. LessonPlan
INSERT INTO public."LessonPlan"
SELECT * FROM neon."LessonPlan"
ON CONFLICT ("id") DO NOTHING;

-- 53. Worksheet
INSERT INTO public."Worksheet"
SELECT * FROM neon."Worksheet"
ON CONFLICT ("id") DO NOTHING;

-- 54. GeneratedNotes
INSERT INTO public."GeneratedNotes"
SELECT * FROM neon."GeneratedNotes"
ON CONFLICT ("id") DO NOTHING;

-- 55. CommunityPost
INSERT INTO public."CommunityPost"
SELECT * FROM neon."CommunityPost"
ON CONFLICT ("id") DO NOTHING;

-- 56. CommunityGroup
INSERT INTO public."CommunityGroup"
SELECT * FROM neon."CommunityGroup"
ON CONFLICT ("id") DO NOTHING;

-- 57. GroupMember
INSERT INTO public."GroupMember"
SELECT * FROM neon."GroupMember"
ON CONFLICT ("id") DO NOTHING;

-- 58. Message
INSERT INTO public."Message"
SELECT * FROM neon."Message"
ON CONFLICT ("id") DO NOTHING;

-- 59. VoiceRoom
INSERT INTO public."VoiceRoom"
SELECT * FROM neon."VoiceRoom"
ON CONFLICT ("id") DO NOTHING;

-- 60. VoiceRoomParticipant
INSERT INTO public."VoiceRoomParticipant"
SELECT * FROM neon."VoiceRoomParticipant"
ON CONFLICT ("id") DO NOTHING;

-- 61. Meeting
INSERT INTO public."Meeting"
SELECT * FROM neon."Meeting"
ON CONFLICT ("id") DO NOTHING;

*/

-- =============================================================================
-- PHASE 2: Post-migration verification
-- =============================================================================

-- Run these after migration to verify counts match Neon
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'Organization', 'Department', 'User', 'Role', 'Permission',
    'UserRole', 'Invitation', 'Session', 'RefreshToken',
    'Classroom', 'Section', 'Class', 'ClassStudent', 'Group', 'GroupStudent',
    'ClassGroup', 'Student', 'Syllabus', 'SyllabusTopic', 'SyllabusSubtopic',
    'Question', 'Assessment', 'Assignment', 'GeneratedPaper', 'GenerationJob',
    'QuestionBank', 'Rubric', 'StudentSubmission', 'Subscription',
    'Notification', 'QuizSession', 'LessonPlan', 'Worksheet', 'GeneratedNotes',
    'CommunityPost', 'CommunityGroup', 'Message', 'Meeting'
  ];
  t TEXT;
  cnt BIGINT;
BEGIN
  RAISE NOTICE '=== Post-migration table counts ===';
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', t) INTO cnt;
    RAISE NOTICE '%: %', t, cnt;
  END LOOP;
END $$;
