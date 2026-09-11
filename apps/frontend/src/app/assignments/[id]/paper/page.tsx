'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Download, Loader2, Edit, Save, ArrowUp, ArrowDown, Sparkles, BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPaper } from '@/services/paper.service';
import { apiClient } from '@/services/api.client';
import { getSocket, subscribeToAssignment, unsubscribeFromAssignment } from '@/sockets/socket.client';
import { resolveAssetUrl } from '@/utils/url';
import type { GenerationPdfReadyPayload } from '@/types/socket.types';
import type { GeneratedPaper, Question, Section } from '@/types/paper.types';
import type { DifficultyLevel } from '@/types/assignment.types';
import { useAuthStore } from '@/store/auth.store';

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Challenging',
};

export default function PaperViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Regeneration panel states
  const [regenTarget, setRegenTarget] = useState<{ sIdx: number; qIdx: number } | null>(null);
  const [regenDiff, setRegenDiff] = useState<string>('medium');
  const [regenBloom, setRegenBloom] = useState<string>('APPLY');
  const [regenContext, setRegenContext] = useState<string>('');
  const [regeneratingQ, setRegeneratingQ] = useState(false);

  // Header metadata states (local edits before save)
  const [schoolName, setSchoolName] = useState('');
  const [paperTitle, setPaperTitle] = useState('');
  const [duration, setDuration] = useState(45);
  const [totalMarks, setTotalMarks] = useState(100);

  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId') || undefined;

  const loadPaper = async () => {
    try {
      const p = await fetchPaper(id, paperId);
      setPaper(p);
      if (p.canonicalMetadata) {
        setSchoolName(p.canonicalMetadata.schoolName || 'Delhi Public School');
        setPaperTitle(p.title || p.canonicalMetadata.subject || 'Assessment');
        setDuration(p.canonicalMetadata.durationMinutes || p.duration || 45);
        setTotalMarks(p.canonicalMetadata.generatedMarks || p.totalMarks || 100);
      } else {
        setSchoolName('Delhi Public School');
        setPaperTitle(p.title || 'Assessment');
        setDuration(p.duration || 45);
        setTotalMarks(p.totalMarks || 100);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load paper');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaper();
  }, [id]);

  useEffect(() => {
    subscribeToAssignment(id);
    return () => unsubscribeFromAssignment(id);
  }, [id]);

  useEffect(() => {
    const socket = getSocket();
    const onPdfReady = (payload: GenerationPdfReadyPayload) => {
      if (payload.assignmentId !== id) return;
      setPaper((prev) => (prev ? { ...prev, pdfUrl: payload.pdfUrl } : prev));
    };
    socket.on('generation:pdf_ready', onPdfReady);
    return () => {
      socket.off('generation:pdf_ready', onPdfReady);
    };
  }, [id]);

  // Handle reordering questions locally
  const moveQuestion = (sectionIdx: number, questionIdx: number, direction: 'up' | 'down') => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    const section = updatedSections[sectionIdx];
    if (!section) return;

    const targetIdx = direction === 'up' ? questionIdx - 1 : questionIdx + 1;
    if (targetIdx < 0 || targetIdx >= section.questions.length) return;

    // Swap questions
    const temp = section.questions[questionIdx];
    section.questions[questionIdx] = section.questions[targetIdx];
    section.questions[targetIdx] = temp;

    setPaper({ ...paper, sections: updatedSections });
  };

  // Handle local text edit of a question text
  const editQuestionText = (sectionIdx: number, questionIdx: number, text: string) => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    if (updatedSections[sectionIdx]?.questions[questionIdx]) {
      updatedSections[sectionIdx].questions[questionIdx].question = text;
      setPaper({ ...paper, sections: updatedSections });
    }
  };

  // Handle local text edit of a question marks
  const editQuestionMarks = (sectionIdx: number, questionIdx: number, marksVal: number) => {
    if (!paper) return;
    const updatedSections = JSON.parse(JSON.stringify(paper.sections)) as Section[];
    if (updatedSections[sectionIdx]?.questions[questionIdx]) {
      updatedSections[sectionIdx].questions[questionIdx].marks = marksVal;
      setPaper({ ...paper, sections: updatedSections });
    }
  };

  // Save all modified details (metadata + questions/order) to backend
  const handleSavePaper = async () => {
    if (!paper) return;
    setSaving(true);
    try {
      const updatedMeta = {
        ...paper.canonicalMetadata,
        schoolName,
        subject: paperTitle,
        durationMinutes: duration,
        generatedMarks: totalMarks,
      };

      await apiClient.put(`/papers/${paper.id}`, {
        title: paperTitle,
        totalMarks: totalMarks,
        sections: paper.sections,
        canonicalMetadata: updatedMeta,
      });

      toast.success('Paper saved successfully! Regerating PDF...');
      setIsEditMode(false);
      await loadPaper();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save paper');
    } finally {
      setSaving(false);
    }
  };

  // Call AI regeneration for a single target question
  const handleRegenerateQuestion = async () => {
    if (!paper || !regenTarget) return;
    setRegeneratingQ(true);
    try {
      const { sIdx, qIdx } = regenTarget;
      const res = await apiClient.post<{ 
        success: boolean; 
        data: { paper: GeneratedPaper; newQuestion: Question } 
      }>(`/papers/${paper.id}/regenerate-question`, {
        sectionIndex: sIdx,
        questionIndex: qIdx,
        difficulty: regenDiff,
        bloomLevel: regenBloom,
        context: regenContext,
      });

      toast.success('Question replaced successfully!');
      
      // Update local paper state with new sections/questions
      setPaper(res.data.data.paper);
      setRegenTarget(null);
      setRegenContext('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate question');
    } finally {
      setRegeneratingQ(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 1. Attempt authenticated download directly from backend
      try {
        const res = await apiClient.get(`/papers/${id}/pdf`, { responseType: 'blob' });
        if (res.data) {
          const blob = new Blob([res.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${(paper?.title || 'question_paper').replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('PDF downloaded successfully');
          return;
        }
      } catch (apiErr) {
        console.warn('API PDF stream failed, trying asset URL...', apiErr);
      }

      // 2. If paper has pdfUrl, try direct link
      if (paper?.pdfUrl) {
        const link = document.createElement('a');
        link.href = resolveAssetUrl(paper.pdfUrl);
        link.download = `${(paper.title || 'question_paper').replace(/\s+/g, '_')}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 3. Fallback to print
      window.print();
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 24, width: 180, borderRadius: 6, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="empty-state">
        <h2 className="empty-title">Failed to load question paper</h2>
        <p className="empty-desc">The question paper could not be retrieved.</p>
        <div className="empty-state-actions">
          <Link href={`/assignments/${id}`} className="btn btn-dark btn-pill">Back to Assignment</Link>
          <button onClick={() => window.location.reload()} className="btn btn-secondary btn-pill">Reload Page</button>
        </div>
      </div>
    );
  }

  // Calculate question numbers
  let globalQuestionNumber = 1;

  return (
    <div style={{ width: '100%', padding: 'var(--page-pad)', maxWidth: 'var(--page-max-w)', margin: '0 auto' }}>
      {/* Banner / Actions */}
      <div className="dark-banner-card print-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {isEditMode ? 'Regeneration Studio (Editing)' : 'Question Paper Preview'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEditMode ? (
            <>
              <button
                onClick={() => { setIsEditMode(false); loadPaper(); }}
                className="btn btn-secondary btn-pill"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePaper}
                disabled={saving}
                className="btn btn-pill"
                style={{ background: '#10B981', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              {!isStudent && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="btn btn-pill"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit size={15} />
                  Edit Paper
                </button>
              )}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-pill"
                style={{ background: '#FFFFFF', color: '#111827', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel & Preview split-layout or single layout */}
      <div style={{ display: 'grid', gridTemplateColumns: isEditMode ? '1fr 340px' : '1fr', gap: 20 }}>
        {/* Main Paper Layout */}
        <div className="paper-card" style={{ fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', color: '#1a1a1a', background: '#fff', borderRadius: 12, padding: 40, border: '1px solid #e5e7eb', boxShadow: 'var(--shadow-sm)' }}>
        {/* Header Banner with Introduction */}
          {paper.canonicalMetadata?.sections && (
            <div style={{
              background: '#2c2c2c',
              color: '#fff',
              padding: '20px 24px',
              borderRadius: 8,
              marginBottom: 32,
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              <p style={{ margin: 0 }}>This is a comprehensive assessment designed to evaluate your understanding of {paper.canonicalMetadata.subject}. Answer all questions unless stated otherwise. Please read each question carefully before responding.</p>
            </div>
          )}

          {/* School/Institution Header */}
          <div style={{ textAlign: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '3px solid #1a1a1a' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>{schoolName}</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 15, marginBottom: 16, maxWidth: 400, margin: '16px auto 0' }}>
              <div>
                <span style={{ fontWeight: 700 }}>Subject:</span> {paperTitle}
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>Class:</span> {paper.canonicalMetadata?.className || '—'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 15, marginTop: 16 }}>
              <div>
                <span style={{ fontWeight: 700 }}>Time Allowed:</span> {duration} minutes
              </div>
              <div>
                <span style={{ fontWeight: 700 }}>Maximum Marks:</span> {totalMarks}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ background: '#f5f5f5', padding: '16px 20px', borderRadius: 6, marginBottom: 28, fontSize: 14 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>All questions are compulsory unless stated otherwise.</p>
          </div>

          {/* Student Info Section (for printing) */}
          {!isEditMode && (
            <div style={{ marginBottom: 32, fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Name:</div>
                <div style={{ borderBottom: '1px solid #1a1a1a', minHeight: 24 }}></div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Roll Number:</div>
                <div style={{ borderBottom: '1px solid #1a1a1a', minHeight: 24 }}></div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Section:</div>
                <div style={{ borderBottom: '1px solid #1a1a1a', minHeight: 24 }}></div>
              </div>
            </div>
          )}

          {/* Sections list */}
          {!paper.sections || paper.sections.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              <p style={{ fontSize: 14, fontWeight: 500 }}>No questions have been generated yet.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Please generate the paper first.</p>
            </div>
          ) : (
            paper.sections.map((section, sIdx) => {
              const sectionNumberStart = globalQuestionNumber;
              globalQuestionNumber += section.questions.length;

              return (
                <div key={sIdx} style={{ marginBottom: 36 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 14 }}>
                    {section.title}
                  </h3>
                  {section.instruction && (
                    <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 12 }}>
                      {section.instruction}
                    </p>
                  )}

                  {/* Questions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {section.questions.map((q, qIdx) => {
                      const qNum = sectionNumberStart + qIdx;
                    return (
                      <div 
                        key={q.id || qIdx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 12, 
                          padding: isEditMode ? 10 : 0, 
                          borderRadius: 6,
                          background: isEditMode ? '#f9fafb' : 'transparent',
                          border: isEditMode ? '1px dashed #e5e7eb' : 'none',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20 }}>{qNum}.</span>
                        <div style={{ flex: 1 }}>
                          {isEditMode ? (
                            <textarea
                              className="input"
                              style={{ width: '100%', minHeight: 60, fontFamily: '"Times New Roman", Times, serif', fontSize: 15, padding: 8 }}
                              value={q.question}
                              onChange={(e) => editQuestionText(sIdx, qIdx, e.target.value)}
                            />
                          ) : (
                            <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{q.question}</div>
                          )}

                          {q.type === 'mcq' && q.options && q.options.length > 0 && (
                            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                              {q.options.map((opt) => (
                                <div key={opt.key} style={{ fontSize: 14 }}>
                                  <strong>{opt.key}.</strong> {opt.text}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Difficulty Badge */}
                          <div style={{ marginTop: 8 }}>
                            <span style={{
                              display: 'inline-block',
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: q.difficulty === 'easy' ? '#D1FAE5' : q.difficulty === 'medium' ? '#FEF3C7' : '#FED7AA',
                              color: q.difficulty === 'easy' ? '#065F46' : q.difficulty === 'medium' ? '#92400E' : '#92400E',
                            }}>
                              {DIFFICULTY_LABELS[q.difficulty]}
                            </span>
                          </div>
                        </div>

                        {/* Marks & Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 100 }}>
                          {isEditMode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                className="input"
                                style={{ width: 50, padding: '2px 4px', height: 26, fontSize: 12, textAlign: 'center' }}
                                value={q.marks}
                                onChange={(e) => editQuestionMarks(sIdx, qIdx, Number(e.target.value))}
                              />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>M</span>
                            </div>
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: 14 }}>[{q.marks} Marks]</span>
                          )}

                          {isEditMode && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: 4 }}
                                disabled={qIdx === 0}
                                onClick={() => moveQuestion(sIdx, qIdx, 'up')}
                                title="Move Up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: 4 }}
                                disabled={qIdx === section.questions.length - 1}
                                onClick={() => moveQuestion(sIdx, qIdx, 'down')}
                                title="Move Down"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', gap: 4, display: 'flex', alignItems: 'center', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5' }}
                                onClick={() => setRegenTarget({ sIdx, qIdx })}
                                title="AI Regenerate"
                              >
                                <Sparkles size={12} /> Swap
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Edit mode side panel (Regeneration Options) */}
        {isEditMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 16, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--brand)" /> AI Studio Panel
              </h3>
              {regenTarget ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, background: 'var(--brand-light)', color: 'var(--brand)', padding: 8, borderRadius: 6 }}>
                    Regenerating Section {regenTarget.sIdx + 1}, Question {regenTarget.qIdx + 1}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Select Difficulty</label>
                    <NativeSelect className="input" style={{ width: '100%' }} value={regenDiff} onChange={(e) => setRegenDiff(e.target.value)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Bloom Taxonomy level</label>
                    <NativeSelect className="input" style={{ width: '100%' }} value={regenBloom} onChange={(e) => setRegenBloom(e.target.value)}>
                      <option value="REMEMBER">Remember</option>
                      <option value="UNDERSTAND">Understand</option>
                      <option value="APPLY">Apply</option>
                      <option value="ANALYZE">Analyze</option>
                      <option value="EVALUATE">Evaluate</option>
                      <option value="CREATE">Create</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>AI Prompt Context (Optional)</label>
                    <textarea
                      placeholder="e.g. Focus on Newtonian physics, add a real-life example..."
                      className="input"
                      style={{ width: '100%', minHeight: 60, fontSize: 12 }}
                      value={regenContext}
                      onChange={(e) => setRegenContext(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => setRegenTarget(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-dark btn-sm" 
                      style={{ flex: 1, gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={handleRegenerateQuestion}
                      disabled={regeneratingQ}
                    >
                      {regeneratingQ ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      Swap now
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px' }}>
                  Click "Swap" on any question to load options and regenerate it using AI.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
