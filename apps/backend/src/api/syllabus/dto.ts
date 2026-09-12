export interface CreateSyllabusDto {
  title: string;
  subject: string;
  subjectId?: string;
  grade?: string;
  description?: string;
  topics?: CreateTopicDto[];
}

export interface UpdateSyllabusDto {
  title?: string;
  subject?: string;
  grade?: string;
  status?: string;
  description?: string;
}

export interface CreateTopicDto {
  title: string;
  description?: string;
  duration?: number;
  subtopics?: Array<{ title: string; completed?: boolean }>;
}

export interface UpdateTopicDto {
  title?: string;
  description?: string;
  duration?: number;
  completed?: boolean;
}

export interface UpdateSubtopicsDto {
  subtopics: Array<{
    id?: string;
    title: string;
    topicOrder?: number;
    completed?: boolean;
  }>;
}

export interface SyllabusResponseDto {
  id: string;
  title: string;
  subject: string;
  grade: string | null;
  status: string;
  description: string | null;
  subjectId: string | null;
  topics: TopicResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TopicResponseDto {
  id: string;
  syllabusId: string;
  title: string;
  description: string | null;
  duration: number | null;
  topicOrder: number;
  completed: boolean;
  subtopics: SubtopicDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SubtopicDto {
  id: string;
  title: string;
  topicOrder: number;
  completed: boolean;
}
