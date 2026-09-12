'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X, Check, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export interface FeedbackBarProps {
  children?: React.ReactNode;
  onFeedbackSubmit?: (feedback: { rating: 'positive' | 'negative'; comment?: string; tags?: string[] }) => void;
  targetId?: string;
  targetType?: string;
  className?: string;
  showCommentOption?: boolean;
}

export function FeedbackBar({
  children,
  onFeedbackSubmit,
  targetId,
  targetType = 'ai_generation',
  className = '',
  showCommentOption = true,
}: FeedbackBarProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isDismissed) return null;

  const handleVote = (selectedRating: 'positive' | 'negative') => {
    setRating(selectedRating);
    if (!showCommentOption) {
      setIsSubmitted(true);
      onFeedbackSubmit?.({ rating: selectedRating });
      toast.success('Thank you for your feedback!');
      setTimeout(() => setIsDismissed(true), 2500);
    } else {
      setShowCommentBox(true);
    }
  };

  const handleSubmitDetails = () => {
    if (!rating) return;
    setIsSubmitted(true);
    setShowCommentBox(false);
    onFeedbackSubmit?.({
      rating,
      comment: comment.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    toast.success('Thank you for helping improve VidyaAI!');
    setTimeout(() => setIsDismissed(true), 2500);
  };

  const positiveTags = ['Accurate', 'High Quality', 'Syllabus Aligned', 'Great Structure'];
  const negativeTags = ['Inaccurate', 'Outdated', 'Too Complex', 'Too Simple', 'Hallucination'];
  const activeTags = rating === 'positive' ? positiveTags : negativeTags;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`}>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white/90 px-2 py-1 shadow-2xs backdrop-blur-xs text-xs">
        {isSubmitted ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Feedback recorded</span>
          </div>
        ) : (
          <>
            <span className="text-[11px] font-medium text-neutral-500 pl-1">Helpful?</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleVote('positive')}
                className={`p-1.5 rounded-full transition-all hover:bg-neutral-100 active:scale-95 cursor-pointer ${
                  rating === 'positive' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Good response"
                aria-label="Thumbs up"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleVote('negative')}
                className={`p-1.5 rounded-full transition-all hover:bg-neutral-100 active:scale-95 cursor-pointer ${
                  rating === 'negative' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Poor response"
                aria-label="Thumbs down"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors ml-0.5"
              title="Dismiss"
              aria-label="Dismiss feedback"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* Expanded Feedback Tags & Comment Popover */}
      <AnimatePresence>
        {showCommentBox && !isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl text-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-800">
                {rating === 'positive' ? 'What worked well?' : 'What could be improved?'}
              </span>
              <button
                type="button"
                onClick={() => setShowCommentBox(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Tags */}
            <div className="flex flex-wrap gap-1.5">
              {activeTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-50 text-[#e05934] border-orange-300 font-semibold'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200/80 hover:bg-neutral-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional feedback (optional)..."
              rows={2}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50/50 p-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:bg-white focus:border-orange-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCommentBox(false);
                  setIsSubmitted(true);
                  if (rating) onFeedbackSubmit?.({ rating });
                }}
                className="px-2.5 py-1 text-[11px] text-neutral-500 hover:text-neutral-800 font-medium"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitDetails}
                className="flex items-center gap-1.5 rounded-full bg-[#e05934] hover:bg-[#c94a2a] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition-colors"
              >
                <Send className="w-3 h-3" />
                Submit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FeedbackBarContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FeedbackBarActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function FeedbackBarAction({
  children,
  tooltip,
  asChild,
}: {
  children: React.ReactNode;
  tooltip?: string;
  asChild?: boolean;
}) {
  return <span title={tooltip}>{children}</span>;
}

export function FeedbackBarClose({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: string;
}) {
  return <span title={tooltip}>{children}</span>;
}
