'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/sockets/socket.client';
import { useTutorStore } from '@/store/tutor.store';
import { useAuthStore } from '@/store/auth.store';
import type { TutorMessage } from '@/types/tutor.types';
import type {
  TutorChunkPayload,
  TutorDonePayload,
  TutorErrorPayload,
  TutorSourcesPayload,
} from '@/types/socket.types';

const TUTOR_SOCKET_TIMEOUT_MS = 1_500;

interface TutorSocketCallbacks {
  onStreamComplete?: (message: TutorMessage) => void;
  onStreamError?: (error: string) => void;
}

export function useTutorSocket(sessionId: string | null, callbacks: TutorSocketCallbacks = {}) {
  const user = useAuthStore((s) => s.user);
  const setActiveSessionId = useTutorStore((s) => s.setActiveSessionId);
  const setSocketReady = useTutorStore((s) => s.setSocketReady);
  const appendToken = useTutorStore((s) => s.appendToken);
  const setSources = useTutorStore((s) => s.setSources);
  const completeStream = useTutorStore((s) => s.completeStream);
  const failStream = useTutorStore((s) => s.failStream);
  const flushPendingChunks = useTutorStore((s) => s.flushPendingChunks);
  const resetStream = useTutorStore((s) => s.resetStream);

  const handlersRef = useRef({
    appendToken,
    setSources,
    completeStream,
    failStream,
    flushPendingChunks,
    callbacks,
  });

  useEffect(() => {
    handlersRef.current = {
      appendToken,
      setSources,
      completeStream,
      failStream,
      flushPendingChunks,
      callbacks,
    };
  }, [appendToken, setSources, completeStream, failStream, flushPendingChunks, callbacks]);

  useEffect(() => {
    if (!sessionId || !user?.id) return;

    setActiveSessionId(sessionId);
    const socket = getSocket();

    const joinSession = () => {
      socket.emit('authenticate', { userId: user.id });
      socket.emit('tutor:join_session', { sessionId });
      setSocketReady(true);

      const buffered = handlersRef.current.flushPendingChunks();
      if (buffered.length > 0) {
        const active = useTutorStore.getState().activeStream;
        if (active) {
          for (const token of buffered) {
            handlersRef.current.appendToken(active.requestId, token);
          }
        }
      }
    };

    const onConnect = () => joinSession();
    const onSources = (payload: TutorSourcesPayload) => {
      handlersRef.current.setSources(payload.requestId, payload.sources);
    };
    const onChunk = (payload: TutorChunkPayload) => {
      handlersRef.current.appendToken(payload.requestId, payload.token);
    };
    const onDone = (payload: TutorDonePayload) => {
      const completed = handlersRef.current.completeStream(payload.requestId, payload);
      if (completed) {
        handlersRef.current.callbacks.onStreamComplete?.(completed);
      }
    };
    const onError = (payload: TutorErrorPayload) => {
      if (payload.requestId !== 'join') {
        handlersRef.current.failStream(payload.requestId, payload.error);
        handlersRef.current.callbacks.onStreamError?.(payload.error);
      }
    };

    socket.on('connect', onConnect);
    socket.on('tutor:sources', onSources);
    socket.on('tutor:chunk', onChunk);
    socket.on('tutor:done', onDone);
    socket.on('tutor:error', onError);

    if (socket.connected) {
      joinSession();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('tutor:sources', onSources);
      socket.off('tutor:chunk', onChunk);
      socket.off('tutor:done', onDone);
      socket.off('tutor:error', onError);
      socket.emit('tutor:leave_session', { sessionId });
      resetStream();
      setSocketReady(false);
      setActiveSessionId(null);
    };
  }, [sessionId, user?.id, setActiveSessionId, setSocketReady, resetStream]);

  const waitForSocketReady = async (): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < TUTOR_SOCKET_TIMEOUT_MS) {
      const socket = getSocket();
      if (socket.connected && useTutorStore.getState().socketReady) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return false;
  };

  const streamQuery = async (
    message: string,
    mode: string,
    requestId: string
  ): Promise<'socket' | 'http'> => {
    const ready = await waitForSocketReady();
    if (!ready || !sessionId) return 'http';

    const socket = getSocket();
    socket.emit('tutor:stream_query', {
      sessionId,
      message,
      mode,
      requestId,
    });
    return 'socket';
  };

  return { streamQuery, waitForSocketReady };
}
