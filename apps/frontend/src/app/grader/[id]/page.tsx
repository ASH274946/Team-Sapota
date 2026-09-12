'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Check, AlertCircle, Award, MessageSquare, Edit, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface CriteriaGrade {
  criteriaId: string;
  name: string;
  score: number;
  explanation: string;
}

interface Evaluation {
  id: string;
  score: number;
  totalMarks: number;
  generalFeedback: string;
  criteriaGrades: CriteriaGrade[];
  isOverridden?: boolean;
  overrideReason?: string;
  teacherFeedback?: string;
  submission: {
    id: string;
    fileUrl: string;
    fileType: string;
  };
  studentText?: string;
  rubricCriteria?: { id: string; name: string; maxMarks: number }[];
}

export default function GradeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [studentText, setStudentText] = useState('');
  
  // Edited values
  const [manualGrades, setManualGrades] = useState<Record<string, number>>({});
  const [overrideReason, setOverrideReason] = useState('');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const evalRes = await apiClient.get<{ success: boolean; data: any }>(`/grader/submissions/${submissionId}/evaluate`);
      const data = evalRes.data.data;
      setEvaluation(data);

      // Initialize manual grades
      const initialGrades: Record<string, number> = {};
      data.criteriaGrades.forEach((c: CriteriaGrade) => {
        initialGrades[c.criteriaId] = c.score;
      });
      setManualGrades(initialGrades);
      setOverrideReason(data.overrideReason || '');
      setTeacherFeedback(data.teacherFeedback || '');

      // Bind actual student submission text
      setStudentText(data.studentText || 'No text extracted from submission.');
    } catch {
      toast.error('Failed to load evaluation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [submissionId]);

  const calculateTotalScore = () => {
    return Object.values(manualGrades).reduce((sum, current) => sum + current, 0);
  };

  const handleSaveOverride = async () => {
    setSaving(true);
    const finalScore = calculateTotalScore();

    const updatedCriteria = evaluation?.criteriaGrades.map(cg => ({
      ...cg,
      score: manualGrades[cg.criteriaId] ?? cg.score
    })) || [];

    try {
      await apiClient.patch(`/grader/submissions/${submissionId}/override`, {
        overrideScore: finalScore,
        reason: overrideReason || 'Manual teacher review and score adjustment.',
        teacherFeedback: teacherFeedback || overrideReason || 'Grade reviewed and confirmed by teacher.',
        criteriaGrades: updatedCriteria,
      });
      toast.success('Grades finalized and override saved');
      router.push('/grader');
    } catch {
      // Fallback to POST if endpoint differs
      try {
        await apiClient.post(`/grader/submissions/${submissionId}/override`, {
          overrideScore: finalScore,
          reason: overrideReason || 'Manual teacher review and score adjustment.',
          teacherFeedback: teacherFeedback || overrideReason || 'Grade reviewed and confirmed by teacher.',
          criteriaGrades: updatedCriteria,
        });
        toast.success('Grades finalized and override saved');
        router.push('/grader');
      } catch {
        toast.error('Failed to save grade override');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand)" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="dashboard-view" style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={40} color="var(--brand)" />
        <h2 style={{ marginTop: 12 }}>Evaluation Not Found</h2>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => router.push('/grader')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isOverridden = evaluation.isOverridden || Object.keys(manualGrades).some(k => {
    const orig = evaluation.criteriaGrades.find(c => c.criteriaId === k);
    return orig && orig.score !== manualGrades[k];
  });

  return (
    <div className="dashboard-view" style={{ padding: '20px var(--page-pad)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <button onClick={() => router.push('/grader')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, padding: 0 }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="page-title" style={{ marginTop: 12 }}>Review & Override Evaluation</h1>
        </div>
        {isOverridden && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF3C7', color: '#92400E', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid #FDE68A' }}>
            <ShieldCheck size={16} /> Overridden by Teacher
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: 'calc(100vh - 200px)', minHeight: 500 }}>
        {/* Left: Original Submission */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 24, overflowY: 'auto' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            Student Submission Document
          </h3>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, color: '#374151', lineHeight: 1.6, flex: 1 }}>
            {studentText}
          </div>
        </div>

        {/* Right: AI Rubric Grading Panel & Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Rubric Evaluation & Override</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={18} color="var(--brand)" />
              <span style={{ fontSize: 18, fontWeight: 800 }}>{calculateTotalScore()} / {evaluation.totalMarks}</span>
            </div>
          </div>

          {/* Criteria details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, marginBottom: 20 }}>
            {evaluation.criteriaGrades.map((cg) => (
              <div key={cg.criteriaId} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{cg.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      className="input"
                      style={{ width: 60, height: 32, padding: '0 6px', textAlign: 'center', fontWeight: 700 }}
                      value={manualGrades[cg.criteriaId] ?? cg.score}
                      onChange={(e) => setManualGrades({ ...manualGrades, [cg.criteriaId]: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      / {evaluation.rubricCriteria?.find(c => c.id === cg.criteriaId)?.maxMarks ?? 10}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>AI Analysis:</strong> {cg.explanation}
                </p>
              </div>
            ))}

            {/* General Feedback */}
            <div style={{ marginTop: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} /> AI General Feedback
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                {evaluation.generalFeedback}
              </p>
            </div>

            {/* Personalised Teacher Feedback */}
            <div style={{ marginTop: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={14} color="var(--brand)" /> Personalised Teacher Feedback (Visible to Student)
              </h4>
              <textarea
                className="input"
                rows={2}
                placeholder="Enter feedback for the student..."
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
              />
            </div>

            {/* Override notes */}
            <div style={{ marginTop: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Edit size={14} /> Override Reason & Audit Notes
              </h4>
              <textarea
                className="input"
                rows={2}
                placeholder="Reason for score adjustment (recorded in audit log)..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveOverride} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, fontWeight: 600 }}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save Grade Override
          </button>
        </div>
      </div>
    </div>
  );
}

