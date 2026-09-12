'use client';

import React from 'react';

interface LoadingStateProps {
  lines?: number;
}

export function LoadingState({ lines = 4 }: LoadingStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 ? 24 : 16,
            width: i === 0 ? '60%' : ['100%', '85%', '70%', '90%'][i % 4],
            background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.5s infinite',
            borderRadius: 8,
          }}
        />
      ))}
    </div>
  );
}
