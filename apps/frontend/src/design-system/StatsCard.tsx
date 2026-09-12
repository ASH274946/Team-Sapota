'use client';

import React from 'react';

type Trend = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: Trend;
  trendValue?: string;
}

const trendColors: Record<Trend, string> = {
  up: '#10B981',
  down: '#EF4444',
  neutral: '#6B7280',
};

const trendIcons: Record<Trend, React.ReactNode> = {
  up: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  down: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  neutral: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

export function StatsCard({ icon, label, value, trend, trendValue }: StatsCardProps) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(14px, 1.8vw, 18px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>}
        {trend && trendValue && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 'var(--text-xs)', fontWeight: 600, color: trendColors[trend] }}>
            {trendIcons[trend]}
            {trendValue}
          </span>
        )}
      </div>
      <span style={{ fontSize: 'clamp(20px, 2vw, 24px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}
