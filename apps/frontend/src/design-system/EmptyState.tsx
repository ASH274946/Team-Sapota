'use client';

import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}

export function EmptyState({ icon, title, description, action, actionLabel }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(32px, 5vw, 48px) clamp(16px, 3vw, 24px)',
        width: '100%',
        minHeight: 'min(420px, 55vh)',
      }}
    >
      {icon && (
        <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)', color: 'var(--text-muted)' }}>
          {icon}
        </div>
      )}
      {title && (
        <h3 style={{ fontSize: 'clamp(17px, 1.5vw, 20px)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {title}
        </h3>
      )}
      {description && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: 460, lineHeight: 1.6, margin: '0 0 28px' }}>
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button variant="primary" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
