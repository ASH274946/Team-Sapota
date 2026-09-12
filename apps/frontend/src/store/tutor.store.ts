import { create } from 'zustand';
import type { TutorMessage, RagSourceCitation } from '@/types/tutor.types';

interface ActiveStream {
  requestId: string;
  messageId: string;
  content: string;
  sources: RagSourceCitation[];
  ragReferences?: unknown;
  confidence?: number;
  followUp?: string;
  status: 'streaming' | 'done' | 'error';
  error?: string;
}

interface TutorState {
  activeSessionId: string | null;
  socketReady: boolean;
  activeStream: ActiveStream | null;
  pendingChunks: string[];

  setActiveSessionId: (sessionId: string | null) => void;
  setSocketReady: (ready: boolean) => void;
  startStream: (requestId: string, optimisticMessageId: string) => void;
  appendToken: (requestId: string, token: string) => void;
  setSources: (requestId: string, sources: RagSourceCitation[]) => void;
  completeStream: (
    requestId: string,
    payload: {
      messageId: string;
      message: string;
      followUp?: string;
      confidence?: number;
      ragReferences?: unknown;
    }
  ) => TutorMessage | null;
  failStream: (requestId: string, error: string) => void;
  flushPendingChunks: () => string[];
  resetStream: () => void;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  activeSessionId: null,
  socketReady: false,
  activeStream: null,
  pendingChunks: [],

  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),

  setSocketReady: (ready) => set({ socketReady: ready }),

  startStream: (requestId, optimisticMessageId) =>
    set({
      activeStream: {
        requestId,
        messageId: optimisticMessageId,
        content: '',
        sources: [],
        status: 'streaming',
      },
      pendingChunks: [],
    }),

  appendToken: (requestId, token) =>
    set((state) => {
      if (!state.activeStream || state.activeStream.requestId !== requestId) {
        return { pendingChunks: [...state.pendingChunks, token] };
      }
      return {
        activeStream: {
          ...state.activeStream,
          content: state.activeStream.content + token,
        },
      };
    }),

  setSources: (requestId, sources) =>
    set((state) => {
      if (!state.activeStream || state.activeStream.requestId !== requestId) return state;
      return {
        activeStream: {
          ...state.activeStream,
          sources,
          ragReferences: { source: 'rag_engine', contextRetrieved: true, citations: sources },
        },
      };
    }),

  completeStream: (requestId, payload) => {
    const state = get();
    if (!state.activeStream || state.activeStream.requestId !== requestId) return null;

    const completed: TutorMessage = {
      id: payload.messageId,
      sessionId: state.activeSessionId ?? '',
      role: 'ASSISTANT',
      content: payload.message,
      createdAt: new Date().toISOString(),
      confidence: payload.confidence,
      ragReferences: payload.ragReferences ?? state.activeStream.ragReferences,
      sources: state.activeStream.sources,
    };

    set({ activeStream: null, pendingChunks: [] });
    return completed;
  },

  failStream: (requestId, error) =>
    set((state) => {
      if (!state.activeStream || state.activeStream.requestId !== requestId) return state;
      return {
        activeStream: { ...state.activeStream, status: 'error', error },
      };
    }),

  flushPendingChunks: () => {
    const chunks = get().pendingChunks;
    if (chunks.length === 0) return [];
    set({ pendingChunks: [] });
    return chunks;
  },

  resetStream: () => set({ activeStream: null, pendingChunks: [] }),
}));
