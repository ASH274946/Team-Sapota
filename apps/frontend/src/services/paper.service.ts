import { apiClient } from './api.client';
import type { GeneratedPaper } from '../types/paper.types';
import type { CanonicalPaperMetadata } from '../types/assignment.types';

export async function fetchPaper(assignmentId: string, paperId?: string): Promise<GeneratedPaper> {
  const url = paperId ? `/papers/${assignmentId}?paperId=${paperId}` : `/papers/${assignmentId}`;
  const res = await apiClient.get<{ data: { paper: GeneratedPaper; canonicalMetadata?: CanonicalPaperMetadata } }>(url);
  if (res.data.data.canonicalMetadata) {
    res.data.data.paper.canonicalMetadata = res.data.data.canonicalMetadata;
  }
  return res.data.data.paper;
}
