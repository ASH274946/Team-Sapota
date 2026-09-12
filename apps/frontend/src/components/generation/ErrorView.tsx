'use client';
import { motion } from 'framer-motion';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorViewProps {
  error: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

export function ErrorView({ error, onRetry, isRetrying }: ErrorViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 py-10 overflow-x-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-red-50/80 to-transparent -z-10 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.1 }}
        className="relative flex items-center justify-center mb-10"
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-red-100 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.2)] relative z-10">
          <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600" strokeWidth={2.5} />
        </div>
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-red-400 rounded-full blur-2xl z-0"
        />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight text-center mb-6 leading-[1.1] break-words"
      >
        Generation Interrupted
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg sm:text-xl text-gray-500 font-medium text-center max-w-2xl leading-relaxed mb-8"
      >
        We hit a roadblock while crafting your assignment. This could be due to invalid materials or a temporary connection issue.
      </motion.p>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[92vw] bg-white border border-red-200 rounded-2xl p-4 sm:p-6 shadow-xl shadow-red-100/50 mb-10 overflow-hidden"
        >
          <p className="text-sm sm:text-base text-red-600 font-mono break-words text-center font-semibold">
            {error}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm"
      >
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center justify-center gap-3 w-full bg-gray-900 text-white rounded-xl px-6 py-4 text-lg sm:text-xl font-bold shadow-xl shadow-gray-900/25 hover:bg-gray-800 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-8 h-8 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      </motion.div>
    </motion.div>
  );
}
