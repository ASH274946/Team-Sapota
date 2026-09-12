'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, FileText, Check, Copy } from 'lucide-react';

export interface CitationSource {
  title: string;
  url?: string;
  description?: string;
  domain?: string;
  page?: number | string;
  chapter?: string;
  confidence?: number;
}

interface CitationContextType {
  citations: CitationSource[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerIndex?: number;
}

const CitationContext = createContext<CitationContextType>({
  citations: [],
  isOpen: false,
  setIsOpen: () => {},
});

export interface CitationProps {
  children: React.ReactNode;
  citations: CitationSource[];
  index?: number;
  className?: string;
}

export function Citation({
  children,
  citations,
  index = 1,
  className = '',
}: CitationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  return (
    <CitationContext.Provider
      value={{
        citations,
        isOpen,
        setIsOpen,
        triggerIndex: index,
      }}
    >
      <span
        ref={containerRef}
        className={`relative inline-block align-baseline ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </span>
    </CitationContext.Provider>
  );
}

export interface CitationTriggerProps {
  children?: React.ReactNode;
  className?: string;
}

export function CitationTrigger({
  children,
  className = '',
}: CitationTriggerProps) {
  const { citations, isOpen, setIsOpen, triggerIndex } = useContext(CitationContext);
  const primarySource = citations[0];

  const getDomain = () => {
    if (primarySource?.domain) return primarySource.domain;
    if (primarySource?.url) {
      try {
        return new URL(primarySource.url).hostname.replace('www.', '');
      } catch {
        return '';
      }
    }
    return '';
  };

  const domain = getDomain();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      className={`inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.2 rounded-md bg-orange-50 hover:bg-orange-100/80 text-[#e05934] border border-orange-200/60 font-mono text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 select-none cursor-pointer ${
        isOpen ? 'ring-2 ring-orange-400/40 bg-orange-100' : ''
      } ${className}`}
      title={primarySource?.title || 'View Citation'}
    >
      {children || (
        <>
          {domain ? (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt=""
              className="w-3 h-3 rounded-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <BookOpen className="w-2.5 h-2.5 shrink-0" />
          )}
          <span>{triggerIndex}</span>
        </>
      )}
    </button>
  );
}

export interface CitationContentProps {
  children?: React.ReactNode;
  className?: string;
}

export function CitationContent({
  children,
  className = '',
}: CitationContentProps) {
  const { isOpen, citations } = useContext(CitationContext);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 sm:w-80 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-xl backdrop-blur-md text-left text-neutral-900 ${className}`}
        >
          {children || citations.map((source, idx) => <CitationItem key={idx} source={source} />)}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface CitationItemProps {
  source?: CitationSource;
  className?: string;
}

export function CitationItem({
  source,
  className = '',
}: CitationItemProps) {
  const { citations } = useContext(CitationContext);
  const data = source || citations[0];
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const getDomain = () => {
    if (data.domain) return data.domain;
    if (data.url) {
      try {
        return new URL(data.url).hostname.replace('www.', '');
      } catch {
        return '';
      }
    }
    return '';
  };

  const domain = getDomain();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.url) {
      navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {domain ? (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
              alt=""
              className="w-4 h-4 rounded shrink-0 object-contain"
            />
          ) : (
            <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          )}
          <span className="text-[11px] font-semibold text-neutral-500 truncate">
            {domain || 'Knowledge Base / Syllabus'}
          </span>
        </div>

        {data.page && (
          <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-mono font-medium text-neutral-600 border border-neutral-200/60">
            p. {data.page}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2">
        {data.title}
      </h4>

      {/* Description / Chunk Snippet */}
      {data.description && (
        <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-3 bg-neutral-50/80 p-2 rounded-xl border border-neutral-100">
          &ldquo;{data.description}&rdquo;
        </p>
      )}

      {/* Footer / Actions */}
      {data.url && (
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px]">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#e05934] font-semibold hover:underline"
          >
            Visit Source <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Copy URL"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
