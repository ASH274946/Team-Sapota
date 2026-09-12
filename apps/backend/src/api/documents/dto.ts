export interface UploadDocumentDto {
  filename: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  uploadedById: string;
}

export interface ParseDocumentDto {
  documentId: string;
}

export interface ProcessDocumentDto {
  documentId: string;
}

export interface DocumentResponseDto {
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

export interface DocumentJobStatusDto {
  jobId: string;
  status: string;
  progress: number | null;
  resultUrl: string | null;
  error: string | null;
  estimatedCompletion: string | null;
}
