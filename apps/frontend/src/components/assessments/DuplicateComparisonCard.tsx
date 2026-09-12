'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/design-system/Button';

export type DuplicateTier = 'EXACT_HASH' | 'LEXICAL' | 'SEMANTIC' | 'ANSWER_PATTERN' | 'NONE';

export interface DuplicateCandidateMatch {
  questionId: string;
  questionText: string;
  options?: string[];
  answer?: string;
  similarity: number;
  confidence: number;
  tier: DuplicateTier;
  evidence: {
    exact?: { matched: boolean; hash: string };
    lexical?: { score: number; matchedTerms: string[]; excerpt?: string };
    semantic?: { similarity: number; vectorDistance: number };
    answerPattern?: { matched: boolean; score: number; details?: string };
  };
  matchedExcerpt?: string;
}

export interface QuestionItem {
  id?: string;
  content: string;
  options?: string[];
  answer?: string;
}

interface DuplicateComparisonCardProps {
  sourceQuestion: QuestionItem;
  candidateMatch: DuplicateCandidateMatch;
  onAction?: (action: 'DISCARD' | 'KEEP' | 'REPLACE', candidateId: string) => void;
}

const TIER_BADGES: Record<DuplicateTier, { label: string; bg: string; text: string; border: string }> = {
  EXACT_HASH: { label: 'Exact Match', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  LEXICAL: { label: 'Lexical Match', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  SEMANTIC: { label: 'Semantic Match', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  ANSWER_PATTERN: { label: 'Answer Pattern Match', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  NONE: { label: 'No Match', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export function DuplicateComparisonCard({
  sourceQuestion,
  candidateMatch,
  onAction,
}: DuplicateComparisonCardProps) {
  const tierStyle = TIER_BADGES[candidateMatch.tier] || TIER_BADGES.NONE;
  const similarityPercent = Math.round(candidateMatch.similarity * 100);

  // Safely highlight matching lexical terms in text
  const renderHighlightedText = (text: string, matchedTerms: string[] = []) => {
    if (!matchedTerms || matchedTerms.length === 0) return text;
    const termSet = new Set(matchedTerms.map((t) => t.toLowerCase()));

    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (termSet.has(cleanWord)) {
        return (
          <mark key={idx} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded">
            {word}
          </mark>
        );
      }
      return word;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-0">
      {/* Card Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-800 text-sm">Potential Duplicate Flagged</span>
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
            {tierStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500">Similarity</div>
            <div className="text-sm font-extrabold text-indigo-600">{similarityPercent}% Match</div>
          </div>

          {onAction && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('DISCARD', candidateMatch.questionId)}
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Discard Dup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction('KEEP', candidateMatch.questionId)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Keep Both
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Question Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Left: Source Question A */}
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Question A (New / Generated)
            </span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {sourceQuestion.id || 'Draft'}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {sourceQuestion.content}
          </p>

          {sourceQuestion.options && sourceQuestion.options.length > 0 && (
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <div className="font-semibold text-slate-600 mb-1">Options:</div>
              {sourceQuestion.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-1 rounded ${
                    sourceQuestion.answer && opt.startsWith(sourceQuestion.answer)
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-slate-700'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Candidate Question B (Existing / Match) */}
        <div className="p-4 space-y-3 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Question B (Matched Candidate)
            </span>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-200">
              {candidateMatch.questionId}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {renderHighlightedText(
              candidateMatch.questionText,
              candidateMatch.evidence.lexical?.matchedTerms
            )}
          </p>

          {candidateMatch.options && candidateMatch.options.length > 0 && (
            <div className="space-y-1 bg-white p-2.5 rounded-lg border border-amber-200 text-xs">
              <div className="font-semibold text-slate-600 mb-1">Options:</div>
              {candidateMatch.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-1 rounded ${
                    candidateMatch.answer && opt.startsWith(candidateMatch.answer)
                      ? 'bg-emerald-100 text-emerald-900 font-bold'
                      : 'text-slate-700'
                  }`}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Evidence & Excerpt Footer */}
      <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Detection Rationale:</span>
          {candidateMatch.matchedExcerpt && (
            <span className="font-mono bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-800">
              {candidateMatch.matchedExcerpt}
            </span>
          )}
        </div>

        {candidateMatch.evidence.answerPattern?.details && (
          <span className="text-slate-500 italic">
            Answer Pattern: {candidateMatch.evidence.answerPattern.details}
          </span>
        )}
      </div>
    </div>
  );
}
