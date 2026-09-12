-- C-3: Move RAG from brute-force in-JS cosine to native pgvector similarity.
--
-- IMPORTANT: This migration requires the `vector` Postgres EXTENSION to be
-- ENABLED on the actual target database BEFORE it runs (e.g. via the Supabase
-- dashboard SQL editor or `CREATE EXTENSION vector;`). It cannot be enabled
-- from this migration runner context and must be done once per database.
--
-- Embedding model: text-embedding-3-small  =>  dimension 1536.

-- 1. Enable the pgvector extension (idempotent).
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Convert the existing JSONB `vector` columns to the native vector(1536)
--    type in place (preserves existing embedding data). The conversion is
--    guarded so the migration is idempotent and safe to re-run.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'KnowledgeChunk'
      AND column_name = 'vector'
      AND udt_name = 'jsonb'
  ) THEN
    ALTER TABLE "KnowledgeChunk"
      ALTER COLUMN "vector" TYPE vector(1536)
      USING ("vector"::text::vector);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'RubricCriterion'
      AND column_name = 'vector'
      AND udt_name = 'jsonb'
  ) THEN
    ALTER TABLE "RubricCriterion"
      ALTER COLUMN "vector" TYPE vector(1536)
      USING ("vector"::text::vector);
  END IF;
END $$;

-- 3. HNSW cosine-similarity indexes for fast ANN / ordered distance scans.
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_vector_idx"
  ON "KnowledgeChunk" USING hnsw ("vector" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "RubricCriterion_vector_idx"
  ON "RubricCriterion" USING hnsw ("vector" vector_cosine_ops);

-- 4. Schema fix: User.organization had no onDelete while sibling Organization
--    children use onDelete: Cascade. Re-create the FK with ON DELETE CASCADE.
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
