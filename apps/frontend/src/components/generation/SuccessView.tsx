'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, Zap } from 'lucide-react';

interface SuccessViewProps {
  assignmentId: string;
  isPartial: boolean;
  generatedCount: number | null | undefined;
  requestedCount: number | null | undefined;
  generatedMarks: number | null | undefined;
  requestedMarks: number | null | undefined;
  duration: number;
  subject?: string;
  schoolName?: string;
  className?: string;
  onRegenerate: () => void;
  isRetrying: boolean;
}

function CheckmarkCircle() {
  return (
    <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-200/50"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
      />
      <motion.svg
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        className="relative z-10"
      >
        <motion.polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </div>
  );
}

export function SuccessView({
  assignmentId, isPartial, generatedCount, requestedCount,
  generatedMarks, requestedMarks, duration, subject, schoolName, className,
  onRegenerate, isRetrying,
}: SuccessViewProps) {
  const normalizedSchoolName =
    schoolName && schoolName.trim().toLowerCase() !== 'school'
      ? schoolName
      : 'Delhi Public School';

  const normalizedClassName =
    className &&
    className.trim().toLowerCase() !== 'not specified' &&
    className.trim().toLowerCase() !== 'class not specified'
      ? className
      : 'Class 8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex justify-center px-4 py-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white/95 shadow-2xl shadow-black/5 px-6 py-8 sm:px-10 sm:py-10"
      >
        <div className="flex flex-col items-center text-center gap-1">
          <CheckmarkCircle />

          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
            {isPartial ? 'Partially Generated' : 'Assignment Ready'}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-3 max-w-xl">
            {isPartial
              ? `Generated ${generatedCount ?? 'some'}/${requestedCount ?? '?'} questions. Some sections need attention.`
              : 'Your assignment has been generated successfully and is ready to view.'}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-2 text-xs sm:text-sm text-gray-500">
            <span>{normalizedSchoolName}</span>
            <span>•</span>
            <span>{subject || 'Mathematics'}</span>
            <span>•</span>
            <span>{normalizedClassName}</span>
          </div>

          <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Questions', value: generatedCount !== null && generatedCount !== undefined ? `${generatedCount}/${requestedCount}` : (requestedCount ?? '-') },
              { label: 'Marks', value: generatedMarks !== null && generatedMarks !== undefined ? `${generatedMarks}/${requestedMarks}` : (requestedMarks ?? '-') },
              { label: 'Duration', value: `${duration} min` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex min-h-[108px] flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm"
              >
                <span className="text-5xl leading-none font-extrabold text-gray-900">{String(stat.value)}</span>
                <span className="text-xs text-gray-500 font-semibold mt-2 uppercase tracking-[0.14em]">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8 w-full">
            <Link
              href={`/assignments/${assignmentId}/paper`}
              className="inline-flex w-full sm:w-auto min-w-[220px] items-center justify-center gap-2 rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all"
            >
              <Zap size={15} />
              {isPartial ? 'View Partial Results' : 'View Generated Paper'}
            </Link>
            <button
              onClick={onRegenerate}
              disabled={isRetrying}
              className="inline-flex w-full sm:w-auto min-w-[180px] items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
              {isRetrying ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
