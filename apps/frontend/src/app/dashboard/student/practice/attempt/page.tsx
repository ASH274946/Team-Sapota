'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Award, Check, CheckCircle, Clock, Loader2, X, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

// Interface matching the Quiz in practice/page.tsx
interface Quiz {
  id: string;
  topic: string;
  subject: string;
  questions: Array<{
    id: string;
    question_text: string;
    options: string[];
    answer: string;
    difficulty: string;
    bloomLevel: string;
    ai_confidence_score: number;
    hint?: string;
  }>;
  timeLimitSeconds: number;
  timeRemainingSeconds: number;
  attempts: Record<number, string>;
  isSubmitted: boolean;
  score?: number;
  timeTakenSeconds?: number;
  timestamp: number;
}

function formatTime(secs: number) {
  if (secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const getOptionLetter = (opt: string, idx: number) => {
  const match = opt.match(/^([A-D])[\)\.]\s*(.*)/i);
  if (match) return match[1].toUpperCase();
  return String.fromCharCode(65 + idx);
};

const cleanOptionText = (opt: string) => {
  return opt.replace(/^([A-D])[\)\.]\s*/i, '');
};

function AttemptPageContent() {
  const router = useRouter();
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      toast.error('No active quiz found.');
      router.replace('/student/practice');
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await apiClient.get<{success: boolean, data: any}>(`/generate/session/${sessionId}`);
        const data = res?.data?.data;
        if (!data) {
          throw new Error('No data returned from API');
        }
        
        const isRetake = searchParams.get('retake') === 'true';

        // Ensure remaining time matches if they left and came back (or we just use timeLimit - timeTaken)
        const timeRemaining = isRetake ? (data.timeLimitSeconds || 0) : ((data.timeLimitSeconds || 0) - (data.timeTakenSeconds || 0));

        setActiveQuiz({
          id: data.id,
          topic: data.topic,
          subject: data.subject,
          questions: Array.isArray(data.questions) ? data.questions.map((q: any) => ({
            id: q.id,
            question_text: q.questionText || q.question_text || '',
            options: q.options || [],
            answer: q.answer || '',
            difficulty: q.difficulty || '',
            bloomLevel: q.bloomLevel || '',
            ai_confidence_score: q.aiConfidenceScore || q.ai_confidence_score || 0.85,
            hint: q.hint || ''
          })) : [],
          timeLimitSeconds: data.timeLimitSeconds || 0,
          timeRemainingSeconds: timeRemaining,
          attempts: isRetake ? {} : (data.attempts || {}),
          isSubmitted: isRetake ? false : (!!data.score || ((data.timeTakenSeconds || 0) > 0 && Object.keys(data.attempts || {}).length > 0)),
          score: isRetake ? 0 : (data.score || 0),
          timeTakenSeconds: isRetake ? 0 : (data.timeTakenSeconds || 0),
          timestamp: Date.now()
        });
      } catch (err: any) {
        console.error('Fetch Session Error:', err);
        toast.error(`Failed to load quiz state: ${err.message || 'Unknown error'}`);
        router.replace('/student/practice');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router, sessionId]);

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !sessionId) return;
    const toastId = toast.loading('Submitting quiz...');

    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (activeQuiz.attempts[idx] === q.answer) {
        score++;
      }
    });
    const timeTaken = activeQuiz.timeLimitSeconds - activeQuiz.timeRemainingSeconds;

    const updated = {
      ...activeQuiz,
      isSubmitted: true,
      score,
      timeTakenSeconds: timeTaken
    };

    setActiveQuiz(updated);
    
    // Attempt to update session
    try {
      await apiClient.put(`/generate/session/${sessionId}`, {
        score,
        timeTakenSeconds: timeTaken,
        attempts: activeQuiz.attempts
      });
      toast.success('Quiz submitted!', { id: toastId });
    } catch {
      toast.error('Failed to update session!', { id: toastId });
    }
    
    setTimeout(() => {
       router.push('/student/practice');
    }, 1500);
  };

  // Timer Effect
  useEffect(() => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;

    const timer = setInterval(() => {
      setActiveQuiz((prev) => {
        if (!prev || prev.isSubmitted) return prev;
        const newTime = prev.timeRemainingSeconds - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          toast('Time is up! Submitting your quiz...', { icon: '⏱️' });
          void handleSubmitQuiz();
          return { ...prev, timeRemainingSeconds: 0 };
        }
        return { ...prev, timeRemainingSeconds: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);

  }, [activeQuiz?.id, activeQuiz?.isSubmitted]);

  const handleSelectOption = (qIdx: number, val: string) => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;
    setActiveQuiz({
      ...activeQuiz,
      attempts: { ...activeQuiz.attempts, [qIdx]: val }
    });
  };

  const toggleRevealAnswer = (key: string) => {
    setRevealedAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="dashboard-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 size={32} className="animate-spin" color="var(--brand)" />
      </div>
    );
  }

  if (!activeQuiz) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', background: '#F8FAFC', position: 'relative' }}>
      {/* Sticky Quiz Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            type="button"
            onClick={() => router.push('/student/practice')} 
            className="btn btn-outline" 
            style={{ display: 'flex', gap: 6, padding: '6px 12px', alignItems: 'center', fontSize: 13, fontWeight: 600 }}
          >
            <ChevronLeft size={16} /> Exit
          </button>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{activeQuiz.topic} Quiz</h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0 0' }}>{activeQuiz.subject} &middot; {activeQuiz.questions.length} Questions</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            fontSize: 14, 
            fontWeight: 800, 
            color: activeQuiz.timeRemainingSeconds < 30 ? '#EF4444' : '#1E3A8A', 
            background: activeQuiz.timeRemainingSeconds < 30 ? '#FEE2E2' : '#EFF6FF',
            padding: '6px 14px', 
            borderRadius: 8, 
            border: `1px solid ${activeQuiz.timeRemainingSeconds < 30 ? '#FECACA' : '#BFDBFE'}` 
          }}>
            <Clock size={16} className={activeQuiz.timeRemainingSeconds < 30 ? 'animate-pulse' : ''} />
            <span>{formatTime(activeQuiz.timeRemainingSeconds)}</span>
          </div>
        </div>
      </header>

      {/* Questions Content Area */}
      <main style={{ flex: 1, padding: '24px 20px 80px', width: '100%' }}>
        <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeQuiz.isSubmitted && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#ECFDF5', borderColor: '#10B981' }}>
            <Award size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Quiz Completed!</h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 24 }}>You scored {activeQuiz.score} out of {activeQuiz.questions.length}</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirecting back to dashboard...</p>
          </div>
        )}

        {activeQuiz.questions.map((q, qIdx) => {
          const userAttempt = activeQuiz.attempts[qIdx];
          const isAttempted = !!userAttempt;
          const isCorrect = userAttempt === q.answer;
          const isRevealed = revealedAnswers[`active-${qIdx}`] || activeQuiz.isSubmitted;

          return (
            <motion.div key={q.id || qIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={20} color={isAttempted || isRevealed ? '#10B981' : '#9ca3af'} />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Question {qIdx + 1}</h3>
                </div>
                {activeQuiz.isSubmitted && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 12,
                    background: isCorrect ? '#DCFCE7' : '#FEE2E2',
                    color: isCorrect ? '#15803D' : '#B91C1C'
                  }}>
                    {isCorrect ? <Check size={14} /> : <X size={14} />}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 20, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {q.question_text}
              </p>

              {q.hint && (
                <div style={{ marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={() => toggleRevealAnswer(`hint-active-${qIdx}`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#D97706',
                      cursor: 'pointer',
                    }}
                  >
                    💡 {revealedAnswers[`hint-active-${qIdx}`] ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  {revealedAnswers[`hint-active-${qIdx}`] && (
                    <p style={{ marginTop: 8, fontSize: 13, color: '#B45309', background: '#FFFDF5', padding: 8, borderRadius: 6, borderLeft: '3px solid #F59E0B' }}>
                      {q.hint}
                    </p>
                  )}
                </div>
              )}

              {q.options && q.options.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {q.options.map((opt, i) => {
                    const letter = getOptionLetter(opt, i);
                    const isThisSelected = userAttempt === letter;
                    const isThisCorrect = q.answer === letter;
                    
                    let optionBg = '#F9FAFB';
                    let optionBorder = 'var(--border)';
                    let optionColor = 'var(--text-primary)';
                    let iconToShow = null;

                    if (activeQuiz.isSubmitted) {
                      if (isThisCorrect) {
                        optionBg = '#DCFCE7';
                        optionBorder = '#22C55E';
                        optionColor = '#15803D';
                        iconToShow = <Check size={16} style={{ color: '#22C55E', flexShrink: 0 }} />;
                      } else if (isThisSelected) {
                        optionBg = '#FEE2E2';
                        optionBorder = '#EF4444';
                        optionColor = '#B91C1C';
                        iconToShow = <X size={16} style={{ color: '#EF4444', flexShrink: 0 }} />;
                      } else {
                        optionBg = '#F9FAFB';
                        optionBorder = 'var(--border)';
                        optionColor = 'var(--text-muted)';
                      }
                    } else {
                      if (isThisSelected) {
                        optionBg = '#EFF6FF';
                        optionBorder = '#3B82F6';
                        optionColor = '#1E40AF';
                      }
                    }

                    return (
                      <button
                        key={i}
                        disabled={activeQuiz.isSubmitted}
                        onClick={() => handleSelectOption(qIdx, letter)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 16px',
                          background: optionBg,
                          border: `1px solid ${optionBorder}`,
                          borderRadius: 'var(--radius-md)',
                          fontSize: 13,
                          color: optionColor,
                          cursor: activeQuiz.isSubmitted ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: isThisSelected || (activeQuiz.isSubmitted && isThisCorrect) ? 600 : 400,
                        }}
                        className={!activeQuiz.isSubmitted ? 'generate-option-btn' : ''}
                        type="button"
                      >
                        <span>{cleanOptionText(opt)}</span>
                        {iconToShow}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}

        {!activeQuiz.isSubmitted && (
          <div style={{ marginTop: 24, padding: 32, background: '#ffffff', borderTop: '1px solid var(--border)', textAlign: 'center', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Ready to submit?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              Make sure you have answered all questions. You cannot change your answers after submission.
            </p>
            <button 
              type="button" 
              onClick={handleSubmitQuiz} 
              className="btn btn-dark" 
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
            >
              <CheckCircle size={16} /> Submit
            </button>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default function AttemptPage() {
  return (
    <Suspense fallback={<div className="dashboard-view"><Loader2 className="animate-spin" /></div>}>
      <AttemptPageContent />
    </Suspense>
  );
}
