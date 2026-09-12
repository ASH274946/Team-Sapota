'use client';

import React from 'react';
import { History, RefreshCw, Trash2, RotateCcw, ChevronDown, ChevronUp, Check, X, Eye } from 'lucide-react';
import type { HistoryQuiz } from '@/app/generate/page'; // Need to export these from page.tsx or move to types

interface QuizHistoryProps {
  history: HistoryQuiz[];
  historyLoading: boolean;
  loadHistory: () => Promise<void>;
  handleClearHistory: () => void;
  expandedHistoryId: string | null;
  setExpandedHistoryId: (id: string | null) => void;
  formatTime: (seconds: number) => string;
  handleReattemptHistoryQuiz: (quiz: HistoryQuiz) => void;
  revealedAnswers: Record<string, boolean>;
  toggleRevealAnswer: (key: string) => void;
}

export function QuizHistory({
  history,
  historyLoading,
  loadHistory,
  handleClearHistory,
  expandedHistoryId,
  setExpandedHistoryId,
  formatTime,
  handleReattemptHistoryQuiz,
  revealedAnswers,
  toggleRevealAnswer
}: QuizHistoryProps) {
  
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          History Sessions
          <button
            type="button"
            onClick={() => void loadHistory()}
            disabled={historyLoading}
            title="Refresh history from database"
            style={{ background: 'none', border: 'none', cursor: historyLoading ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={14} style={{ opacity: 0.5, animation: historyLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </h2>
        {history.length > 0 && (
          <button 
            type="button" 
            onClick={handleClearHistory} 
            style={{ 
              background: '#FEE2E2', 
              border: '1px solid #FECACA', 
              color: '#B91C1C', 
              padding: '6px 12px', 
              borderRadius: 8, 
              fontSize: 12, 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Trash2 size={14} /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <History size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No history yet</h3>
          <p style={{ fontSize: 14 }}>Generated quizzes will show up here as single test sessions, allowing you to review scores or re-attempt them.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map((hQuiz, idx) => {
            const isExpanded = expandedHistoryId === hQuiz.id;
            const percentScore = Math.round((hQuiz.score / hQuiz.questions.length) * 100);

            return (
              <div key={hQuiz.id || idx} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header Summary Row */}
                <div 
                  onClick={() => setExpandedHistoryId(isExpanded ? null : hQuiz.id)}
                  style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    background: '#F9FAFB',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
                        {hQuiz.subject}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>&middot;</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {hQuiz.topic}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(hQuiz.timestamp).toLocaleString()} &middot; {hQuiz.questions.length} Qs
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 800, 
                      color: percentScore >= 70 ? '#047857' : percentScore >= 40 ? '#B45309' : '#B91C1C',
                      background: percentScore >= 70 ? '#D1FAE5' : percentScore >= 40 ? '#FEF3C7' : '#FEE2E2',
                      padding: '4px 10px',
                      borderRadius: 8
                    }}>
                      Score: {hQuiz.score} / {hQuiz.questions.length} ({percentScore}%)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                      Duration: {formatTime(hQuiz.timeTakenSeconds)}
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReattemptHistoryQuiz(hQuiz);
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <RotateCcw size={12} /> Retry
                    </button>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expandable Review Details */}
                {isExpanded && (
                  <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20, background: '#FFFFFF' }}>
                    {hQuiz.questions.map((q: any, qIdx: number) => {
                      const userAttempt = hQuiz.attempts[qIdx];
                      const isCorrect = userAttempt === q.answer;
                      const isRevealed = revealedAnswers[`history-${hQuiz.id}-${qIdx}`];

                      return (
                        <div key={q.id || qIdx} style={{ paddingBottom: 16, borderBottom: qIdx < hQuiz.questions.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                              Question {qIdx + 1}
                            </span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 8,
                              background: isCorrect ? '#DCFCE7' : '#FEE2E2',
                              color: isCorrect ? '#15803D' : '#B91C1C'
                            }}>
                              {isCorrect ? <Check size={12} /> : <X size={12} />}
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 12, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                            {q.question_text}
                          </p>

                          {q.hint && (
                            <div style={{ marginBottom: 12 }}>
                              <button
                                type="button"
                                onClick={() => toggleRevealAnswer(`hint-history-${hQuiz.id}-${qIdx}`)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 8px',
                                  background: '#FEF3C7',
                                  border: '1px solid #FCD34D',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#D97706',
                                  cursor: 'pointer',
                                }}
                              >
                                💡 {revealedAnswers[`hint-history-${hQuiz.id}-${qIdx}`] ? 'Hide Hint' : 'Show Hint'}
                              </button>
                              {revealedAnswers[`hint-history-${hQuiz.id}-${qIdx}`] && (
                                <p style={{ marginTop: 6, fontSize: 12, color: '#B45309', background: '#FFFDF5', padding: 6, borderRadius: 4, borderLeft: '3px solid #F59E0B' }}>
                                  {q.hint}
                                </p>
                              )}
                            </div>
                          )}

                          {q.options && q.options.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 12 }}>
                              {q.options.map((opt: any, i: number) => {
                                const letter = getOptionLetter(opt, i);
                                const isThisSelected = userAttempt === letter;
                                const isThisCorrect = q.answer === letter;
                                
                                let optionBg = '#F9FAFB';
                                let optionBorder = 'var(--border)';
                                let optionColor = 'var(--text-primary)';
                                let icon = null;

                                if (isThisCorrect) {
                                  optionBg = '#DCFCE7';
                                  optionBorder = '#22C55E';
                                  optionColor = '#15803D';
                                  icon = <Check size={14} style={{ color: '#22C55E', flexShrink: 0 }} />;
                                } else if (isThisSelected) {
                                  optionBg = '#FEE2E2';
                                  optionBorder = '#EF4444';
                                  optionColor = '#B91C1C';
                                  icon = <X size={14} style={{ color: '#EF4444', flexShrink: 0 }} />;
                                }

                                return (
                                  <div 
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '8px 12px',
                                      background: optionBg,
                                      border: `1px solid ${optionBorder}`,
                                      borderRadius: 6,
                                      fontSize: 12,
                                      color: optionColor,
                                      fontWeight: isThisSelected || isThisCorrect ? 600 : 400
                                    }}
                                  >
                                    <span>{cleanOptionText(opt)}</span>
                                    {icon}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Answer:</span>
                            <div 
                              onClick={() => toggleRevealAnswer(`history-${hQuiz.id}-${qIdx}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                background: isRevealed ? '#D1FAE5' : '#F3F4F6',
                                border: `1px solid ${isRevealed ? '#10B981' : '#E5E7EB'}`,
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 700,
                                color: isRevealed ? '#065F46' : '#4b5563',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <span style={{ filter: isRevealed ? 'none' : 'blur(4px)' }}>
                                {q.answer}
                              </span>
                              {!isRevealed && (
                                <Eye size={10} style={{ opacity: 0.6 }} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
