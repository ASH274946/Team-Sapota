'use client';

import React, { useRef, useEffect } from 'react';

export interface PromptInputProps {
  children: React.ReactNode;
  onSubmit?: (val: string) => void;
  className?: string;
}

export function PromptInput({
  children,
  onSubmit,
  className = '',
}: PromptInputProps) {
  return (
    <div
      className={`relative flex w-full flex-col rounded-2xl border border-neutral-200/90 bg-white shadow-xs focus-within:border-orange-500/80 focus-within:ring-3 focus-within:ring-orange-500/10 transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value?: string;
  onEnterSubmit?: () => void;
}

export function PromptInputTextarea({
  value,
  onChange,
  onKeyDown,
  onEnterSubmit,
  placeholder = 'Type your prompt here...',
  disabled = false,
  className = '',
  ...props
}: PromptInputTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow height based on content
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(e);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnterSubmit?.();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={2}
      className={`w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function PromptInputActions({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 pb-2.5 pt-1 border-t border-neutral-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function PromptInputActionGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center gap-1.5 ${className}`}>{children}</div>;
}

export function PromptInputAction({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return <>{children}</>;
}
