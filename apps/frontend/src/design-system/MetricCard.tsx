'use client';

import React from 'react';

type Trend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: Trend;
  trendValue?: string;
  description?: string;
  className?: string;
  badgeText?: string;
  badgeVariant?: 'brand' | 'neutral' | 'success' | 'warning';
}

const trendColors: Record<Trend, string> = {
  up: '#10B981',
  down: '#EF4444',
  neutral: '#6B7280',
};

const badgeStyles: Record<string, React.CSSProperties> = {
  brand: { background: 'var(--brand-light)', color: 'var(--brand-text)' },
  neutral: { background: 'var(--bg-hover)', color: 'var(--text-secondary)' },
  success: { background: '#D1FAE5', color: '#065F46' },
  warning: { background: '#FEF3C7', color: '#92400E' },
};

export function MetricCard({ icon, label, value, trend, trendValue, description, className, badgeText, badgeVariant = 'neutral' }: MetricCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(14px, 1.8vw, 18px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minHeight: 120,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {icon ? (
          <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
            {icon}
          </span>
        ) : (
          trend && trendValue && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 'var(--text-xs)', fontWeight: 600, color: trendColors[trend] }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {trend === 'up' && <polyline points="18 15 12 9 6 15" />}
                {trend === 'down' && <polyline points="6 9 12 15 18 9" />}
                {trend === 'neutral' && <line x1="5" y1="12" x2="19" y2="12" />}
              </svg>
              {trendValue}
            </span>
          )
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 'auto' }}>
        <span style={{ fontSize: 'clamp(32px, 3vw, 40px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value}
        </span>
        {badgeText && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            ...badgeStyles[badgeVariant]
          }}>
            {badgeText}
          </span>
        )}
      </div>
      {description && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {description}
        </span>
      )}
    </div>
  );
}
