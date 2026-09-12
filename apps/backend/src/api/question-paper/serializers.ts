import type { GeneratedPaperDto, GenerationJobDto, AnswerKeyDto } from './dto';

export function serializeGeneratedPaper(paper: any): GeneratedPaperDto {
  return {
    id: paper.id,
    assignmentId: paper.assignmentId,
    organizationId: paper.organizationId,
    title: paper.title,
    totalMarks: paper.totalMarks,
    duration: paper.duration,
    sections: (paper.sections ?? []).map((s: any) => ({
      title: s.title,
      instructions: s.instructions ?? undefined,
      questions: (s.questions ?? []).map((q: any) => ({
        question: q.question,
        marks: q.marks,
        difficulty: q.difficulty,
        type: q.type,
        options: q.options ?? undefined,
        answer: q.answer ?? undefined,
        hint: q.hint ?? undefined,
        bloomLevel: q.bloomLevel ?? undefined,
      })),
    })),
    status: paper.status ?? 'DRAFT',
    pdfUrl: paper.pdfUrl ?? undefined,
    canonicalMetadata: paper.canonicalMetadata ?? undefined,
    generatedAt: paper.generatedAt?.toISOString() ?? new Date().toISOString(),
    publishedAt: paper.publishedAt?.toISOString() ?? undefined,
    archivedAt: paper.archivedAt?.toISOString() ?? undefined,
    createdAt: paper.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: paper.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeGenerationJob(job: any, jobId?: string): GenerationJobDto {
  return {
    jobId: jobId ?? job.id,
    assignmentId: job.assignmentId,
    status: job.status ?? 'queued',
    progress: job.progress ?? 0,
    stage: job.stage ?? 'queued',
    generationSeq: job.generationSeq ?? 0,
    error: job.error ?? undefined,
    resultUrl: job.resultUrl ?? undefined,
    createdAt: job.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function serializeAnswerKey(paper: any): AnswerKeyDto {
  return {
    paperId: paper.id,
    title: paper.title,
    sections: (paper.sections ?? []).map((s: any) => ({
      title: s.title,
      questions: (s.questions ?? [])
        .filter((q: any) => q.answer)
        .map((q: any) => ({
          question: q.question,
          answer: { text: q.answer.text, explanation: q.answer.explanation ?? undefined },
          marks: q.marks,
        })),
    })),
  };
}
