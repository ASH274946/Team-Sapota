'use client';
import { NativeSelect } from '@/components/ui/native-select';
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  className?: string;
}

export function Select({ label, error, options, className, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <NativeSelect
          className={className}
          {...props}
          style={style}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--status-failed)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
