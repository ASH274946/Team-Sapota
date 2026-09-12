'use client';

import React from 'react';
import Link from 'next/link';

interface ActionCardProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'warning' | 'admin-primary' | 'admin-warning';
  className?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
  primary: { background: 'var(--brand-light)', color: 'var(--brand-text)' },
  warning: { background: '#FEF3C7', color: '#92400E' },
  'admin-primary': { background: '#FFEDD5', color: 'var(--text-primary)' },
  'admin-warning': { background: '#FEF3C7', color: 'var(--text-primary)' },
};

const variantHover: Record<string, React.CSSProperties> = {
  default: { background: '#E5E7EB' },
  primary: { background: 'var(--brand-border)' },
  warning: { background: '#FDE68A' },
  'admin-primary': { background: '#FED7AA' },
  'admin-warning': { background: '#FDE68A' },
};

export function ActionCard({ icon, label, description, href, onClick, variant = 'default', className }: ActionCardProps) {
  const [hovered, setHovered] = React.useState(false);

  const content = (
    <div
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'background 0.15s ease',
        ...variantStyles[variant],
        ...(hovered ? variantHover[variant] : {}),
      }}
    >
      {icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.3 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return <div onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-label={label} style={{ cursor: 'pointer' }}>{content}</div>;
}
