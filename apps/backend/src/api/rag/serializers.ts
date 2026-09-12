import type {
  SearchResultDto,
  RetrieveResponseDto,
  IndexedDocumentDto,
  RagQueryResponseDto,
  RagStatsDto,
} from './dto';

export function serializeSearchResult(result: {
  chunkId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown> | null;
  documentId: string;
  documentFilename: string;
}): SearchResultDto {
  return {
    chunkId: result.chunkId,
    content: result.content,
    score: result.score,
    metadata: result.metadata,
    documentId: result.documentId,
    documentFilename: result.documentFilename,
  };
}

export function serializeRetrieveResponse(result: {
  context: string;
  chunks: SearchResultDto[];
  totalChunks: number;
}): RetrieveResponseDto {
  return {
    context: result.context,
    chunks: result.chunks,
    totalChunks: result.totalChunks,
  };
}

export function serializeIndexedDocument(doc: {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  _count?: { chunks: number };
  createdAt: Date;
}): IndexedDocumentDto {
  return {
    id: doc.id,
    filename: doc.filename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    status: doc.status,
    chunkCount: doc._count?.chunks ?? 0,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function serializeRagQueryResponse(response: {
  answer: string;
  context: string;
  chunksUsed: number;
  model: string;
  latencyMs: number;
}): RagQueryResponseDto {
  return {
    answer: response.answer,
    context: response.context,
    chunksUsed: response.chunksUsed,
    model: response.model,
    latencyMs: response.latencyMs,
  };
}

export function serializeRagStats(stats: RagStatsDto): RagStatsDto {
  return stats;
}
