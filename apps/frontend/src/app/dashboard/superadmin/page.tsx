'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { Building2, DollarSign, Activity, Zap, CheckCircle2, ShieldAlert, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const TENANTS = [
  { id: '1', name: 'Stanford University', tier: 'Enterprise', mrr: '$12,500', users: 14200, status: 'Active', health: 'Healthy' },
  { id: '2', name: 'MIT Engineering', tier: 'Professional', mrr: '$4,200', users: 3800, status: 'Active', health: 'Healthy' },
  { id: '3', name: 'Global Tech Bootcamp', tier: 'Starter', mrr: '$999', users: 450, status: 'Active', health: 'Degraded' },
  { id: '4', name: 'Demo High School', tier: 'Trial', mrr: '$0', users: 12, status: 'Expired', health: 'Stopped' },
];

export default function SuperAdminDashboard() {
  const handleProvisionTenant = () => {
    toast.success('Triggering multi-tenant automated onboarding pipeline...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="SaaS Control Plane"
          subtitle="Manage multi-campus organizations, subscriptions, billing, and platform compute limits."
        />
        <div style={{ display: 'flex', gap: 12 }}>
           <Button variant="outline"><Key size={16} style={{ marginRight: 8 }} /> Master API Keys</Button>
           <Button variant="primary" onClick={handleProvisionTenant}><Building2 size={16} style={{ marginRight: 8 }} /> Provision New Tenant</Button>
        </div>
      </div>

      {/* Global Business Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<DollarSign size={18} color="#10B981" />} label="Global MRR" value="$142,500" trend="up" trendValue="+15%" />
        <MetricCard icon={<Building2 size={18} />} label="Active Institutions" value="124" trend="up" trendValue="+4" />
        <MetricCard icon={<Activity size={18} color="#8B5CF6" />} label="Platform MAU" value="4.2M" />
        <MetricCard icon={<Zap size={18} color="#F59E0B" />} label="Total AI Inference Cost" value="$18,402" trend="up" trendValue="+5%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        
        {/* Tenant Management */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Institution Subscriptions</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <NativeSelect style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)' }}>
                <option>All Tiers</option>
                <option>Enterprise</option>
                <option>Professional</option>
              </NativeSelect>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Organization</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tier (Licensing)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Users</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>MRR</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Health</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {TENANTS.map(tenant => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{tenant.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 'var(--text-xs)', fontWeight: 600,
                        background: tenant.tier === 'Enterprise' ? '#EDE9FE' : tenant.tier === 'Trial' ? '#F3F4F6' : '#E0F2FE',
                        color: tenant.tier === 'Enterprise' ? '#7C3AED' : tenant.tier === 'Trial' ? '#4B5563' : '#0284C7'
                      }}>
                        {tenant.tier}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{tenant.users.toLocaleString()}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{tenant.mrr}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: tenant.health === 'Healthy' ? '#059669' : tenant.health === 'Degraded' ? '#D97706' : '#DC2626'
                      }}>
                        {tenant.health === 'Healthy' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />} {tenant.health}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Global System Health & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Infrastructure Scaling</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <span>DB Connection Pool</span>
                  <span>78%</span>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '78%', height: '100%', background: '#F59E0B' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <span>BullMQ Workers (Global)</span>
                  <span>45%</span>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '45%', height: '100%', background: '#10B981' }} />
                </div>
              </div>
            </div>
            <Button variant="outline" style={{ width: '100%', marginTop: 24 }}>Scale Up Shards</Button>
          </Card>
          
          <Card padding="24px" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--brand)' }}>Feature Flags</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Multi-Agent Orchestrator is currently enabled for Enterprise tenants only.
            </p>
            <Button variant="primary" style={{ width: '100%' }}>Modify Feature Gates</Button>
          </Card>
        </div>

      </div>
    </div>
  );
}
