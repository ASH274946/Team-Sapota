'use client';

import React from 'react';

export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export const BLOOM_COLORS: Record<BloomLevel, { bg: string; text: string; border: string }> = {
  REMEMBER: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  UNDERSTAND: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  APPLY: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  ANALYZE: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  EVALUATE: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CREATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

interface BloomClassificationBadgeProps {
  level: BloomLevel;
  confidence?: number; // 0.0 - 1.0
  isOverride?: boolean;
  explanation?: string;
  size?: 'sm' | 'md';
}

export function BloomClassificationBadge({
  level,
  confidence,
  isOverride = false,
  explanation,
  size = 'md',
}: BloomClassificationBadgeProps) {
  const styles = BLOOM_COLORS[level] || BLOOM_COLORS.UNDERSTAND;
  const confidencePercent = confidence !== undefined ? Math.round(confidence * 100) : null;

  let confidenceColor = 'text-slate-400';
  if (confidencePercent !== null) {
    if (confidencePercent >= 80) confidenceColor = 'text-emerald-600 font-bold';
    else if (confidencePercent >= 60) confidenceColor = 'text-amber-600 font-semibold';
    else confidenceColor = 'text-rose-600 font-semibold';
  }

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 border rounded-full ${styles.bg} ${styles.border} ${
        isSmall ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs font-medium'
      }`}
      title={explanation || `Bloom Taxonomy Level: ${level}`}
    >
      <span className={`font-bold uppercase tracking-wider ${styles.text}`}>
        {level}
      </span>
      {confidencePercent !== null && (
        <span className={`text-[10px] ${confidenceColor}`}>
          {confidencePercent}%
        </span>
      )}
      {isOverride && (
        <span
          className="ml-0.5 px-1 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase"
          title="Faculty manual override applied"
        >
          Override
        </span>
      )}
    </div>
  );
}
