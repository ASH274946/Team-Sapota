'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { MetricCard } from '@/design-system/MetricCard';
import { Activity, ShieldAlert, Cpu, CheckCircle2, Clock } from 'lucide-react';

const AGENT_METRICS = [
  { name: 'Knowledge Agent', latency: '245ms', calls: '14,203', errors: '0.02%', status: 'Healthy' },
  { name: 'Assessment Agent', latency: '1,420ms', calls: '8,401', errors: '1.4%', status: 'Healthy' },
  { name: 'OBE Agent', latency: '890ms', calls: '2,100', errors: '0.1%', status: 'Healthy' },
  { name: 'Research Agent', latency: '3,200ms', calls: '450', errors: '5.2%', status: 'Degraded' },
];

export default function AgentObservabilityPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <PageHeader
        title="AI Swarm Observability"
        subtitle="Monitor agent health, execution latency, token usage, and safety thresholds."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<Activity size={18} />} label="Total Swarm Executions (24h)" value="25,154" trend="up" trendValue="+12%" />
        <MetricCard icon={<Cpu size={18} color="#8B5CF6" />} label="Total Tokens Processed" value="4.2M" />
        <MetricCard icon={<Clock size={18} color="#3B82F6" />} label="Avg. Swarm Latency" value="1.2s" />
        <MetricCard icon={<ShieldAlert size={18} color="#EF4444" />} label="Safety Interventions" value="14" trend="down" trendValue="-3" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Agent Telemetry */}
        <Card padding="24px">
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Agent Telemetry</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <span>Agent Identity</span>
              <span>Avg Latency</span>
              <span>24h Calls</span>
              <span>Error Rate</span>
              <span>Status</span>
            </div>
            {AGENT_METRICS.map((agent, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{agent.name}</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>{agent.latency}</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>{agent.calls}</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>{agent.errors}</span>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 12, fontSize: 'var(--text-xs)', fontWeight: 600,
                  background: agent.status === 'Healthy' ? '#D1FAE5' : '#FEF2F2',
                  color: agent.status === 'Healthy' ? '#059669' : '#DC2626'
                }}>
                  {agent.status === 'Healthy' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Safety & Cost Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Safety Interventions</h3>
            
            <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 600, marginBottom: 4 }}>
                <ShieldAlert size={16} /> Hallucination Block
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#7F1D1D' }}>
                Assessment Agent attempted to generate a question outside the Hybrid RAG syllabus context. Response blocked and retried.
              </p>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>Compute Spend</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--bg-muted)', borderRadius: 8, flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>GPT-4o (Reasoning)</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>$142.50</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-muted)', borderRadius: 8, flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>Text-Embed-3 (RAG)</div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>$12.20</div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
