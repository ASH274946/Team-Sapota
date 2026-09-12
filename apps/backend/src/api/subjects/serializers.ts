import type { SubjectResponseDto, SubjectSyllabusResponseDto, SubjectTeacherDto, TopicDto, SubtopicDto } from './dto';

interface PrismaSubject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  grade: string | null;
  credits: number | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaSyllabus {
  id: string;
  title: string;
  subject: string;
  grade: string | null;
  status: string;
  topics: Array<{
    id: string;
    title: string;
    description: string | null;
    duration: number | null;
    topicOrder: number;
    completed: boolean;
    subtopics: Array<{
      id: string;
      title: string;
      topicOrder: number;
      completed: boolean;
    }>;
  }>;
}

interface PrismaTeacher {
  id: string;
  name: string;
  email: string;
}

export function serializeSubject(subject: PrismaSubject): SubjectResponseDto {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
    grade: subject.grade,
    credits: subject.credits,
    organizationId: subject.organizationId,
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString(),
  };
}

function serializeSubtopic(subtopic: PrismaSyllabus['topics'][0]['subtopics'][0]): SubtopicDto {
  return {
    id: subtopic.id,
    title: subtopic.title,
    topicOrder: subtopic.topicOrder,
    completed: subtopic.completed,
  };
}

function serializeTopic(topic: PrismaSyllabus['topics'][0]): TopicDto {
  return {
    id: topic.id,
    title: topic.title,
    description: topic.description,
    duration: topic.duration,
    topicOrder: topic.topicOrder,
    completed: topic.completed,
    subtopics: topic.subtopics.map(serializeSubtopic),
  };
}

export function serializeSubjectSyllabus(syllabus: PrismaSyllabus): SubjectSyllabusResponseDto {
  return {
    id: syllabus.id,
    title: syllabus.title,
    subject: syllabus.subject,
    grade: syllabus.grade,
    status: syllabus.status,
    topics: syllabus.topics.map(serializeTopic),
  };
}

export function serializeSubjectTeacher(teacher: PrismaTeacher): SubjectTeacherDto {
  return {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
  };
}
