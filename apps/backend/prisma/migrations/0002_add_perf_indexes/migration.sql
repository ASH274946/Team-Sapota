-- Performance indexes identified during production-readiness review
-- (H-6: missing indexes on hot WHERE/ORDER BY columns)

CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_organizationId_role_status_idx" ON "User"("organizationId", "role", "status");

CREATE INDEX IF NOT EXISTS "Question_unitId_idx" ON "Question"("unitId");

CREATE INDEX IF NOT EXISTS "QuestionBank_organizationId_subject_idx" ON "QuestionBank"("organizationId", "subject");

CREATE INDEX IF NOT EXISTS "StudentSubmission_status_idx" ON "StudentSubmission"("status");
CREATE INDEX IF NOT EXISTS "StudentSubmission_assignmentId_status_idx" ON "StudentSubmission"("assignmentId", "status");

CREATE INDEX IF NOT EXISTS "AIRecommendation_type_idx" ON "AIRecommendation"("type");
CREATE INDEX IF NOT EXISTS "AIRecommendation_groupId_idx" ON "AIRecommendation"("groupId");

CREATE INDEX IF NOT EXISTS "CommunityPost_visibility_idx" ON "CommunityPost"("visibility");
