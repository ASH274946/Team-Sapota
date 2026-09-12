'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function Input({ label, error, icon, className, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            {icon}
          </span>
        )}
        <input
          className={className}
          {...props}
          style={{
            width: '100%',
            padding: icon ? '9px 14px 9px 36px' : '9px 14px',
            background: 'white',
            border: `1px solid ${error ? 'var(--status-failed)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxSizing: 'border-box',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 83, 29, 0.1)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--status-failed)' : 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
        />
      </div>
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--status-failed)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
