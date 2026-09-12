'use client';

import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { CreditCard, Zap, Users, Download, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingDashboard() {
  const handleUpgrade = () => {
    toast.success('Redirecting to Payment Gateway (Stripe/Paddle)...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Billing & Entitlements"
          subtitle="Manage your SaaS subscription, AI compute quotas, and seat licenses."
        />
        <Button variant="primary" onClick={handleUpgrade}><ArrowUpRight size={16} style={{ marginRight: 8 }} /> Upgrade Plan</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Active Plan & Seat Limits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card padding="24px" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: 1 }}>Current Plan</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>Starter Tier</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>$299 / month • Renews on July 14, 2026</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'white', borderRadius: 20, fontSize: 'var(--text-sm)', fontWeight: 600, color: '#059669', boxShadow: 'var(--shadow-sm)' }}>
                <CheckCircle2 size={16} /> Active
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="var(--brand)" /> Seat Licensing
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                <span>Active Users (Teachers & Admins)</span>
                <span>45 / 50 Seats</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '90%', height: '100%', background: '#F59E0B' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
                <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}><ShieldAlert size={12} /> Near seat limit</span>
                <span style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}>Buy more seats</span>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="#8B5CF6" /> AI Compute Credits (Metered)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                <span>Tokens Consumed (RAG & Generation)</span>
                <span>1.2M / 2.0M Credits</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: '#8B5CF6' }} />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Your plan includes 2M AI Credits per month. Overage is billed at $0.02 per 1k credits.
              </p>
            </div>
          </Card>
        </div>

        {/* Payment History & Methods */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <Card padding="24px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={20} color="var(--text-secondary)" /> Payment Method
              </h3>
              <Button variant="outline" size="sm">Update</Button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ width: 48, height: 32, background: '#1A1F36', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>
                VISA
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Expires 12/28</div>
              </div>
            </div>
          </Card>

          <Card padding="24px">
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 20px 0' }}>Invoice History</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { date: 'Jun 14, 2026', amount: '$299.00', status: 'Paid' },
                { date: 'May 14, 2026', amount: '$299.00', status: 'Paid' },
                { date: 'Apr 14, 2026', amount: '$314.50', status: 'Paid (Overage)' }
              ].map((inv, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i !== 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{inv.date}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{inv.status}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{inv.amount}</span>
                    <Button variant="outline" size="sm"><Download size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
        </div>

      </div>
    </div>
  );
}
