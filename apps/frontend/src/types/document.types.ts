export interface KnowledgeDocument {
  id: string;
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  status: string;
  organizationId: string;
  uploadedById: string;
  extractedText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentJobStatus {
  jobId: string;
  status: string;
  progress: number | null;
  resultUrl: string | null;
  error: string | null;
  estimatedCompletion: string | null;
}
