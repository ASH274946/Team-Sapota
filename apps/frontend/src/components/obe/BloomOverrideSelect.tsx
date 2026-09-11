'use client';

import React from 'react';
import { BloomLevel } from './BloomClassificationBadge';
import { SelectDropdown } from '@/components/ui/select-dropdown';

const BLOOM_OPTIONS: BloomLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

interface BloomOverrideSelectProps {
  currentLevel: BloomLevel;
  predictedLevel?: BloomLevel;
  onChange: (newLevel: BloomLevel) => void;
  disabled?: boolean;
}

export function BloomOverrideSelect({
  currentLevel,
  predictedLevel,
  onChange,
  disabled = false,
}: BloomOverrideSelectProps) {
  const isOverridden = predictedLevel && currentLevel !== predictedLevel;

  return (
    <div className="flex items-center gap-1.5">
      <SelectDropdown
        value={currentLevel}
        onValueChange={(val) => onChange(val as BloomLevel)}
        disabled={disabled}
        options={BLOOM_OPTIONS.map((lvl) => ({
          value: lvl,
          label: `${lvl} ${predictedLevel === lvl ? '(AI Auto)' : ''}`
        }))}
        sizeVariant="sm"
        className={isOverridden ? 'bg-amber-50 border-amber-300 text-amber-900' : ''}
      />
      {isOverridden && predictedLevel && (
        <button
          type="button"
          onClick={() => onChange(predictedLevel)}
          className="text-[10px] text-slate-500 hover:text-indigo-600 underline font-medium cursor-pointer"
          title={`Reset to AI prediction (${predictedLevel})`}
        >
          Reset
        </button>
      )}
    </div>
  );
}
