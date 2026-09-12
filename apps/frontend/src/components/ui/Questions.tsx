'use client';

import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface QuestionOptionItem {
  value: string;
  label: string;
}

export interface QuestionInput {
  id: string;
  type: 'single' | 'multiple';
  prompt: string;
  options: QuestionOptionItem[];
  required?: boolean;
  hint?: string;
}

interface QuestionsContextType {
  items: QuestionInput[];
  answers: Record<string, string | string[]>;
  setAnswer: (id: string, value: string | string[]) => void;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onSubmit?: (submission: Record<string, string | string[]>) => void;
  onDismiss?: () => void;
}

const QuestionsContext = createContext<QuestionsContextType | null>(null);

export function useQuestions() {
  const ctx = useContext(QuestionsContext);
  if (!ctx) throw new Error('useQuestions must be used within <Questions />');
  return ctx;
}

export interface QuestionsProps {
  children: React.ReactNode;
  items: QuestionInput[];
  onSubmit?: (submission: Record<string, string | string[]>) => void;
  onDismiss?: () => void;
  className?: string;
}

export function Questions({
  children,
  items,
  onSubmit,
  onDismiss,
  className = '',
}: QuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const setAnswer = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <QuestionsContext.Provider
      value={{
        items,
        answers,
        setAnswer,
        currentIndex,
        setCurrentIndex,
        onSubmit,
        onDismiss,
      }}
    >
      <div
        className={`w-full rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs ${className}`}
      >
        {children}
      </div>
    </QuestionsContext.Provider>
  );
}

export function QuestionsHeader({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function QuestionsTitle({
  title,
  className = '',
}: {
  title?: string;
  className?: string;
}) {
  const { items, currentIndex } = useQuestions();
  const currentItem = items[currentIndex];

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#e05934] flex items-center justify-center text-xs font-bold">
        {currentIndex + 1}
      </div>
      <h3 className={`text-sm sm:text-base font-bold text-neutral-900 ${className}`}>
        {title || currentItem?.prompt || 'Questionnaire'}
      </h3>
    </div>
  );
}

export function QuestionsDismiss() {
  const { onDismiss } = useQuestions();
  if (!onDismiss) return null;

  return (
    <button
      type="button"
      onClick={onDismiss}
      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
      title="Dismiss"
    >
      <X className="w-4 h-4" />
    </button>
  );
}

export function Question({
  id,
  children,
  className = '',
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-2.5 ${className}`}>{children}</div>;
}

export function QuestionOptions({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-1 gap-2 ${className}`}>{children}</div>;
}

export function QuestionOption({
  value,
  children,
  className = '',
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { items, currentIndex, answers, setAnswer } = useQuestions();
  const currentItem = items[currentIndex];
  const isMultiple = currentItem?.type === 'multiple';
  const currentVal = answers[currentItem?.id || ''];

  const isSelected = isMultiple
    ? Array.isArray(currentVal) && currentVal.includes(value)
    : currentVal === value;

  const handleToggle = () => {
    if (!currentItem) return;
    if (isMultiple) {
      const arr = Array.isArray(currentVal) ? [...currentVal] : [];
      if (arr.includes(value)) {
        setAnswer(currentItem.id, arr.filter((v) => v !== value));
      } else {
        setAnswer(currentItem.id, [...arr, value]);
      }
    } else {
      setAnswer(currentItem.id, value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left cursor-pointer active:scale-99 ${
        isSelected
          ? 'bg-orange-50/80 border-[#e05934] text-neutral-900 font-semibold shadow-2xs'
          : 'bg-neutral-50/50 border-neutral-200/80 text-neutral-700 hover:bg-neutral-100/70'
      } ${className}`}
    >
      <span className="flex-1 pr-2">{children}</span>
      <div className="text-[#e05934] shrink-0">
        {isMultiple ? (
          isSelected ? (
            <CheckSquare className="w-4 h-4 fill-orange-500/10 text-[#e05934]" />
          ) : (
            <Square className="w-4 h-4 text-neutral-400" />
          )
        ) : isSelected ? (
          <CheckCircle2 className="w-4 h-4 text-[#e05934]" />
        ) : (
          <Circle className="w-4 h-4 text-neutral-400" />
        )}
      </div>
    </button>
  );
}

export function QuestionOther({
  placeholder = 'Other...',
  className = '',
}: {
  placeholder?: string;
  className?: string;
}) {
  const { items, currentIndex, answers, setAnswer } = useQuestions();
  const currentItem = items[currentIndex];
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [customText, setCustomText] = useState('');

  if (!currentItem) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => setIsCustomActive((prev) => !prev)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left cursor-pointer ${
          isCustomActive
            ? 'bg-orange-50/80 border-[#e05934] text-neutral-900 font-semibold shadow-2xs'
            : 'bg-neutral-50/50 border-neutral-200/80 text-neutral-700 hover:bg-neutral-100/70'
        }`}
      >
        <span>Custom answer</span>
        <Circle
          className={`w-4 h-4 ${isCustomActive ? 'text-[#e05934]' : 'text-neutral-400'}`}
        />
      </button>

      {isCustomActive && (
        <input
          type="text"
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value);
            setAnswer(currentItem.id, `other:${e.target.value}`);
          }}
          placeholder={placeholder}
          className="w-full px-3.5 py-2 text-xs sm:text-sm border border-orange-300 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 bg-white"
          autoFocus
        />
      )}
    </div>
  );
}

export function QuestionsCarousel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function QuestionsCarouselContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { currentIndex } = useQuestions();
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={`overflow-hidden relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {childrenArray[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function QuestionsCarouselItem({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function QuestionsCarouselPagination({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 text-xs text-neutral-500 ${className}`}>
      {children}
    </div>
  );
}

export function QuestionsCarouselPrev() {
  const { currentIndex, setCurrentIndex } = useQuestions();

  return (
    <button
      type="button"
      onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
      disabled={currentIndex === 0}
      className="p-1 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
      title="Previous Question"
    >
      <ChevronLeft className="w-3.5 h-3.5" />
    </button>
  );
}

export function QuestionsCarouselNext() {
  const { currentIndex, setCurrentIndex, items } = useQuestions();

  return (
    <button
      type="button"
      onClick={() => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))}
      disabled={currentIndex >= items.length - 1}
      className="p-1 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
      title="Next Question"
    >
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
}

export function QuestionsCarouselIndex({ format = 'of' }: { format?: 'of' | 'slash' }) {
  const { currentIndex, items } = useQuestions();
  return (
    <span className="font-mono text-[11px] font-semibold text-neutral-600">
      {currentIndex + 1} {format === 'of' ? 'of' : '/'} {items.length}
    </span>
  );
}

export function QuestionsFooter({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between pt-4 border-t border-neutral-100 mt-4 ${className}`}
    >
      {children || <QuestionsSubmit />}
    </div>
  );
}

export function QuestionsSubmit({
  label = 'Submit Answers',
  disableUntilLastQuestion = false,
}: {
  label?: string;
  disableUntilLastQuestion?: boolean;
}) {
  const { answers, items, currentIndex, onSubmit } = useQuestions();

  const isLast = currentIndex === items.length - 1;
  const isDisabled = disableUntilLastQuestion && !isLast;

  const handleSubmit = () => {
    onSubmit?.(answers);
    toast.success('Answers recorded successfully!');
  };

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isDisabled}
      className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:scale-102 active:scale-97 disabled:opacity-50 cursor-pointer"
    >
      <Send className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
