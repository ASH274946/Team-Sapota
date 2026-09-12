'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange?: (val: string) => void;
  required?: boolean;
}

export function DatePicker({ label, value, onChange, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use a stable reference for the initial date to avoid hydration mismatches, 
  // or handle client-side rendering explicitly.
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Update current month if value changes externally
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (date: Date) => {
    if (onChange) onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  
  // Generate days to fill the grid (including padding days from prev/next month)
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '9px 14px',
          background: 'white',
          border: isOpen ? '1px solid var(--border-focus)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-base)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(232, 83, 29, 0.1)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.15s, box-shadow 0.15s'
        }}
      >
        <span>{value ? format(new Date(value + 'T00:00:00'), 'MMMM d, yyyy') : 'Select date...'}</span>
        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 50,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '300px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button 
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {weekDays.map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map(day => {
              const isSelected = value ? isSameDay(day, new Date(value + 'T00:00:00')) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  style={{
                    padding: '8px 0',
                    background: isSelected ? '#F97316' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: isSelected ? 'white' : (isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                    fontWeight: isSelected || today ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {format(day, 'd')}
                  {today && !isSelected && (
                    <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#F97316' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
