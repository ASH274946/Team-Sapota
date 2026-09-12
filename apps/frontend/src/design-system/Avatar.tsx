'use client';

import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, { width: number; height: number; fontSize: number }> = {
  sm: { width: 28, height: 28, fontSize: 11 },
  md: { width: 36, height: 36, fontSize: 13 },
  lg: { width: 48, height: 48, fontSize: 16 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const dims = sizeMap[size];
  return (
    <div
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: '50%',
        background: imageUrl ? 'transparent' : 'linear-gradient(135deg, #E8531D, #F97316)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: dims.fontSize, fontWeight: 700, color: 'white', lineHeight: 1 }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
