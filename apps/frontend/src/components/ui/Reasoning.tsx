'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';
import { TextShimmer } from './TextShimmer';

interface ReasoningContextType {
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isStreaming: boolean;
  durationSeconds: number;
}

const ReasoningContext = createContext<ReasoningContextType>({
  isExpanded: false,
  setIsExpanded: () => {},
  isStreaming: false,
  durationSeconds: 0,
});

export interface ReasoningProps {
  children: React.ReactNode;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function Reasoning({
  children,
  isStreaming = false,
  defaultExpanded = false,
  className = '',
}: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Auto-expand when streaming starts if not manually set
  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
      const start = Date.now();
      const interval = setInterval(() => {
        setDurationSeconds(Math.max(1, Math.round((Date.now() - start) / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  return (
    <ReasoningContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        isStreaming,
        durationSeconds,
      }}
    >
      <div
        className={`w-full rounded-xl border border-neutral-200/70 bg-neutral-50/50 overflow-hidden transition-all duration-200 ${className}`}
      >
        {children}
      </div>
    </ReasoningContext.Provider>
  );
}

export interface ReasoningTriggerProps {
  label?: string;
  className?: string;
}

export function ReasoningTrigger({
  label,
  className = '',
}: ReasoningTriggerProps) {
  const { isExpanded, setIsExpanded, isStreaming, durationSeconds } =
    useContext(ReasoningContext);

  const defaultText = isStreaming ? (
    <TextShimmer className="text-xs">Thinking...</TextShimmer>
  ) : (
    <span className="text-xs text-neutral-600 font-medium">
      Thought for {durationSeconds > 0 ? `${durationSeconds}s` : 'a few seconds'}
    </span>
  );

  return (
    <button
      type="button"
      onClick={() => setIsExpanded((prev) => !prev)}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-neutral-100/60 transition-colors text-left select-none cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-orange-500/10 text-[#e05934] flex items-center justify-center shrink-0">
          {isStreaming ? (
            <Sparkles className="w-3 h-3 animate-pulse" />
          ) : (
            <Brain className="w-3 h-3" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {label ? (
            <span className="text-xs text-neutral-700 font-medium">{label}</span>
          ) : (
            defaultText
          )}
        </div>
      </div>

      <div className="text-neutral-400">
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </div>
    </button>
  );
}

export interface ReasoningContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ReasoningContent({
  children,
  className = '',
}: ReasoningContentProps) {
  const { isExpanded, isStreaming } = useContext(ReasoningContext);

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden border-t border-neutral-200/50 bg-white/70"
        >
          <div
            className={`p-3.5 text-xs text-neutral-600 font-mono leading-relaxed whitespace-pre-wrap ${className}`}
          >
            {children}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-orange-500 animate-pulse align-middle" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
