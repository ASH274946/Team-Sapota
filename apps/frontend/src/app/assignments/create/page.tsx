'use client';
import { NativeSelect } from '@/components/ui/native-select';


import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Mic,
} from 'lucide-react';
import { createAssignment } from '@/services/assignment.service';
import { useAssignmentStore } from '@/store/assignment.store';
import { useGenerationStore } from '@/store/generation.store';
import type { QuestionType } from '@/types/assignment.types';
import { FileUploadZone } from '@/components/assignments/FileUploadZone';
import { QuestionTypeRow, QuestionRow } from '@/components/assignments/QuestionConfigTable';


interface FormData {
  title: string;
  subject: string;
  dueDate: string;
  additionalInfo: string;
}

function parseDurationFromText(input: string): number | null {
  const text = input.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs)\b/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    if (Number.isFinite(hours) && hours > 0) {
      return Math.min(600, Math.max(1, Math.round(hours * 60)));
    }
  }

  const minuteMatch = text.match(/(\d+)\s*(minute|minutes|min|mins)\b/);
  if (minuteMatch) {
    const mins = Number(minuteMatch[1]);
    if (Number.isFinite(mins) && mins > 0) {
      return Math.min(600, Math.max(1, Math.round(mins)));
    }
  }
  return null;
}

function extractGradeHint(input: string): string | null {
  const text = input.toLowerCase();
  const gradeMatch =
    text.match(/\b(?:class|grade|std|standard)\s*(\d{1,2})(?:st|nd|rd|th)?\b/) ||
    text.match(/\b(\d{1,2})(?:st|nd|rd|th)\s*(?:class|grade|standard)\b/);
  if (!gradeMatch) return null;
  const gradeNum = Number(gradeMatch[1]);
  if (!Number.isFinite(gradeNum) || gradeNum < 1 || gradeNum > 12) return null;
  return `Grade ${gradeNum}`;
}





function CustomDatePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleSelect = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  let displayValue = '';
  if (value) {
    const [y, m, d] = value.split('-');
    if (y && m && d) displayValue = `${d}-${m}-${y}`;
  }

  return (
    <div style={{ position: 'relative' }} ref={popupRef}>
      <div 
        className="input date-input"
        style={{ 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'white', border: '1px solid var(--border)', padding: '9px 14px', borderRadius: 'var(--radius-md)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {displayValue || 'DD-MM-YYYY'}
        </span>
        <Calendar size={18} color="var(--text-muted)" />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
          background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)', padding: 16, width: 280
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button 
              type="button"
              onClick={() => {
                const today = new Date();
                const nextPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                if (nextPrevMonth.getFullYear() < today.getFullYear() || (nextPrevMonth.getFullYear() === today.getFullYear() && nextPrevMonth.getMonth() < today.getMonth())) {
                  return;
                }
                setCurrentMonth(nextPrevMonth);
              }}
              style={{ 
                background: 'var(--bg-input)', border: 'none', padding: 4, borderRadius: 'var(--radius-sm)',
                cursor: (currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()) ? 'not-allowed' : 'pointer',
                opacity: (currentMonth.getFullYear() === new Date().getFullYear() && currentMonth.getMonth() === new Date().getMonth()) ? 0.5 : 1
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button 
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ background: 'var(--bg-input)', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 'var(--radius-sm)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {days.map((d, i) => {
              if (d === null) return <div key={i} />;
              
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const isToday = todayStr === dateStr;
              const isPast = dateStr < todayStr;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => !isPast && handleSelect(d)}
                  style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? '#E8531D' : 'transparent',
                    color: isSelected ? '#000000' : (isPast ? 'var(--text-muted)' : 'var(--text-primary)'),
                    borderRadius: 6, border: 'none', cursor: isPast ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400,
                    margin: 'auto',
                    opacity: isPast ? 0.4 : 1
                  }}
                  onMouseOver={(e) => { if (!isSelected && !isPast) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseOut={(e) => { if (!isSelected && !isPast) e.currentTarget.style.background = 'transparent' }}
                >
                  {d}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button 
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              style={{ background: '#FFF0E8', border: 'none', color: '#E8531D', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: 100 }}
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                setIsOpen(false);
              }}
              style={{ background: '#FFF0E8', border: 'none', color: '#E8531D', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: 100 }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Main page ─────────────────────────────────────────────
const TOTAL_STEPS = 2;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addAssignment } = useAssignmentStore();
  const { setQueued } = useGenerationStore();

  // Basic form data
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subject: '',
    dueDate: '',
    additionalInfo: '',
  });

  // Question rows
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', count: 5, marks: 5 },
  ]);

  const totalQuestions = questionRows.reduce((s, r) => s + r.count, 0);
  const totalMarks = questionRows.reduce((s, r) => s + r.count * r.marks, 0);

  const addRow = () => {
    setQuestionRows((prev) => [
      ...prev,
      { id: String(Date.now()), type: 'Multiple Choice Questions', count: 4, marks: 1 },
    ]);
  };

  const updateRow = (id: string, updated: QuestionRow) => {
    setQuestionRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const removeRow = (id: string) => {
    setQuestionRows((prev) => prev.filter((r) => r.id !== id));
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  const typeMapping: Record<string, string> = {
    'Multiple Choice Questions': 'mcq',
    'Short Questions': 'short-answer',
    'Long Questions': 'long-answer',
    'Diagram/Graph-Based Questions': 'long-answer',
    'Numerical Problems': 'short-answer',
    'True / False': 'true-false',
    'Fill in the Blank': 'fill-blank',
  };

  const handleSubmit = async () => {
    if (!formData.dueDate) {
      toast.error('Please set a due date');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Please select a subject');
      return;
    }
    if (totalQuestions < 1) {
      toast.error('Add at least one question');
      return;
    }
    if (totalMarks < 1) {
      toast.error('Total marks must be at least 1');
      return;
    }

    setIsSubmitting(true);
    try {
      const uniqueTypes = [...new Set(questionRows.map((r) => typeMapping[r.type] || r.type))] as QuestionType[];
      const typeBreakdown = questionRows.map((r) => ({
        type: typeMapping[r.type] || r.type,
        displayType: r.type,
        count: r.count,
        marksPerQuestion: r.marks,
      }));
      const inferredDuration = parseDurationFromText(formData.additionalInfo);
      const gradeHint = extractGradeHint(formData.additionalInfo);
      const durationMinutes = inferredDuration ?? 60;
      const enrichedInstructions = [
        formData.additionalInfo?.trim(),
        gradeHint ? `Target learner level: ${gradeHint}.` : '',
        `Exam duration: ${durationMinutes} minutes.`,
      ]
        .filter(Boolean)
        .join('\n')
        .slice(0, 2000);

      const title = formData.title.trim();
      const subject = formData.subject.trim();

      const payload = {
        title,
        subject,
        description: (formData.additionalInfo || '').slice(0, 2000),
        dueDate: formData.dueDate,
        duration: durationMinutes,
        totalMarks,
        questionConfig: {
          types: uniqueTypes,
          count: totalQuestions,
          difficulty: { easy: 34, medium: 33, hard: 33 },
        },
        additionalInstructions: enrichedInstructions,
        typeBreakdown: JSON.stringify(typeBreakdown),
      };

      const created = await createAssignment(payload, files);
      const { assignment } = created;
      addAssignment(assignment);
      if (created.jobRecordId && typeof created.generationSeq === 'number') {
        setQueued(created.jobRecordId, created.generationSeq, 0, Date.now());
      }
      toast.success('Assignment created! Generation started…', { duration: 4000 });
      router.push(`/assignments/${assignment.id}`);
    } catch (e: unknown) {
      setIsSubmitting(false);
      let errorMsg = 'Failed to create assignment';
      if (e instanceof Error) {
        errorMsg = e.message;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/95 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-label="Creating assignment"
          >
            <Loader2 size={40} className="animate-spin text-orange-500" aria-hidden="true" />
            <p style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              Creating assignment…
            </p>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              You will be redirected to generation when ready.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page heading (responsive structures defined in globals.css) */}
      <div className="page-header-container" style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
        {/* Desktop-only Page Header */}
        <div className="desktop-page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div className="status-dot" aria-hidden="true" />
            <h1 className="page-title">Create Assignment</h1>
          </div>
          <p className="page-subtitle">Set up a new assignment for your students.</p>
        </div>

        {/* Mobile-only Page Header */}
        <div className="mobile-page-header">
          <button 
            onClick={() => window.history.back()}
            className="mobile-header-back-btn"
            aria-label="Go back"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#374151',
              flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="mobile-header-title">Create Assignment</h1>
          <div style={{ width: '32px' }} /> {/* Spacer to center the title */}
        </div>
      </div>

      {/* Segmented Progress bar (placed under headers, above card container) */}
      <div className="step-progress" role="progressbar" aria-valuenow={step} aria-valuemax={TOTAL_STEPS} style={{ marginBottom: 32 }}>
        <div className="step-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Form Card Layout */}
      <div className="create-form-layout">

        {/* ── Center: Form ── */}
        <div className="create-form-main">

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  Assignment Details
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Basic information about your assignment
                </p>

                {/* File upload */}
                <FileUploadZone
                  files={files}
                  onAdd={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
                  onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  onRename={(i, newName) => setFiles((prev) => {
                    const newFiles = [...prev];
                    const file = newFiles[i];
                    newFiles[i] = new File([file], newName, { type: file.type });
                    return newFiles;
                  })}
                />



                {/* Question Type section */}
                <div style={{ marginBottom: 20 }}>
                  {/* Header row labels (desktop only) */}
                  <div className="question-headers">
                    <div className="header-type">Question Type</div>
                    <div style={{ width: 32 }} />
                    <div className="header-count">No. of Questions</div>
                    <div className="header-marks">Marks</div>
                  </div>

                  {questionRows.map((row) => (
                    <QuestionTypeRow
                      key={row.id}
                      row={row}
                      onChange={(updated) => updateRow(row.id, updated)}
                      onRemove={() => removeRow(row.id)}
                      isOnly={questionRows.length === 1}
                    />
                  ))}

                  {/* Add row */}
                  <button
                    type="button"
                    onClick={addRow}
                    className="add-question-type-btn"
                    aria-label="Add question type"
                  >
                    <Plus size={15} />
                    <span>Add Question</span>
                  </button>

                  {/* Totals */}
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 3,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>Total Questions : <strong>{totalQuestions}</strong></span>
                    <span>Total Marks : <strong>{totalMarks}</strong></span>
                  </div>
                </div>

                {/* Additional info */}
                <div className="input-group">
                  <label className="label" htmlFor="additionalInfo">
                    Additional Information <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(For better output)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      id="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData((d) => ({ ...d, additionalInfo: e.target.value }))}
                      rows={3}
                      placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                      className="input"
                      style={{ resize: 'none', paddingRight: 36 }}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Voice input"
                    >
                      <Mic size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Assignment Info
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Give your assignment a title and subject
                </p>

                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label className="label" htmlFor="title">Assignment Title</label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
                    placeholder="e.g. Mid-term Physics Exam"
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="label" htmlFor="subject">Subject</label>
                  <NativeSelect
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((d) => ({ ...d, subject: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select a subject…</option>
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'History', 'Geography', 'Economics'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </NativeSelect>
                </div>

                {/* Due Date */}
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label className="label" htmlFor="dueDate">Due Date</label>
                  <CustomDatePicker
                    value={formData.dueDate}
                    onChange={(val) => setFormData((d) => ({ ...d, dueDate: val }))}
                  />
                </div>

                {/* Review summary inline (step 2 only) */}
                <div
                  style={{
                    marginTop: 24,
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Questions</span><strong style={{ color: 'var(--text-primary)' }}>{totalQuestions}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Marks</span><strong style={{ color: 'var(--text-primary)' }}>{totalMarks}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Files Uploaded</span><strong style={{ color: 'var(--text-primary)' }}>{files.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Due Date</span><strong style={{ color: 'var(--text-primary)' }}>{formData.dueDate || '—'}</strong>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Action Footer (Outside the card, responsive aligned) */}
        <div className="create-form-footer">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn btn-secondary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ChevronLeft size={15} />
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn btn-dark btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="btn btn-primary btn-pill"
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Generate
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </>
  );
}

