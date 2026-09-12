'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { Users, FileText, CheckCircle2, AlertTriangle, Search, BookOpen, Clock } from 'lucide-react';

const THESIS_STUDENTS = [
  { id: '1', name: 'Alice Smith', topic: 'Optimization of LLM Inference', status: 'Pending Review', similarity: 12 },
  { id: '2', name: 'Bob Jones', topic: 'Hybrid RAG for Medical Data', status: 'Approved', similarity: 4 },
  { id: '3', name: 'Charlie Brown', topic: 'Quantum Machine Learning', status: 'Drafting', similarity: null },
];

export default function SupervisorDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Research Supervisor Workspace"
          subtitle="Manage student thesis pipelines, research groups, and similarity reports."
        />
        <Button variant="primary">Create Research Group</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<Users size={18} />} label="Active Students" value="6" />
        <MetricCard icon={<FileText size={18} />} label="Pending Reviews" value="2" />
        <MetricCard icon={<CheckCircle2 size={18} color="#10B981" />} label="Approved Proposals" value="4" />
        <MetricCard icon={<AlertTriangle size={18} color="#F59E0B" />} label="Upcoming Defenses" value="1" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Thesis Tracking */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Thesis & Dissertation Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {THESIS_STUDENTS.map(student => (
              <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-muted)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-base)', fontWeight: 600 }}>{student.name}</h4>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Topic: {student.topic}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {student.similarity !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', fontWeight: 600, color: student.similarity > 15 ? '#EF4444' : '#10B981' }}>
                      <Search size={14} /> Sim: {student.similarity}%
                    </div>
                  )}
                  <div style={{ 
                    padding: '4px 12px', borderRadius: 16, fontSize: 'var(--text-xs)', fontWeight: 600,
                    background: student.status === 'Approved' ? '#D1FAE5' : student.status === 'Pending Review' ? '#FEF3C7' : '#F3F4F6',
                    color: student.status === 'Approved' ? '#059669' : student.status === 'Pending Review' ? '#D97706' : '#4B5563'
                  }}>
                    {student.status}
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Research Groups & Collaboration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Research Groups</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: 8 }}>
                <BookOpen size={20} color="var(--brand)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand)' }}>AI in Education Lab</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)' }}>3 Ongoing Projects &middot; 5 Members</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <BookOpen size={20} color="var(--text-secondary)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600 }}>Quantum Systems Group</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>1 Ongoing Project &middot; 2 Members</span>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Recent Mentions</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <Clock size={16} /> Alice Smith requested review on Methodology draft.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
