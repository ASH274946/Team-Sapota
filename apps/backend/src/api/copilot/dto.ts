export interface AssistRequestDto {
  query: string;
  context?: string;
  subject?: string;
}

export interface GenerateLessonPlanDto {
  subject: string;
  topic: string;
  duration: string;
  learningOutcomes: string[];
}

export interface GenerateActivityDto {
  subject: string;
  topic: string;
  duration?: string;
  groupSize?: number;
  objectives?: string[];
}

export interface GenerateWorksheetDto {
  title: string;
  subject: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface CopilotFeedbackDto {
  historyId: string;
  rating: number;
  comment?: string;
}

export interface CopilotResponseDto {
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CopilotHistoryDto {
  id: string;
  userId: string;
  action: string;
  input: unknown;
  output: unknown;
  createdAt: Date;
}

export interface LessonPlanResultDto {
  id: string;
  title: string;
  subject: string;
  duration: string;
  objectives: string;
  activities: string[];
  assessments: string[];
  content: string;
  createdAt: Date;
}

export interface ActivityResultDto {
  id: string;
  title: string;
  description: string;
  duration: string;
  materials: string[];
  instructions: string[];
}

export interface WorksheetResultDto {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  content: string;
  answerKey: string;
  createdAt: Date;
}
