'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  flag?: string;
  disabled?: boolean;
}

export interface SelectDropdownProps {
  label?: string;
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  variant?: 'default' | 'pill' | 'ghost' | 'filled';
  sizeVariant?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  align?: 'left' | 'right';
  children?: React.ReactNode;
}

export const SelectDropdown = forwardRef<HTMLDivElement, SelectDropdownProps>(
  (
    {
      label,
      options: propOptions,
      value,
      onValueChange,
      onChange,
      placeholder = 'Select option...',
      className,
      containerClassName,
      disabled = false,
      align = 'right',
      children
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => containerRef.current!);

    // Extract options if standard <option> children were passed
    const options: SelectOption[] = React.useMemo(() => {
      if (propOptions && propOptions.length > 0) return propOptions;
      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const props = child.props as any;
          extracted.push({
            value: String(props.value ?? ''),
            label: String(props.children ?? props.value ?? ''),
            disabled: props.disabled
          });
        }
      });
      return extracted;
    }, [propOptions, children]);

    const selectedOption = options.find((opt) => opt.value === value) || options[0];

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
      if (disabled) return;
      if (!open && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 240px below, open upward!
        setOpenUpward(spaceBelow < 240);
      }
      setOpen((o) => !o);
    };

    const handleSelect = (optValue: string) => {
      onValueChange?.(optValue);
      onChange?.({ target: { value: optValue } });
      setOpen(false);
    };

    return (
      <div className={cn('relative inline-flex items-center gap-2', open ? 'z-[60]' : 'z-20', containerClassName)} ref={containerRef}>
        {label && (
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 select-none pl-1 shrink-0">
            {label}
          </span>
        )}

        {/* Trigger Button - Clean High Contrast Light Theme */}
        <button
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
            'bg-white border-neutral-200/90 text-neutral-800 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98]',
            'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {selectedOption?.flag && <span>{selectedOption.flag}</span>}
          <span className="truncate max-w-[220px] font-extrabold text-neutral-900">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 shrink-0', open && 'rotate-180')} />
        </button>

        {/* Floating Glassmorphism Dropdown Menu with Smart Auto-Flipping Placement */}
        {open && (
          <div
            className={cn(
              'absolute min-w-[200px] max-h-64 overflow-y-auto rounded-2xl p-1.5 z-[100]',
              'bg-white/95 backdrop-blur-xl text-neutral-900',
              'shadow-xl border border-neutral-200/90 ring-1 ring-black/5',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-400 italic text-center">No options available</div>
            ) : (
              options.map((opt) => {
                const isSelected = selectedOption && selectedOption.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left transition-colors cursor-pointer rounded-xl',
                      isSelected
                        ? 'font-extrabold text-orange-600 bg-orange-500/10'
                        : 'font-semibold text-neutral-700 hover:bg-neutral-100/80 hover:text-neutral-900',
                      opt.disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {opt.flag && <span>{opt.flag}</span>}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }
);

SelectDropdown.displayName = 'SelectDropdown';
