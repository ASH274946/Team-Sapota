'use client';

import React from 'react';

type BadgeVariant = 'pending' | 'success' | 'warning' | 'error' | 'info' | 'draft';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  pending: { background: '#FEF3C7', color: '#92400E' },
  success: { background: '#D1FAE5', color: '#065F46' },
  warning: { background: '#FED7AA', color: '#9A3412' },
  error: { background: '#FEE2E2', color: '#991B1B' },
  info: { background: '#DBEAFE', color: '#1E40AF' },
  draft: { background: '#F3F4F6', color: '#374151' },
};

export function Badge({ children, variant = 'draft', className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}
