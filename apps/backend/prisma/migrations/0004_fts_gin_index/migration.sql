-- Create GIN index for PostgreSQL full-text search on KnowledgeChunk content
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_fts_idx"
  ON "KnowledgeChunk" USING GIN (to_tsvector('english', "content"));
