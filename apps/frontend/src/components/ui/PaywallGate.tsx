'use client';

import { ReactNode } from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/design-system/Button';
import { useRouter } from 'next/navigation';

interface PaywallGateProps {
  featureKey: 'multiAgent' | 'digitalLibrary' | 'accreditationReports' | 'whiteLabel';
  requiredTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  children: ReactNode;
}

/**
 * PaywallGate
 * Wraps premium UI components. If the active organization does not have the required feature entitlement,
 * it intercepts the render and displays a commercial upgrade banner instead of a broken UI state.
 */
export function PaywallGate({ featureKey, requiredTier, children }: PaywallGateProps) {
  const router = useRouter();

  // In production, this reads from an Entitlement Context hydrated by FeatureEntitlementService.
  // We mock the check for Phase 25 scaffolding.
  const isAuthorized = false; // Mocking failure to demonstrate the paywall UX

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div style={{ 
      position: 'relative', 
      padding: '48px 24px', 
      background: 'linear-gradient(135deg, var(--bg-muted) 0%, var(--surface) 100%)', 
      border: '1px dashed var(--border)', 
      borderRadius: 12, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      gap: 16
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 24, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
        <Lock size={24} />
      </div>
      
      <div>
        <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Available in {requiredTier}
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
          This feature is locked behind our premium SaaS tier. Upgrade your institution's subscription to instantly unlock advanced AI capabilities.
        </p>
      </div>

      <div style={{ marginTop: 8 }}>
        <Button variant="primary" onClick={() => router.push('/admin/billing')}>
          <ArrowUpRight size={16} style={{ marginRight: 8 }} /> View Upgrade Options
        </Button>
      </div>
    </div>
  );
}
