export interface SearchRequestDto {
  query: string;
  limit?: number;
  organizationId?: string;
  filters?: Record<string, unknown>;
}

export interface SearchResultDto {
  chunkId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown> | null;
  documentId: string;
  documentFilename: string;
}

export interface RetrieveRequestDto {
  query: string;
  limit?: number;
  organizationId?: string;
}

export interface RetrieveResponseDto {
  context: string;
  chunks: SearchResultDto[];
  totalChunks: number;
}

export interface IndexedDocumentDto {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  chunkCount: number;
  createdAt: string;
}

export interface RagQueryRequestDto {
  query: string;
  context?: string;
  organizationId?: string;
  model?: string;
  systemPrompt?: string;
}

export interface RagQueryResponseDto {
  answer: string;
  context: string;
  chunksUsed: number;
  model: string;
  latencyMs: number;
}

export interface RagStatsDto {
  totalDocuments: number;
  totalChunks: number;
  averageChunksPerDocument: number;
  documentsByStatus: Record<string, number>;
  lastIndexedAt: string | null;
}
