'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { FileText, CheckCircle2, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  status: string;
  submittedAt: string;
  evaluations: any[];
}

export default function SubmissionsListPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/grader/assignments/${assignmentId}/submissions`);
      if (res.data?.success) {
        setSubmissions(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) fetchSubmissions();
  }, [assignmentId]);

  const handleBulkGrade = async () => {
    toast.success('Initiating Bulk AI Grading...');
    try {
      const res = await api.post(`/grader/assignments/${assignmentId}/bulk-evaluate`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Assignments graded successfully!');
        fetchSubmissions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk grading failed');
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading submissions...</div>;
  }

  const pendingCount = submissions.filter(s => s.status !== 'GRADED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Student Submissions"
          subtitle={`Manage and grade student work.`}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          {pendingCount > 0 && (
            <Button variant="outline" onClick={handleBulkGrade}>
              <Sparkles size={16} style={{ marginRight: 8, color: 'var(--brand)' }} />
              Bulk AI Grade ({pendingCount})
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/assignments')}>Back to Assignments</Button>
        </div>
      </div>

      <Card padding="0">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
              <th style={{ padding: '16px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Student Name</th>
              <th style={{ padding: '16px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '16px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>Submitted At</th>
              <th style={{ padding: '16px 24px' }}></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => {
              const latestEval = sub.evaluations?.[0];
              const scoreDisplay = latestEval ? `${latestEval.score} / ${latestEval.totalMarks}` : '-';

              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                        {sub.studentName.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.studentName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {sub.status === 'GRADED' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#D1FAE5', color: '#065F46' }}>
                        <CheckCircle2 size={12} /> Graded
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>
                        <AlertCircle size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {scoreDisplay}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/assessments/${assignmentId}/submissions/${sub.id}`)}>
                      View Details <ChevronRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  </td>
                </tr>
              );
            })}
            
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <p>No submissions found for this assignment.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
