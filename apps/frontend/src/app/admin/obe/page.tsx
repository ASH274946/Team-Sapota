'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { Building2, AlertTriangle, CheckCircle, Clock, BarChart3, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentOBE { departmentId: string; departmentName: string; totalCOs: number; mappedCOs: number; blueprints: number; approvedBlueprints: number }
interface PendingBlueprint { id: string; title: string; totalMarks: number; course?: { id: string; code: string; name: string }; _count?: { items: number } }

export default function AdminOBEPage() {
  const [departments, setDepartments] = useState<DepartmentOBE[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<PendingBlueprint[]>([]);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [coursesRes, pendingRes] = await Promise.all([
        api.get('/obe/courses', { signal }).catch(() => ({ data: { data: [] } })),
        api.get('/obe/blueprints/pending', { signal }).catch(() => ({ data: { data: [] } })),
      ]);

      const courses = coursesRes.data.data || [];
      setPendingApprovals(pendingRes.data.data || []);

      const deptMap = new Map<string, DepartmentOBE>();
      for (const course of courses) {
        const deptId = course.departmentId || 'unassigned';
        const deptName = course.departmentId ? `Department ${course.departmentId.slice(0, 8)}` : 'Unassigned';
        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, { departmentId: deptId, departmentName: deptName, totalCOs: 0, mappedCOs: 0, blueprints: 0, approvedBlueprints: 0 });
        }
        const dept = deptMap.get(deptId)!;
        dept.totalCOs += course._count?.outcomes ?? 0;
        dept.blueprints += course._count?.blueprints ?? 0;
      }

      setDepartments(Array.from(deptMap.values()));
    } catch {
      toast.error('Failed to load OBE data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleApprove = async (blueprintId: string) => {
    try {
      await api.post(`/obe/blueprints/${blueprintId}/approve`, { comments: 'Approved by admin' });
      toast.success('Blueprint approved');
      fetchData();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (blueprintId: string) => {
    setRejectTarget(blueprintId);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) { toast.error('Reason required'); return; }
    try {
      await api.post(`/obe/blueprints/${rejectTarget}/reject`, { reason: rejectReason });
      toast.success('Blueprint rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchData();
    } catch { toast.error('Failed to reject'); }
  };

  const totalCOs = departments.reduce((s, d) => s + d.totalCOs, 0);
  const totalBlueprints = departments.reduce((s, d) => s + d.blueprints, 0);

  return (
    <div style={{ padding: '0 0 48px' }}>
      <PageHeader
        title="OBE Administration"
        subtitle="Department-level overview and approval workflows"
      />

      {loading ? (
        <Card style={{ padding: 48, textAlign: 'center' }}><p style={{ color: '#94a3b8' }}>Loading...</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetricCard label="Departments" value={departments.length} icon={<Building2 size={20} />} />
            <MetricCard label="Total COs" value={totalCOs} icon={<BarChart3 size={20} />} />
            <MetricCard label="Blueprints" value={totalBlueprints} icon={<Settings size={20} />} />
            <MetricCard label="Pending Approvals" value={pendingApprovals.length} icon={<Clock size={20} />} badgeText={pendingApprovals.length > 0 ? 'Action needed' : undefined} badgeVariant={pendingApprovals.length > 0 ? 'warning' : 'success'} />
          </div>

          {pendingApprovals.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pending Approvals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingApprovals.map((bp) => (
                  <Card key={bp.id} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600 }}>{bp.title}</h4>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>{bp.course?.name ?? 'Unknown Course'} — {bp.totalMarks} marks — {bp._count?.items ?? 0} items</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button onClick={() => handleApprove(bp.id)} style={{ background: '#22c55e', color: '#fff', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Approve
                      </Button>
                      <Button onClick={() => handleReject(bp.id)} style={{ background: '#ef4444', color: '#fff', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={14} /> Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Department Overview</h3>
            {departments.length === 0 ? (
              <Card style={{ padding: 48, textAlign: 'center' }}>
                <Building2 size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <p style={{ color: '#94a3b8' }}>No departments with OBE data yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {departments.map((dept) => (
                  <Card key={dept.departmentId} style={{ padding: 20 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{dept.departmentName}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>Course Outcomes</span>
                        <span style={{ fontWeight: 600 }}>{dept.totalCOs}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>Blueprints</span>
                        <span style={{ fontWeight: 600 }}>{dept.blueprints}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>Approved</span>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{dept.approvedBlueprints}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setRejectTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400 }} onClick={(e) => e.stopPropagation()}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Rejection Reason</h4>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this blueprint being rejected?"
              style={{ width: '100%', padding: 8, border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, minHeight: 80, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <Button onClick={() => setRejectTarget(null)} style={{ background: '#f1f5f9', color: '#475569' }}>Cancel</Button>
              <Button onClick={submitReject} style={{ background: '#ef4444', color: '#fff' }}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
