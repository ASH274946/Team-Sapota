import type {
  CopilotResponseDto,
  CopilotHistoryDto,
  LessonPlanResultDto,
  ActivityResultDto,
  WorksheetResultDto,
} from './dto';

export function serializeCopilotResponse(response: any): CopilotResponseDto {
  return {
    content: typeof response === 'string' ? response : response.content ?? '',
    metadata: response.metadata,
  };
}

export function serializeHistory(entry: any): CopilotHistoryDto {
  return {
    id: entry.id,
    userId: entry.userId,
    action: entry.action ?? entry.type,
    input: entry.input ?? entry.prompt,
    output: entry.output ?? entry.response,
    createdAt: entry.createdAt,
  };
}

export function serializeLessonPlan(plan: any): LessonPlanResultDto {
  return {
    id: plan.id,
    title: plan.title,
    subject: plan.subject,
    duration: plan.duration,
    objectives: plan.objectives,
    activities: plan.activities ?? [],
    assessments: plan.assessments ?? [],
    content: plan.content,
    createdAt: plan.createdAt,
  };
}

export function serializeActivity(activity: any): ActivityResultDto {
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    duration: activity.duration ?? '30 minutes',
    materials: activity.materials ?? [],
    instructions: activity.instructions ?? [],
  };
}

export function serializeWorksheet(ws: any): WorksheetResultDto {
  return {
    id: ws.id,
    title: ws.title,
    subject: ws.subject,
    topic: ws.topic,
    difficulty: ws.difficulty,
    content: ws.content,
    answerKey: ws.answerKey,
    createdAt: ws.createdAt,
  };
}
