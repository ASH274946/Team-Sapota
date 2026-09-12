import type { SyllabusResponseDto, TopicResponseDto, SubtopicDto } from './dto';

interface PrismaSyllabus {
  id: string;
  title: string;
  subject: string;
  grade: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  topics?: Array<{
    id: string;
    syllabusId: string;
    title: string;
    description: string | null;
    duration: number | null;
    topicOrder: number;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
    subtopics?: Array<{
      id: string;
      title: string;
      topicOrder: number;
      completed: boolean;
    }>;
  }>;
}

interface PrismaTopic {
  id: string;
  syllabusId: string;
  title: string;
  description: string | null;
  duration: number | null;
  topicOrder: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  subtopics?: Array<{
    id: string;
    title: string;
    topicOrder: number;
    completed: boolean;
  }>;
}

function serializeSubtopic(subtopic: NonNullable<PrismaTopic['subtopics']>[0]): SubtopicDto {
  return {
    id: subtopic.id,
    title: subtopic.title,
    topicOrder: subtopic.topicOrder,
    completed: subtopic.completed,
  };
}

function serializeTopic(topic: PrismaTopic): TopicResponseDto {
  return {
    id: topic.id,
    syllabusId: topic.syllabusId,
    title: topic.title,
    description: topic.description,
    duration: topic.duration,
    topicOrder: topic.topicOrder,
    completed: topic.completed,
    subtopics: (topic.subtopics || []).map(serializeSubtopic),
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  };
}

export function serializeSyllabus(syllabus: PrismaSyllabus): SyllabusResponseDto {
  return {
    id: syllabus.id,
    title: syllabus.title,
    subject: syllabus.subject,
    grade: syllabus.grade,
    status: syllabus.status,
    description: null,
    subjectId: null,
    topics: (syllabus.topics || []).map(serializeTopic),
    createdAt: syllabus.createdAt.toISOString(),
    updatedAt: syllabus.updatedAt.toISOString(),
  };
}

export function serializeTopicResponse(topic: PrismaTopic): TopicResponseDto {
  return serializeTopic(topic);
}
