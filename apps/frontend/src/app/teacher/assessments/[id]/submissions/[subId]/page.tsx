'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { ChevronLeft, Bot, User, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubmissionEvaluationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  const subId = params.subId as string;

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/grader/submissions/${subId}/evaluate`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        toast.error('Evaluation not found');
      }
    } catch (err) {
      toast.error('Failed to load evaluation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subId) fetchEvaluation();
  }, [subId]);

  const handleManualOverride = async () => {
    if (!overrideScore) return toast.error('Score is required');
    try {
      setSubmittingOverride(true);
      const res = await api.post(`/grader/submissions/${subId}/override`, {
        overrideScore: Number(overrideScore),
        reason: overrideReason
      });
      if (res.data?.success) {
        toast.success('Grade overridden successfully');
        setOverrideMode(false);
        fetchEvaluation();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to override grade');
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setLoading(true);
      toast.success('Running AI Evaluation...');
      const res = await api.post(`/grader/submissions/${subId}/evaluate`);
      if (res.data?.success) {
        toast.success('Evaluation completed!');
        fetchEvaluation();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to evaluate');
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading evaluation details...</div>;
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No AI Evaluation Yet</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>This submission has not been graded by the AI yet.</p>
        <Button variant="primary" onClick={handleRunEvaluation}>
          <Bot size={16} style={{ marginRight: 8 }} /> Run AI Evaluation
        </Button>
      </div>
    );
  }

  const { submission, score, totalMarks, generalFeedback, criteriaGrades, teacherOverride, studentText, rubricCriteria } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push(`/teacher/assessments/${assignmentId}/submissions`)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Submission Evaluation</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Review AI feedback and student work.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: teacherOverride ? '#FEF3C7' : '#D1FAE5', padding: '8px 16px', borderRadius: 8, border: `1px solid ${teacherOverride ? '#F59E0B' : '#10B981'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: teacherOverride ? '#92400E' : '#065F46' }}>Final Score:</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: teacherOverride ? '#B45309' : '#047857' }}>{score} / {totalMarks}</span>
            {teacherOverride && <span style={{ fontSize: 12, background: '#F59E0B', color: 'white', padding: '2px 6px', borderRadius: 12, marginLeft: 8 }}>Overridden</span>}
          </div>
          {!overrideMode && (
            <Button variant="outline" onClick={() => setOverrideMode(true)}>
              <Edit3 size={16} style={{ marginRight: 8 }} /> Manual Override
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left Side: Student Work */}
        <Card padding="0" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--text-secondary)" />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Student Submission Text</span>
          </div>
          <div style={{ padding: 24, overflowY: 'auto', flex: 1, fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {studentText || <span style={{ color: 'var(--text-muted)' }}>No text could be extracted from this submission.</span>}
          </div>
        </Card>

        {/* Right Side: AI Evaluation */}
        <Card padding="0" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#F0F9FF', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={18} color="#0284C7" />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0369A1' }}>AI Grading Breakdown</span>
          </div>
          
          <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {overrideMode && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: 16, borderRadius: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 12 }}>Manual Grade Override</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#B45309', marginBottom: 4 }}>New Score</label>
                    <input 
                      type="number" 
                      value={overrideScore} 
                      onChange={e => setOverrideScore(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #FCD34D', borderRadius: 6 }} 
                      max={totalMarks}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#B45309', marginBottom: 4 }}>Reason for Override</label>
                    <input 
                      type="text" 
                      value={overrideReason} 
                      onChange={e => setOverrideReason(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #FCD34D', borderRadius: 6 }} 
                      placeholder="e.g. AI missed a valid alternate method"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button variant="outline" size="sm" onClick={() => setOverrideMode(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleManualOverride} disabled={submittingOverride}>Save Override</Button>
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>General Feedback</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, padding: 16, background: 'var(--bg-muted)', borderRadius: 8 }}>
                {generalFeedback || 'No general feedback provided.'}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Rubric Criteria Analysis</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {criteriaGrades?.map((cg: any, idx: number) => {
                  const criterion = rubricCriteria?.find((rc: any) => rc.id === cg.criterionId) || { name: `Criterion ${idx+1}`, maxMarks: '?' };
                  const isPerfect = cg.score === criterion.maxMarks;
                  
                  return (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{criterion.name}</span>
                        <div style={{ background: isPerfect ? '#D1FAE5' : '#F3F4F6', color: isPerfect ? '#065F46' : 'var(--text-primary)', padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                          {cg.score} / {criterion.maxMarks}
                        </div>
                      </div>
                      <div style={{ padding: '16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>AI Explanation:</strong> {cg.explanation || cg.reason || 'No explanation provided.'}
                      </div>
                    </div>
                  );
                })}
                {(!criteriaGrades || criteriaGrades.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No specific criteria breakdown available.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
