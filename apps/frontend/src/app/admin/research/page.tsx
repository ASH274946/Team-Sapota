'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MetricCard } from '@/design-system/MetricCard';
import { BarChart3, Target, PieChart, ShieldAlert, Sparkles, LineChart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResearchAdminDashboard() {
  const triggerAutomatedIndexing = () => {
    toast.success('BullMQ worker queued for Digital Library Indexing...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Institutional Research Analytics"
          subtitle="Executive overview of publications, patents, funding, and library growth."
        />
        <div style={{ display: 'flex', gap: 12 }}>
           <Button variant="outline" onClick={triggerAutomatedIndexing}>Trigger Indexing</Button>
           <Button variant="primary">Export RNI Report</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard icon={<BarChart3 size={18} />} label="Total Publications (YTD)" value="142" trend="up" trendValue="+12%" />
        <MetricCard icon={<Target size={18} color="#10B981" />} label="Granted Patents" value="8" trend="up" trendValue="+2" />
        <MetricCard icon={<PieChart size={18} color="#8B5CF6" />} label="Active Datasets" value="54" />
        <MetricCard icon={<LineChart size={18} color="#F59E0B" />} label="Citation Impact" value="1.8k" trend="up" trendValue="+15%" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Analytics Breakdown */}
        <Card padding="24px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
             <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Department Productivity Comparison</h3>
             <NativeSelect style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid var(--border)' }}>
               <option>2026-2027</option>
               <option>2025-2026</option>
             </NativeSelect>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Computer Science & Engineering</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>86 Pubs, 3 Patents</span>
              </div>
              <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', background: '#3B82F6' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Mechanical Engineering</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>34 Pubs, 5 Patents</span>
              </div>
              <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: '#10B981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Biomedical Research</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>22 Pubs, 0 Patents</span>
              </div>
              <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: '#8B5CF6' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* AI Health & System Status */}
        <Card padding="24px">
           <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 16px 0' }}>AI & Plagiarism Integrity</h3>
           
           <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: 16 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 600, marginBottom: 4 }}>
               <ShieldAlert size={16} /> Similarity Engine Alert
             </div>
             <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: '#7F1D1D' }}>
               2 pending thesis proposals triggered high similarity scores (&gt;25%). Review required.
             </p>
           </div>

           <div style={{ padding: 16, background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: 8 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand)', fontWeight: 600, marginBottom: 4 }}>
               <Sparkles size={16} /> Digital Library RAG
             </div>
             <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
               All 1,420 research assets are vectorized and available for Hybrid Search.
             </p>
           </div>
        </Card>
      </div>
    </div>
  );
}
