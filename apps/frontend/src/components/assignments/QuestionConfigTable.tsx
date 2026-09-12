'use client';
import { NativeSelect } from '@/components/ui/native-select';


import React from 'react';
import { X, Plus, ChevronDown, Minus } from 'lucide-react';

export type QuestionTypeOption =
  | 'Multiple Choice Questions'
  | 'Short Questions'
  | 'Long Questions'
  | 'Diagram/Graph-Based Questions'
  | 'Numerical Problems'
  | 'True / False'
  | 'Fill in the Blank';

export const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True / False',
  'Fill in the Blank',
];

export interface QuestionRow {
  id: string;
  type: QuestionTypeOption;
  count: number;
  marks: number;
}

// ─── Counter component ──────────────────────────────────────
export function Counter({
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="counter">
      <button
        type="button"
        className="counter-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
        disabled={value <= min}
      >
        <Minus size={14} />
      </button>
      <span className="counter-val">{value}</span>
      <button
        type="button"
        className="counter-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase"
        disabled={value >= max}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// ─── Question type row ──────────────────────────────────────
export function QuestionTypeRow({
  row,
  onChange,
  onRemove,
  isOnly,
}: {
  row: QuestionRow;
  onChange: (row: QuestionRow) => void;
  onRemove: () => void;
  isOnly: boolean;
}) {
  return (
    <div className="question-row-container">
      {/* Desktop view */}
      <div className="desktop-question-row">
        <div className="question-select-wrap">
          <NativeSelect
            value={row.type}
            onChange={(e) => onChange({ ...row, type: e.target.value as QuestionTypeOption })}
            className="input question-select"
            aria-label="Question type"
          >
            {QUESTION_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </NativeSelect>
          <ChevronDown size={16} className="question-select-chevron" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={isOnly}
          className="question-remove-btn"
          aria-label="Remove question type"
        >
          <X size={14} />
        </button>

        <Counter
          value={row.count}
          onChange={(v) => onChange({ ...row, count: v })}
          min={1}
          max={50}
        />

        <Counter
          value={row.marks}
          onChange={(v) => onChange({ ...row, marks: v })}
          min={1}
          max={20}
        />
      </div>

      {/* Mobile view */}
      <div className="mobile-question-row">
        <div className="mobile-row-top">
          <div className="question-select-wrap">
            <NativeSelect
              value={row.type}
              onChange={(e) => onChange({ ...row, type: e.target.value as QuestionTypeOption })}
              className="input question-select"
              aria-label="Question type"
            >
              {QUESTION_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </NativeSelect>
            <ChevronDown size={16} className="question-select-chevron" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={isOnly}
            className="question-remove-btn"
            aria-label="Remove question type"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mobile-counters-container">
          <div className="mobile-counter-item">
            <span className="counter-label">No. of Questions</span>
            <Counter
              value={row.count}
              onChange={(v) => onChange({ ...row, count: v })}
              min={1}
              max={50}
            />
          </div>

          <div className="mobile-counter-item">
            <span className="counter-label">Marks</span>
            <Counter
              value={row.marks}
              onChange={(v) => onChange({ ...row, marks: v })}
              min={1}
              max={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
