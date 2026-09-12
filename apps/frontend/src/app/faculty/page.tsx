'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Users, GraduationCap, Building2, BarChart2, CheckCircle, Clock } from 'lucide-react';

interface FacultyStats {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  averageAttendance: number;
  departmentPerformance: string;
  ongoingExams: number;
}

export default function FacultyDashboard() {
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/faculty/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        } else {
          setError('Failed to load statistics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingState lines={6} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); api.get('/faculty/dashboard/stats').then(res => res.data?.success ? setStats(res.data.data) : setError('Failed')).catch(e => setError(e.message)).finally(() => setLoading(false)); }} />;

  const data = stats || { totalTeachers: 0, totalStudents: 0, activeClasses: 0, averageAttendance: 0, departmentPerformance: 'N/A', ongoingExams: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Faculty Dashboard"
        subtitle="Department Monitoring & Overview."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <MetricCard icon={<Users size={18} />} label="Total Teachers" value={data.totalTeachers} />
        <MetricCard icon={<GraduationCap size={18} />} label="Total Students" value={data.totalStudents} />
        <MetricCard icon={<Building2 size={18} />} label="Active Classes" value={data.activeClasses} />
        <MetricCard icon={<BarChart2 size={18} />} label="Average Attendance" value={`${data.averageAttendance}%`} />
        <MetricCard icon={<CheckCircle size={18} />} label="Department Performance" value={data.departmentPerformance} />
        <MetricCard icon={<Clock size={18} />} label="Ongoing Exams" value={data.ongoingExams} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 20px)" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Users size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>Teacher Performance</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Performance metrics will be available at the end of the academic term.</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Building2 size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>Class Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No recent class analytics found. Reports generate after mid-terms.</p>
        </Card>
        
        <Card padding="clamp(16px, 2vw, 20px)" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Clock size={24} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 8 }}>Exam Overview</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>There are no upcoming exams scheduled for this week.</p>
        </Card>
      </div>
    </div>
  );
}
