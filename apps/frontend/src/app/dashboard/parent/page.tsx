'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { MetricCard } from '@/design-system/MetricCard';
import { CheckCircle2, AlertTriangle, Zap, Target, BookOpen, Clock, Send } from 'lucide-react';
import { Button } from '@/design-system/Button';

// Mock Data representing the 1:1 mapped student view
const MOCK_CHILD = {
  name: 'Alice Smith',
  grade: '10th Grade',
  school: 'Springfield High',
  metrics: {
    overallMastery: 84,
    attendanceRate: 96,
    learningStreak: 12,
    completedAssignments: 42
  },
  recentAlerts: [
    { id: '1', title: 'Low score in Advanced Mathematics Quiz', type: 'WARNING', date: 'Yesterday' },
    { id: '2', title: 'Perfect attendance for March!', type: 'SUCCESS', date: '3 days ago' }
  ],
  upcomingDeadlines: [
    { id: '1', title: 'Physics Lab Report', due: 'Tomorrow, 11:59 PM', subject: 'Physics' },
    { id: '2', title: 'History Essay Draft', due: 'Friday, 5:00 PM', subject: 'History' }
  ]
};

export default function ParentDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title={`Parent Portal`}
          subtitle={`Tracking academic progress for ${MOCK_CHILD.name} (${MOCK_CHILD.grade})`}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: 'var(--brand-light)', borderRadius: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand)' }}>Student Active Today</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Overall Mastery"
          value={`${MOCK_CHILD.metrics.overallMastery}%`}
        />
        <MetricCard
          icon={<Target size={18} />}
          label="Attendance Rate"
          value={`${MOCK_CHILD.metrics.attendanceRate}%`}
        />
        <MetricCard
          icon={<Zap size={18} color="#F59E0B" />}
          label="Learning Streak"
          value={`${MOCK_CHILD.metrics.learningStreak} Days`}
        />
        <MetricCard
          icon={<BookOpen size={18} />}
          label="Completed Work"
          value={MOCK_CHILD.metrics.completedAssignments}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Alerts & Feedback */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16 }}>Recent Alerts & Feedback</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_CHILD.recentAlerts.map(alert => (
              <div key={alert.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 8, background: alert.type === 'WARNING' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${alert.type === 'WARNING' ? '#FCA5A5' : '#86EFAC'}` }}>
                {alert.type === 'WARNING' ? <AlertTriangle size={20} color="#EF4444" /> : <CheckCircle2 size={20} color="#10B981" />}
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: alert.type === 'WARNING' ? '#991B1B' : '#065F46' }}>{alert.title}</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: alert.type === 'WARNING' ? '#DC2626' : '#059669' }}>{alert.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Upcoming Work</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_CHILD.upcomingDeadlines.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--brand-light)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</h4>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600 }}>{task.subject}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  <Clock size={14} /> {task.due}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Communication Hub */}
      <Card padding="24px">
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 16 }}>Teacher Communication</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-muted)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--brand)' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Mr. Anderson (Math)</h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Regarding recent quiz score...</p>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Ms. Davis (History)</h4>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Midterm project update</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
              <div style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderRadius: '12px 12px 12px 0', alignSelf: 'flex-start', maxWidth: '80%' }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Hello! I noticed Alice struggled with the advanced algebra quiz. Would you like to schedule a quick 5-min call to discuss some extra resources?</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Reply to Mr. Anderson..." style={{ flex: 1, padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 24, outline: 'none' }} />
              <Button variant="primary" style={{ borderRadius: 24, padding: '0 16px' }}><Send size={16} /></Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
