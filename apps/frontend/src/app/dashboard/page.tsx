'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Plus,
  UserPlus,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/design-system/PageHeader';
import { MetricCard } from '@/design-system/MetricCard';
import { ActionCard } from '@/design-system/ActionCard';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useAuthStore } from '@/store/auth.store';

interface DashboardData {
  totalFaculty: number;
  totalStudents: number;
  totalClasses: number;
  assessmentsByStatus: Record<string, number>;
  totalAssessments: number;
  totalLessons: number;
  totalSubmissions: number;
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
    entity?: string;
    user?: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeOrganizationId = useAdminAuthStore((s) => s.activeOrganizationId);
  const user = useAuthStore((s) => s.user);
  
  // Check if user is an admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api.get('/admin/analytics/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError('Failed to load analytics');
        }
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeOrganizationId, isAdmin]);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  // Non-admin users see a different dashboard
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to your dashboard."
        />
        <Card padding="clamp(16px, 2vw, 20px)">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            You don't have access to the admin analytics dashboard. Please contact your administrator if you need to view organizational statistics.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionCard
              icon={<BookOpen size={16} />}
              label="View My Lessons"
              href="/lessons"
            />
            <ActionCard
              icon={<Users size={16} />}
              label="My Classes"
              href="/classes"
            />
            <ActionCard
              icon={<CheckCircle size={16} />}
              label="View Assignments"
              href="/assignments"
            />
          </div>
        </Card>
      </div>
    );
  }

  const stats = { 
    totalFaculty: data?.totalFaculty || 0, 
    totalStudents: data?.totalStudents || 0, 
    totalClasses: data?.totalClasses || 0, 
    pendingApprovals: data?.assessmentsByStatus?.['PENDING'] || 0 
  };
  const activity = data?.recentActivity || [];
  const summary = { 
    publishedAssessments: data?.totalAssessments || 0, 
    activeLessons: data?.totalLessons || 0, 
    submissionRate: data?.totalSubmissions ? Math.min(100, Math.round((data.totalSubmissions / (data.totalStudents || 1)) * 100)) : 0 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', paddingBottom: 60 }}>
      <PageHeader
        title="Organization Admin Dashboard"
        subtitle="Monitor your institution at a glance and manage key educational assets."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <MetricCard
          icon={<GraduationCap size={20} color="var(--text-muted)" />}
          label="Total Faculty"
          value={stats.totalFaculty}
          badgeText="+1 this month"
          badgeVariant="brand"
        />
        <MetricCard
          icon={<Users size={20} color="var(--text-muted)" />}
          label="Total Students"
          value={stats.totalStudents}
          badgeText="Stabilized"
          badgeVariant="neutral"
        />
        <MetricCard
          icon={<BookOpen size={20} color="var(--text-muted)" />}
          label="Total Classes"
          value={stats.totalClasses}
          badgeText="Active"
          badgeVariant="brand"
        />
        <MetricCard
          icon={<Clock size={20} color="var(--text-muted)" />}
          label="Pending Approvals"
          value={stats.pendingApprovals}
          badgeText="All clear"
          badgeVariant="neutral"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      }}>
        <Card padding="clamp(16px, 2vw, 24px)" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Activity
            </h3>
            <a href="/admin/audit" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              View All
            </a>
          </div>
          
          <div style={{ position: 'relative', flex: 1, paddingLeft: 8, overflowY: 'auto', maxHeight: 200, paddingRight: 8 }}>
            <div style={{ position: 'absolute', top: 12, bottom: 12, left: 13, width: 2, background: 'var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
              {activity.map((item, i) => {
                const dotColors = ['#111827', '#E8531D', '#9CA3AF', '#D1D5DB'];
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: dotColors[i % dotColors.length], zIndex: 1, flexShrink: 0, marginTop: 4, marginLeft: -1 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                        {item.user ? (
                          <><strong>{item.user.firstName || item.user.lastName || item.user.email || 'User'}</strong> performed </>
                        ) : null}
                        {item.action} {item.entity ? `on ${item.entity}` : ''}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Invalid Date'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activity.length === 0 && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No recent activity</p>
              )}
            </div>
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 24px)" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionCard
              icon={<UserPlus size={18} />}
              label="Create Faculty"
              href="/admin/users"
              variant="admin-primary"
            />
            <ActionCard
              icon={<Users size={18} />}
              label="Manage Users"
              href="/admin/users"
              variant="admin-primary"
            />
            <ActionCard
              icon={<Plus size={18} />}
              label="Create Class"
              href="/admin/classes"
            />
            <ActionCard
              icon={<CheckCircle size={18} />}
              label="View Approvals"
              href="/admin/approvals"
              variant="admin-warning"
            />
          </div>
        </Card>

        <Card padding="clamp(16px, 2vw, 24px)" style={{ display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>
            Stats Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Published Assessments', value: summary.publishedAssessments, color: '#111827' },
              { label: 'Active Lessons', value: summary.activeLessons, color: '#92400E' },
              { label: 'Submission Rate', value: `${summary.submissionRate}%`, color: '#10B981', valueColor: '#10B981' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: item.valueColor || 'var(--text-primary)', fontSize: 'var(--text-base)' }}>{item.value}</span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: item.color,
                    borderRadius: 'var(--radius-pill)',
                    width: `${typeof item.value === 'number' ? Math.min(item.value * 10, 100) : summary.submissionRate}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: 'auto', 
            background: '#F9FAFB', 
            padding: 16, 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            gap: 10, 
            alignItems: 'flex-start' 
          }}>
            <TrendingUp size={18} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insights</strong>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Submission rate is currently stable but needs improvement in Science modules.
              </span>
            </div>
          </div>
        </Card>
      </div>

      <button style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        background: '#111827',
        color: 'white',
        padding: '12px 24px',
        borderRadius: 'var(--radius-pill)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        boxShadow: 'var(--shadow-lg)',
        border: 'none',
        cursor: 'pointer',
        zIndex: 50,
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      >
        <span style={{ color: 'var(--brand)' }}>✨</span> Launch AI Assistant
      </button>
    </div>
  );
}
