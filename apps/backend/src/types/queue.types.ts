export interface GenerationJobData {
  assignmentId: string;
  jobRecordId: string;
  userId?: string;
  organizationId?: string;
}

export interface PdfJobData {
  assignmentId: string;
  paperId: string;
  jobRecordId: string;
}

/**
 * Lesson-plan PDF job payload.
 * The worker loads the full LessonPlan from the database using lessonPlanId.
 */
export interface LessonPlanPdfJobData {
  /** Discriminator — the worker uses this to route to the lesson-plan handler */
  type: 'lesson-plan-pdf';
  lessonPlanId: string;
  /** BullMQ job ID stored here for result retrieval via Redis */
  jobId: string;
  /** Requesting user's id for ownership check */
  userId?: string;
}

/** Union of all PDF job payloads that can be enqueued on the 'pdf' queue */
export type AnyPdfJobData = PdfJobData | LessonPlanPdfJobData;
