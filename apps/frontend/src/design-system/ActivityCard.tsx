'use client';

import React from 'react';
import { Card } from './Card';
import { formatDateTime } from '@/utils/format';

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type?: string;
  icon?: React.ReactNode;
}

interface ActivityCardProps {
  title: string;
  items: ActivityItem[];
  emptyMessage?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function ActivityCard({ title, items, emptyMessage = 'No recent activity', viewAllHref, viewAllLabel = 'View All', className }: ActivityCardProps) {
  return (
    <Card className={className} padding="clamp(16px, 2vw, 20px)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </h3>
          {viewAllHref && (
            <a href={viewAllHref} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
              {viewAllLabel}
            </a>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {item.icon && (
                  <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 'var(--radius-md)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    {item.icon}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.description}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {formatDateTime(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
