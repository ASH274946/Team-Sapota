'use client';


import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, AlertCircle, ImageOff, Check, X, Eye, History, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';
import { QuizGeneratorForm, type QuizFormData } from '@/components/generate/QuizGeneratorForm';
import { QuizHistory } from '@/components/generate/QuizHistory';

export interface GeneratedQuestion {
  id: string;
  question_text: string;
  options?: string[];
  answer?: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

export interface Quiz {
  id: string;
  topic: string;
  subject: string;
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeRemainingSeconds: number;
  timeTakenSeconds?: number;
  attempts: Record<number, string>; // question index -> option letter
  isSubmitted: boolean;
  score?: number;
  timestamp: number;
}

export interface HistoryQuiz {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  attempts: Record<number, string>;
  score: number;
  timestamp: number;
}

// Shape returned by GET /api/v1/generate/history
interface ApiQuizSession {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  score: number;
  attempts: Record<string, string>;
  userId: string;
  createdAt: string;
  questions: Array<{
    id: string;
    questionIndex: number;
    questionText: string;
    options: string[];
    answer: string;
    difficulty: string;
    bloomLevel: string;
    aiConfidenceScore: number;
    hint?: string;
  }>;
}

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<QuizFormData>({
    topic: '',
    subject: '',
    difficulty: 'MEDIUM',
    bloom_level: 'APPLY',
    numQuestions: 5,
    context: ''
  });

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Convert API session to HistoryQuiz
  const mapSessionToHistory = (s: ApiQuizSession): HistoryQuiz => ({
    id: s.id,
    topic: s.topic,
    subject: s.subject,
    difficulty: s.difficulty,
    bloomLevel: s.bloomLevel,
    questions: s.questions.map((q) => ({
      id: q.id,
      question_text: q.questionText,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      ai_confidence_score: q.aiConfidenceScore,
      hint: q.hint,
    })),
    timeLimitSeconds: s.timeLimitSeconds,
    timeTakenSeconds: s.timeTakenSeconds,
    attempts: s.attempts as Record<number, string>,
    score: s.score,
    timestamp: new Date(s.createdAt).getTime(),
  });

  // Load history from database
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiQuizSession[] }>('/generate/history');
      setHistory(res.data.data.map(mapSessionToHistory));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load history on mount
  useEffect(() => { void loadHistory(); }, [loadHistory]);

  // Save a completed quiz session to database
  const persistSession = async (quiz: Quiz, score: number, timeTaken: number): Promise<string | null> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', {
        topic: quiz.topic,
        subject: quiz.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: quiz.timeLimitSeconds,
        timeTakenSeconds: timeTaken,
        score,
        attempts: quiz.attempts,
        questions: quiz.questions,
      });
      return res.data.data.id;
    } catch {
      return null;
    }
  };

  const submitQuizData = (quiz: Quiz) => {
    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      const attempt = quiz.attempts[idx];
      if (attempt === q.answer) {
        score++;
      }
    });

    const timeTaken = quiz.timeLimitSeconds - quiz.timeRemainingSeconds;

    // Build optimistic history entry for immediate UI update
    const historyQuiz: HistoryQuiz = {
      id: quiz.id,
      topic: quiz.topic,
      subject: quiz.subject,
      difficulty: formData.difficulty,
      bloomLevel: formData.bloom_level,
      questions: quiz.questions,
      timeLimitSeconds: quiz.timeLimitSeconds,
      timeTakenSeconds: timeTaken,
      attempts: quiz.attempts,
      score,
      timestamp: Date.now()
    };

    // Optimistic UI update, then persist to DB
    setHistory(prev => [historyQuiz, ...prev.filter(h => h.id !== quiz.id)]);
    
    // Update the existing session via PUT
    apiClient.put(`/generate/session/${quiz.id}`, {
      score,
      timeTakenSeconds: timeTaken,
      attempts: quiz.attempts
    }).then(() => void loadHistory()).catch(() => toast.error('Failed to update score'));

    setActiveQuiz(prev => prev ? { ...prev, isSubmitted: true, score, timeTakenSeconds: timeTaken } : null);
    toast.success(`Quiz Completed! You scored ${score}/${quiz.questions.length}`);
  };

  const handleAutoSubmit = (quiz: Quiz) => {
    toast.error("Time is up! Quiz submitted automatically.");
    submitQuizData(quiz);
  };

  // Timer Effect
  useEffect(() => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;

    const timer = setInterval(() => {
      setActiveQuiz(prev => {
        if (!prev) return null;
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(timer);
          // Auto submit
          handleAutoSubmit(prev);
          return {
            ...prev,
            timeRemainingSeconds: 0,
            isSubmitted: true
          };
        }
        return {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz?.id, activeQuiz?.isSubmitted]);

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    const unansweredCount = activeQuiz.questions.length - Object.keys(activeQuiz.attempts).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) {
        return;
      }
    }
    submitQuizData(activeQuiz);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActiveQuiz(null);
    setGenerationError(null);
    setRevealedAnswers({});
    try {
      const count = formData.numQuestions;
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion[] }>('/generate/questions', {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        context: formData.context || undefined,
        count,
      });
      const questions = res.data.data;

      const timeLimit = count * 60; // 1 minute per question
      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        topic: formData.topic,
        subject: formData.subject,
        questions,
        timeLimitSeconds: timeLimit,
        timeRemainingSeconds: timeLimit,
        attempts: {},
        isSubmitted: false,
        timestamp: Date.now()
      };

      // Instantly save to database
      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>('/generate/session', {
        topic: formData.topic,
        subject: formData.subject,
        difficulty: formData.difficulty,
        bloomLevel: formData.bloom_level,
        timeLimitSeconds: timeLimit,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions
      });
      newQuiz.id = saveRes.data.data.id;

      setActiveQuiz(newQuiz);
      toast.success(`${count} questions generated and saved to history!`);
      void loadHistory();
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Generation failed';
      if (message.includes('API key') || message.includes('401') || message.includes('providers [')) {
        message = 'AI service configuration error: Valid API key missing or unauthorized. Please check your backend .env configuration.';
      }
      setGenerationError(message);
      if (message.toLowerCase().includes('daily quiz limit') || message.toLowerCase().includes('limit exceeded') || message.toLowerCase().includes('per day')) {
        toast.error(`Daily limit reached. You can generate up to 5 quizzes per day. Try again tomorrow!`);
      } else if (message.includes('image') || message.includes('png') || message.includes('jpg')) {
        toast.error('Image references detected. Please use text-only content.');
      } else if (message.includes('API key') || message.includes('configuration error')) {
        toast.error('AI service unavailable. Please check your API key configuration.');
      } else if (message.includes('30 seconds') || message.includes('slow down')) {
        toast.error('Please wait a moment before generating another quiz.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getOptionLetter = (optionText: string, index: number): string => {
    const match = optionText.trim().match(/^([A-Da-d])\s*[\.\)]/);
    if (match) {
      return match[1].toUpperCase();
    }
    return String.fromCharCode(65 + index); // Fallback
  };

  const cleanOptionText = (optionText: string): string => {
    return optionText;
  };

  const handleSelectOption = (qIdx: number, letter: string) => {
    if (!activeQuiz || activeQuiz.isSubmitted) return;
    setActiveQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        attempts: {
          ...prev.attempts,
          [qIdx]: letter
        }
      };
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const toggleRevealAnswer = (key: string) => {
    setRevealedAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReattemptHistoryQuiz = (hQuiz: HistoryQuiz) => {
    const timeLimit = hQuiz.questions.length * 60;
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      topic: hQuiz.topic,
      subject: hQuiz.subject,
      questions: hQuiz.questions,
      timeLimitSeconds: timeLimit,
      timeRemainingSeconds: timeLimit,
      attempts: {},
      isSubmitted: false,
      timestamp: Date.now()
    };
    setActiveQuiz(newQuiz);
    setActiveTab('generate');
    setRevealedAnswers({});
    toast.success('Retrying past quiz! Timer started.');
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your quiz history?')) return;
    try {
      await apiClient.delete('/generate/history');
      setHistory([]);
      toast.success('History cleared.');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={24} color="#0f172a" />
            <h1 className="page-title">Generate Quiz</h1>
          </div>
          <p className="page-subtitle">Instantly generate syllabus-aligned multiple choice quizzes to test student concepts.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button 
            type="button" 
            onClick={() => setActiveTab('generate')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              background: activeTab === 'generate' ? '#ffffff' : 'transparent',
              color: activeTab === 'generate' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'generate' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} /> Quiz Room
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab('history')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600, 
              background: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <History size={14} /> History ({history.length})
          </button>
        </div>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">{activeTab === 'history' ? 'History' : 'Quiz Room'}</h1>
        <div style={{ width: 32 }} />
      </div>

      {activeTab === 'generate' ? (
        <>
          {/* Generator Form (Only show when not in active quiz or after submitting) */}
          {(!activeQuiz || activeQuiz.isSubmitted) && (
            <QuizGeneratorForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}

          {generationError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ background: '#FEF2F2', borderColor: '#FECACA', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {generationError.includes('image') ? <ImageOff size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} /> : <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>
                    {generationError.includes('image') ? 'Image Content Detected' : 'Generation Failed'}
                  </h4>
                  <p style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>{generationError}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeQuiz && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Quiz Banner */}
              <div className="card" style={{
                background: activeQuiz.isSubmitted ? '#ECFDF5' : '#EFF6FF',
                borderColor: activeQuiz.isSubmitted ? '#10B981' : '#3B82F6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                padding: '16px 20px'
              }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1E3A8A' }}>
                    {activeQuiz.topic} Quiz
                  </h2>
                  <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 2, fontWeight: 500 }}>
                    Subject: {activeQuiz.subject} &middot; {activeQuiz.questions.length} Questions
                  </p>
                </div>

                {!activeQuiz.isSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: activeQuiz.timeRemainingSeconds < 30 ? '#EF4444' : '#1E3A8A', background: '#FFFFFF', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <Clock size={16} className={activeQuiz.timeRemainingSeconds < 30 ? 'animate-pulse' : ''} />
                      <span>{formatTime(activeQuiz.timeRemainingSeconds)}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSubmitQuiz} 
                      className="btn btn-dark btn-pill" 
                      style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700 }}
                    >
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#065F46', background: '#D1FAE5', padding: '6px 14px', borderRadius: 8 }}>
                      <Award size={18} />
                      <span>Score: {activeQuiz.score} / {activeQuiz.questions.length} ({Math.round((activeQuiz.score || 0) / activeQuiz.questions.length * 100)}%)</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                      Time Taken: {formatTime(activeQuiz.timeTakenSeconds || 0)}
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                                optionColor = '#9ca3af';
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

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          {q.answer && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Answer:</span>
                              <div 
                                onClick={() => toggleRevealAnswer(`active-${qIdx}`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  background: isRevealed ? '#D1FAE5' : '#F3F4F6',
                                  border: `1px solid ${isRevealed ? '#10B981' : '#E5E7EB'}`,
                                  borderRadius: 6,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: isRevealed ? '#065F46' : '#4b5563',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.2s ease',
                                }}
                                title={isRevealed ? '' : 'Click to reveal answer'}
                              >
                                <span style={{ filter: isRevealed ? 'none' : 'blur(4px)' }}>
                                  {q.answer}
                                </span>
                                {!isRevealed && (
                                  <Eye size={12} style={{ opacity: 0.6 }} />
                                )}
                              </div>
                              {!isRevealed && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  (Click to reveal)
                                </span>
                              )}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>{q.difficulty} &middot; {q.bloomLevel}</span>
                            <span>Confidence: {(q.ai_confidence_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="history-view" style={{ marginTop: 20 }}>
          <QuizHistory
            history={history}
            historyLoading={historyLoading}
            loadHistory={loadHistory}
            handleClearHistory={handleClearHistory}
            expandedHistoryId={expandedHistoryId}
            setExpandedHistoryId={setExpandedHistoryId}
            formatTime={formatTime}
            handleReattemptHistoryQuiz={handleReattemptHistoryQuiz}
            revealedAnswers={revealedAnswers}
            toggleRevealAnswer={toggleRevealAnswer}
          />
        </div>
      )}
      
      {/* Styles for option hover transitions */}
      <style jsx global>{`
        .generate-option-btn:hover {
          background: #F3F4F6 !important;
          border-color: #9CA3AF !important;
          transform: translateY(-1px);
        }
        .generate-option-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}