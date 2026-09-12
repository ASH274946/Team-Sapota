'use client';

import React from 'react';

interface TextShimmerProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function TextShimmer({
  children,
  className = '',
  duration = 2,
  ...props
}: TextShimmerProps) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-neutral-400 via-neutral-900 to-neutral-400 bg-[length:250%_100%] bg-clip-text text-transparent font-medium ${className}`}
      style={{
        animation: `textShimmer ${duration}s ease-in-out infinite`,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
