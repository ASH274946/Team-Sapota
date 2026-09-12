import type {
  TutorSessionDto,
  TutorMessageDto,
  TutorSessionDetailDto,
  ChatResponseDto,
  TutorConfigDto,
} from './dto';

export function serializeSession(session: any): TutorSessionDto {
  return {
    id: session.id,
    studentId: session.studentId,
    subject: session.subject,
    status: session.status,
    tutorMode: session.tutorMode,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function serializeMessage(msg: any): TutorMessageDto {
  return {
    id: msg.id,
    sessionId: msg.sessionId,
    role: msg.role,
    content: msg.content,
    confidence: msg.confidence,
    ragReferences: msg.ragReferences,
    createdAt: msg.createdAt,
  };
}

export function serializeSessionDetail(session: any): TutorSessionDetailDto {
  return {
    ...serializeSession(session),
    messages: (session.messages || []).map(serializeMessage),
  };
}

export function serializeChatResponse(response: any): ChatResponseDto {
  return {
    message: response.message,
    followUp: response.followUp,
    messageId: response.messageId,
  };
}

export function serializeConfig(config: any): TutorConfigDto {
  return {
    allowDirectAnswers: config?.allowDirectAnswers ?? false,
    maxExplanationDepth: config?.maxExplanationDepth ?? 3,
  };
}
