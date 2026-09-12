export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
  grade?: string;
  credits?: number;
  organizationId: string;
}

export interface UpdateSubjectDto {
  name?: string;
  code?: string;
  description?: string;
  grade?: string;
  credits?: number;
}

export interface SubjectResponseDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  grade: string | null;
  credits: number | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectSyllabusResponseDto {
  id: string;
  title: string;
  subject: string;
  grade: string | null;
  status: string;
  topics: TopicDto[];
}

export interface TopicDto {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  topicOrder: number;
  completed: boolean;
  subtopics: SubtopicDto[];
}

export interface SubtopicDto {
  id: string;
  title: string;
  topicOrder: number;
  completed: boolean;
}

export interface SubjectTeacherDto {
  id: string;
  name: string;
  email: string;
}
