'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Send,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  BrainCircuit,
  Lightbulb,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useTutorStore } from '@/store/tutor.store';
import { useTutorSocket } from '@/hooks/useTutorSocket';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import type { TutorSessionDetail, TutorMessage } from '@/types/tutor.types';
import { getSession, sendChatMessage, closeSession, generateFlashcards } from '@/services/tutor.service';
import { FlashcardModal } from '@/components/ui/FlashcardModal';
import {
  Message,
  MessageAvatar,
  MessageStack,
  MessageContent,
  MessageMarkdown,
  MessageActions,
  MessageActionGroup,
  MessageAction,
} from '@/components/ui/Message';
import {
  Citation,
  CitationTrigger,
  CitationContent,
  CitationItem,
  CitationSource,
} from '@/components/ui/Citation';
import { FeedbackBar } from '@/components/ui/FeedbackBar';
import { TextShimmer } from '@/components/ui/TextShimmer';

export default function TutorChatPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuthStore();
  const router = useRouter();

  const lastQueryRef = useRef('');

  const activeStream = useTutorStore((s) => s.activeStream);
  const startStream = useTutorStore((s) => s.startStream);
  const resetStream = useTutorStore((s) => s.resetStream);

  const [session, setSession] = useState<TutorSessionDetail | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'standard' | 'hint' | 'socratic'>('standard');
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);

  const socketCallbacks = useMemo(
    () => ({
      onStreamComplete: (message: TutorMessage) => {
        setMessages((prev) => [...prev, message]);
        setIsSending(false);
      },
      onStreamError: async (error: string) => {
        try {
          if (lastQueryRef.current) {
            const res = await sendChatMessage(id, lastQueryRef.current, mode);
            const assistantMsg: TutorMessage = {
              id: res.messageId || 'msg-fallback',
              sessionId: id,
              role: 'ASSISTANT',
              content: res.message,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        } catch {
          toast.error(error || 'Streaming failed');
        } finally {
          useTutorStore.getState().resetStream();
          setIsSending(false);
        }
      },
    }),
    [id, mode]
  );

  const { streamQuery } = useTutorSocket(id, socketCallbacks);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSession(id);
      setSession(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tutor session');
      toast.error('Could not load session');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchSession();
    }
  }, [fetchSession, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeStream?.content]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || isSending) return;

    const reqId = `req-${Date.now()}`;
    const optimisticId = `msg-${Date.now()}`;

    lastQueryRef.current = query;
    setInputValue('');
    setIsSending(true);

    const userMessage: TutorMessage = {
      id: `temp-${Date.now()}`,
      sessionId: id,
      role: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      startStream(reqId, optimisticId);
      const transport = await streamQuery(query, mode, reqId);
      if (transport === 'http') {
        const res = await sendChatMessage(id, query, mode);
        const assistantMsg: TutorMessage = {
          id: res.messageId || `msg-${Date.now()}`,
          sessionId: id,
          role: 'ASSISTANT',
          content: res.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        resetStream();
        setIsSending(false);
      }
    } catch {
      try {
        const res = await sendChatMessage(id, query, mode);
        const assistantMsg: TutorMessage = {
          id: res.messageId || `msg-${Date.now()}`,
          sessionId: id,
          role: 'ASSISTANT',
          content: res.message,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        toast.error('Failed to send message');
      } finally {
        resetStream();
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to end this tutor session?')) return;
    try {
      await closeSession(id);
      toast.success('Session ended');
      fetchSession();
    } catch {
      toast.error('Failed to end session');
    }
  };

  const streamingMessage: TutorMessage | null = activeStream
    ? {
        id: 'streaming-assistant',
        sessionId: id,
        role: 'ASSISTANT',
        content: activeStream.content,
        isStreaming: true,
        createdAt: new Date().toISOString(),
        sources: activeStream.sources,
        ragReferences: activeStream.ragReferences,
      }
    : null;

  const displayMessages = (streamingMessage ? [...messages, streamingMessage] : messages).filter(
    (m) => m.isStreaming || Boolean(m.content && m.content.trim().length > 0)
  );

  if (isLoading) return <LoadingState lines={8} />;
  if (error || !session) return <ErrorState message={error || 'Session not found'} onRetry={fetchSession} />;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Link
            href="/student/tutor"
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-neutral-900 leading-none">{session.subject}</h1>
            <p className="text-xs text-neutral-500 mt-1">AI Tutor &middot; {session.tutorMode} Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFlashcardModalOpen(true)}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
          >
            <Lightbulb size={13} className="mr-1.5" /> Flashcards
          </Button>

          {session.status === 'ACTIVE' ? (
            <Button variant="outline" size="sm" onClick={handleCloseSession} className="text-red-600 border-red-200 text-xs">
              End Session
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const { restartSession } = await import('@/services/tutor.service');
                  await restartSession(id);
                  toast.success('Session restarted');
                  fetchSession();
                } catch {
                  toast.error('Failed to restart session');
                }
              }}
              className="text-xs"
            >
              <RotateCcw size={13} className="mr-1.5" /> Restart
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border border-neutral-200 shadow-xs">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-neutral-50/50">
          {displayMessages.length === 0 ? (
            <div className="m-auto text-center text-neutral-500 py-16">
              <div className="w-14 h-14 bg-orange-100 text-[#e05934] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-1">Ready to learn?</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Ask a question about {session.subject} to get started. You can toggle Hint or Socratic mode below.
              </p>
            </div>
          ) : (
            displayMessages.map((msg, idx) => {
              const isUser = msg.role === 'USER';
              const sources = msg.sources ?? [];

              return (
                <Message key={msg.id || idx} from={isUser ? 'user' : 'assistant'}>
                  {!isUser && <MessageAvatar isAssistant={true} />}

                  <MessageStack>
                    <MessageContent from={isUser ? 'user' : 'assistant'}>
                      <MessageMarkdown>{msg.content}</MessageMarkdown>

                      {msg.isStreaming && !msg.content && (
                        <TextShimmer className="text-xs italic">Tutor is thinking...</TextShimmer>
                      )}

                      {/* RAG Grounded Sources Citations */}
                      {!isUser && sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200/60 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-neutral-500">Sources:</span>
                          {sources.map((s, sIdx) => {
                            const citation: CitationSource = {
                              title: s.filename,
                              description: s.excerpt,
                              chapter: s.topic,
                            };
                            return (
                              <Citation key={s.chunkId || sIdx} citations={[citation]} index={sIdx + 1}>
                                <CitationTrigger>
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>{s.filename.slice(0, 14)}...</span>
                                </CitationTrigger>
                                <CitationContent>
                                  <CitationItem />
                                </CitationContent>
                              </Citation>
                            );
                          })}
                        </div>
                      )}

                      {!isUser && !sources.length && !!msg.ragReferences && (
                        <div className="mt-2 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400 flex items-center gap-1">
                          <AlertCircle size={11} /> Sourced from institution curriculum
                        </div>
                      )}
                    </MessageContent>

                    {/* Actions & Feedback */}
                    {!isUser && !msg.isStreaming && msg.content && (
                      <MessageActions>
                        <MessageActionGroup>
                          <MessageAction icon="copy" tooltip="Copy answer" />
                          <MessageAction icon="regenerate" tooltip="Regenerate explanation" onClick={() => handleSend()} />
                        </MessageActionGroup>
                        <FeedbackBar
                          targetId={msg.id}
                          targetType="tutor_message"
                          showCommentOption={false}
                          className="ml-auto"
                        />
                      </MessageActions>
                    )}
                  </MessageStack>

                  {isUser && (
                    <MessageAvatar
                      src={user?.avatar || user?.avatarUrl || undefined}
                      fallback={user?.firstName?.[0]?.toUpperCase() || 'S'}
                    />
                  )}
                </Message>
              );
            })
          )}

          {isSending && !activeStream && (
            <div className="flex items-center gap-2.5 text-xs text-neutral-500 py-2">
              <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#e05934] flex items-center justify-center">
                <BrainCircuit size={14} className="animate-pulse" />
              </div>
              <TextShimmer>Connecting to AI Tutor neural stream...</TextShimmer>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form & Mode Selector */}
        {session.status === 'ACTIVE' ? (
          <div className="p-3 sm:p-4 border-t border-neutral-200 bg-white">
            {/* Mode Pills */}
            <div className="flex items-center gap-2 mb-2.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'standard'
                    ? 'bg-[#e05934] text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode('hint')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'hint'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <Lightbulb size={12} /> Hint Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('socratic')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'socratic'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <BrainCircuit size={12} /> Socratic Mode
              </button>
            </div>

            <form onSubmit={handleSend} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask a question in ${mode} mode... (Press Enter to send)`}
                disabled={isSending}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 focus:outline-none max-h-32 min-h-[44px]"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!inputValue.trim() || isSending}
                className="h-11 px-4 bg-[#e05934] hover:bg-[#c94a2a] text-white rounded-xl"
              >
                <Send size={15} />
              </Button>
            </form>
          </div>
        ) : (
          <div className="p-3 text-center text-xs text-neutral-400 bg-neutral-50 border-t border-neutral-200">
            This session has been closed.
          </div>
        )}
      </Card>

      <FlashcardModal
        open={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        fetchFlashcards={() => generateFlashcards(id)}
      />
    </div>
  );
}
