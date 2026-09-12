export type SyllabusStatus = 'active' | 'archived' | 'draft';

export interface SyllabusTopic {
  id: string;
  title: string;
  description?: string;
  duration: number;
  completed: boolean;
  subtopics?: SyllabusSubtopic[];
}

export interface SyllabusSubtopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface Syllabus {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topics: SyllabusTopic[];
  status: SyllabusStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusListResponse {
  success: boolean;
  data: Syllabus[];
}

export interface SyllabusDetailResponse {
  success: boolean;
  data: Syllabus;
}
