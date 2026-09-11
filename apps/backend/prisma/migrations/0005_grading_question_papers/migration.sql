-- Stores the teacher-provided source paper alongside the grading configuration.
-- Existing configurations remain valid and continue to use their saved answer key.
ALTER TABLE "AssignmentGradingConfig"
  ADD COLUMN "questionPaperPath" TEXT,
  ADD COLUMN "questionPaperName" TEXT,
  ADD COLUMN "questionPaperType" TEXT,
  ADD COLUMN "questionPaperText" TEXT,
  ADD COLUMN "autoEvaluate" BOOLEAN NOT NULL DEFAULT true;
