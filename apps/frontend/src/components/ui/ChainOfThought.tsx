'use client';

import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Sparkles,
  Clock,
  Cpu,
} from 'lucide-react';

interface ChainOfThoughtContextType {
  isExpanded: boolean;
  setIsExpanded: (val: boolean | ((prev: boolean) => boolean)) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextType>({
  isExpanded: true,
  setIsExpanded: () => {},
});

export interface ChainOfThoughtProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  autoCloseOnAllComplete?: boolean;
}

export function ChainOfThought({
  children,
  defaultExpanded = true,
  className = '',
}: ChainOfThoughtProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <ChainOfThoughtContext.Provider value={{ isExpanded, setIsExpanded }}>
      <div
        className={`w-full rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden transition-all duration-300 ${className}`}
      >
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
}

export interface ChainOfThoughtTriggerProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  isGenerating?: boolean;
  stats?: {
    elapsedTime?: string;
    tokensPerSec?: number;
    stage?: string;
  };
}

export function ChainOfThoughtTrigger({
  children,
  icon,
  isGenerating = false,
  stats,
}: ChainOfThoughtTriggerProps) {
  const { isExpanded, setIsExpanded } = useContext(ChainOfThoughtContext);

  return (
    <button
      type="button"
      onClick={() => setIsExpanded((prev) => !prev)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50/80 hover:bg-neutral-100/80 border-b border-neutral-200/60 transition-colors text-left group cursor-pointer select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-[#e05934] flex items-center justify-center shrink-0 border border-orange-500/20">
          {icon || (isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
              {children}
            </span>
            {isGenerating && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Live Reasoning
              </span>
            )}
          </div>
          {stats && (
            <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
              {stats.stage && <span>{stats.stage}</span>}
              {stats.elapsedTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {stats.elapsedTime}
                </span>
              )}
              {stats.tokensPerSec && (
                <span className="flex items-center gap-1 font-mono">
                  <Cpu className="w-3 h-3 text-neutral-400" />
                  {stats.tokensPerSec} t/s
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-neutral-400 group-hover:text-neutral-700 transition-transform">
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>
    </button>
  );
}

export function ChainOfThoughtContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useContext(ChainOfThoughtContext);

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-4 space-y-3.5 divide-y divide-neutral-100">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ChainOfThoughtStepProps {
  children: React.ReactNode;
  status?: StepStatus;
  hasContent?: boolean;
  className?: string;
  autoCloseOnComplete?: boolean;
}

export function ChainOfThoughtStep({
  children,
  status = 'completed',
  className = '',
}: ChainOfThoughtStepProps) {
  return (
    <div className={`pt-3 first:pt-0 space-y-2 ${className}`}>
      {children}
    </div>
  );
}

export interface ChainOfThoughtStepTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  status?: StepStatus;
  metrics?: string | React.ReactNode;
}

export function ChainOfThoughtStepTitle({
  children,
  icon,
  status = 'completed',
  metrics,
}: ChainOfThoughtStepTitleProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
        <span className="shrink-0 text-neutral-500">
          {status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 text-orange-500 animate-spin" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            icon || <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </span>
        <span className="truncate">{children}</span>
      </div>

      {metrics && (
        <div className="text-[11px] font-mono text-neutral-500 shrink-0">
          {metrics}
        </div>
      )}
    </div>
  );
}

export function ChainOfThoughtStepContent({ children }: { children: React.ReactNode }) {
  return <div className="pl-5.5 text-xs text-neutral-600">{children}</div>;
}

export function ChainOfThoughtComplete({
  label = 'AI Synthesis Complete',
  stats,
}: {
  label?: string;
  stats?: {
    totalQuestions?: number;
    bloomTaxonomy?: string;
    totalTime?: string;
  };
}) {
  return (
    <div className="pt-3 flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-2.5 mt-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="text-xs font-bold text-emerald-900">{label}</span>
      </div>
      {stats && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
          {stats.totalQuestions && (
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
              {stats.totalQuestions} Questions Formulated
            </span>
          )}
          {stats.totalTime && <span>{stats.totalTime}</span>}
        </div>
      )}
    </div>
  );
}
