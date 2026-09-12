-- =============================================================================
-- 04_auth_triggers.sql
-- Auth Triggers for VedaAI on Supabase
-- Generated: 2026-06-24
--
-- PURPOSE:
--   These triggers handle automatic database operations related to auth lifecycle.
--   They are designed to be ADDITIVE to the existing custom JWT auth system.
--
-- CURRENT AUTH MODEL:
--   VedaAI uses custom JWT auth (argon2 password hashing, jsonwebtoken).
--   These triggers are prepared for future Supabase Auth integration but
--   do NOT break or conflict with the current custom auth system.
--
-- TRIGGERS INCLUDED:
--   1. handle_new_supabase_user    — Optional: create app User when Supabase Auth user signs up
--   2. cleanup_expired_sessions    — Periodic cleanup of expired JWT sessions
--   3. cleanup_expired_tokens      — Periodic cleanup of expired password reset tokens
--   4. handle_token_reuse          — Revoke all tokens on refresh token reuse detection
--   5. update_login_streak         — Track login statistics
-- =============================================================================

-- =============================================================================
-- TRIGGER 1: Auto-create App User on Supabase Auth Signup
-- (OPTIONAL — only applies if you migrate to Supabase Auth)
-- Comment out this trigger if you are NOT using Supabase Auth.
-- =============================================================================

-- This function runs when a new user is created in auth.users (Supabase Auth).
-- It creates a corresponding record in our public.User table.
CREATE OR REPLACE FUNCTION public.handle_new_supabase_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create app user if one doesn't already exist with this email
  INSERT INTO public."User" (
    "id",
    "email",
    "passwordHash",
    "firstName",
    "lastName",
    "role",
    "status",
    "hasCompletedOnboarding",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id::text,                         -- Use Supabase Auth UUID as app user ID
    NEW.email,
    'supabase-auth-managed',              -- Placeholder — password managed by Supabase Auth
    COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'TEACHER')::"SystemRole",
    'ACTIVE',
    FALSE,
    NOW(),
    NOW()
  )
  ON CONFLICT ("email") DO NOTHING;  -- Don't overwrite if migrating existing user

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment when using Supabase Auth:
-- CREATE OR REPLACE TRIGGER on_supabase_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_supabase_user();

-- =============================================================================
-- TRIGGER 2: Cleanup Expired Sessions
-- Automatically mark expired sessions as inactive
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new session is created, opportunistically clean up old ones for the user
  UPDATE public."Session"
  SET "isActive" = FALSE
  WHERE "userId" = NEW."userId"
    AND "expiresAt" < NOW()
    AND "isActive" = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER session_cleanup_on_new
  AFTER INSERT ON public."Session"
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_expired_sessions();

-- =============================================================================
-- TRIGGER 3: Cleanup Expired Password Reset Tokens
-- Auto-delete expired tokens when a new one is requested for the same user
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_password_reset_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all previous tokens for this user when a new one is created
  DELETE FROM public."PasswordResetToken"
  WHERE "userId" = NEW."userId"
    AND "id" != NEW."id";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER password_reset_token_cleanup
  AFTER INSERT ON public."PasswordResetToken"
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_old_password_reset_tokens();

-- =============================================================================
-- TRIGGER 4: Refresh Token Reuse Detection
-- If a revoked token is used again, revoke ALL tokens for that user (security)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_refresh_token_reuse()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're trying to use a revoked token (backend detects this and marks it used again)
  -- Revoke all tokens for this user as a security measure
  IF OLD."isRevoked" = TRUE AND NEW."isRevoked" = TRUE THEN
    UPDATE public."RefreshToken"
    SET "isRevoked" = TRUE
    WHERE "userId" = NEW."userId"
      AND "isRevoked" = FALSE;

    -- Mark all sessions as inactive
    UPDATE public."Session"
    SET "isActive" = FALSE
    WHERE "userId" = NEW."userId"
      AND "isActive" = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER refresh_token_reuse_guard
  BEFORE UPDATE ON public."RefreshToken"
  FOR EACH ROW EXECUTE FUNCTION public.handle_refresh_token_reuse();

-- =============================================================================
-- TRIGGER 5: Audit Log on User Deletion
-- Auto-create audit entry when a user is deleted (admin action)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."AuditLog" (
    "userId",
    "organizationId",
    "action",
    "entity",
    "entityId",
    "ipAddress",
    "userAgent",
    "metadata",
    "createdAt"
  )
  VALUES (
    NULL,                                             -- Deleting user has no active session after delete
    OLD."organizationId",
    'USER_DELETED',
    'User',
    OLD."id",
    '0.0.0.0',                                        -- System action
    'system-trigger',
    jsonb_build_object(
      'email', OLD."email",
      'role', OLD."role",
      'deletedAt', NOW()
    ),
    NOW()
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER user_deletion_audit
  BEFORE DELETE ON public."User"
  FOR EACH ROW EXECUTE FUNCTION public.log_user_deletion();

-- =============================================================================
-- TRIGGER 6: Auto-set Organization Status Timestamps
-- Track when an organization's status changes
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_organization_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."status" != NEW."status" THEN
    -- Log status changes to audit log
    INSERT INTO public."AuditLog" (
      "action",
      "entity",
      "entityId",
      "ipAddress",
      "userAgent",
      "metadata",
      "createdAt"
    )
    VALUES (
      'ORGANIZATION_STATUS_CHANGED',
      'Organization',
      NEW."id",
      '0.0.0.0',
      'system-trigger',
      jsonb_build_object(
        'previousStatus', OLD."status",
        'newStatus', NEW."status",
        'changedAt', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER organization_status_audit
  AFTER UPDATE OF "status" ON public."Organization"
  FOR EACH ROW EXECUTE FUNCTION public.handle_organization_status_change();

-- =============================================================================
-- TRIGGER 7: Auto-notify User on Assignment Published
-- Inserts a Notification record when an assignment status changes to PUBLISHED
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_assignment_published()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO 'PUBLISHED'
  IF (OLD."status" != 'PUBLISHED' OR OLD."status" IS NULL)
     AND NEW."status" = 'PUBLISHED' THEN

    -- Notify the creator
    IF NEW."createdById" IS NOT NULL THEN
      INSERT INTO public."Notification" (
        "userId",
        "organizationId",
        "title",
        "message",
        "type",
        "link",
        "createdAt"
      )
      VALUES (
        NEW."createdById",
        NEW."organizationId",
        'Assignment Published',
        format('Your assignment "%s" has been published.', NEW."title"),
        'SUCCESS',
        format('/assignments/%s', NEW."id"),
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER assignment_published_notification
  AFTER UPDATE OF "status" ON public."Assignment"
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_assignment_published();

-- =============================================================================
-- TRIGGER 8: Generation Job Status Notification
-- Notifies user when their paper generation completes or fails
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_on_generation_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_assignment public."Assignment"%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'completed' or 'failed'
  IF OLD."status" NOT IN ('completed', 'failed')
     AND NEW."status" IN ('completed', 'failed') THEN

    -- Fetch the parent assignment
    SELECT * INTO v_assignment
    FROM public."Assignment"
    WHERE "id" = NEW."assignmentId";

    IF v_assignment IS NOT NULL AND v_assignment."createdById" IS NOT NULL THEN
      INSERT INTO public."Notification" (
        "userId",
        "organizationId",
        "title",
        "message",
        "type",
        "link",
        "createdAt"
      )
      VALUES (
        v_assignment."createdById",
        v_assignment."organizationId",
        CASE
          WHEN NEW."status" = 'completed' THEN 'Paper Generation Complete'
          ELSE 'Paper Generation Failed'
        END,
        CASE
          WHEN NEW."status" = 'completed'
            THEN format('Your question paper for "%s" has been generated successfully.', v_assignment."title")
          ELSE format('Paper generation for "%s" encountered an error. Please try again.', v_assignment."title")
        END,
        CASE WHEN NEW."status" = 'completed' THEN 'SUCCESS' ELSE 'ERROR' END,
        format('/assignments/%s', v_assignment."id"),
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER generation_job_completion_notification
  AFTER UPDATE OF "status" ON public."GenerationJob"
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_generation_complete();

-- =============================================================================
-- Helper: Scheduled cleanup function (call via pg_cron or Supabase Edge Function)
-- =============================================================================
-- NOTE: Supabase supports pg_cron. To schedule this, go to:
-- Supabase Dashboard → Database → Extensions → Enable pg_cron
-- Then run: SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT public.purge_expired_auth_data()');

CREATE OR REPLACE FUNCTION public.purge_expired_auth_data()
RETURNS void AS $$
BEGIN
  -- Remove expired sessions
  DELETE FROM public."Session"
  WHERE "expiresAt" < NOW() - INTERVAL '7 days';

  -- Remove expired & revoked refresh tokens
  DELETE FROM public."RefreshToken"
  WHERE ("expiresAt" < NOW() - INTERVAL '1 day')
    OR ("isRevoked" = TRUE AND "createdAt" < NOW() - INTERVAL '30 days');

  -- Remove expired email verification tokens
  DELETE FROM public."EmailVerificationToken"
  WHERE "expiresAt" < NOW() - INTERVAL '1 day';

  -- Remove expired password reset tokens
  DELETE FROM public."PasswordResetToken"
  WHERE "expiresAt" < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
