'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { DuplicateComparisonCard, DuplicateCandidateMatch } from '@/components/assessments/DuplicateComparisonCard';
import { api } from '@/lib/api';
import { CheckCircle, Search, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DuplicateCheckerPage() {
  const [questionText, setQuestionText] = useState('');
  const [optionsText, setOptionsText] = useState('A. \nB. \nC. \nD. ');
  const [answerKey, setAnswerKey] = useState('A');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheckDuplicates = async () => {
    if (!questionText.trim()) {
      toast.error('Please enter a question to check.');
      return;
    }

    setIsChecking(true);
    try {
      const parsedOptions = optionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/questions/duplicate-check', {
        content: questionText.trim(),
        options: parsedOptions.length > 0 ? parsedOptions : undefined,
        answer: answerKey.trim() || undefined,
      });

      setResult(res.data.data);
      if (res.data.data?.isDuplicate) {
        toast.error(`Potential duplicate detected! (${res.data.data.tier})`);
      } else {
        toast.success('No duplicates found. Question is unique!');
      }
    } catch {
      toast.error('Failed to run duplicate detection check.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleAction = (action: 'DISCARD' | 'KEEP' | 'REPLACE', candidateId: string) => {
    if (action === 'DISCARD') {
      toast.success('Duplicate candidate discarded.');
      setResult(null);
      setQuestionText('');
    } else if (action === 'KEEP') {
      toast.success('Question retained alongside existing candidates.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Multi-Tier Question Duplicate Checker"
        subtitle="Detect exact hash, lexical overlap, semantic near-duplicates, and answer pattern matches"
      />

      {/* Input Section */}
      <Card className="p-6 space-y-4 border-slate-200">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" /> Test Question Input
        </h3>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Question Content</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type or paste question text here..."
            rows={3}
            className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Options (One per line)</label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={4}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Correct Answer Key</label>
            <input
              type="text"
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              placeholder="e.g. A"
              className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleCheckDuplicates}
            disabled={isChecking || !questionText.trim()}
            className="min-w-[160px] justify-center"
          >
            {isChecking ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning Pipeline…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Check Duplicates</>
            )}
          </Button>
        </div>
      </Card>

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Detection Results &amp; Evidence</h3>
            <span className="text-xs text-slate-500">
              Evaluated against 4-stage pipeline (Exact → Lexical → Semantic → Answer Pattern)
            </span>
          </div>

          {!result.isDuplicate ? (
            <Card className="p-8 text-center bg-emerald-50/50 border-emerald-200 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900">100% Unique Question</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto">
                No exact, lexical, semantic, or answer-pattern duplicates found in the question bank. Safe for publication.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {result.allCandidates.map((candidate: DuplicateCandidateMatch, idx: number) => (
                <DuplicateComparisonCard
                  key={candidate.questionId || idx}
                  sourceQuestion={{
                    content: questionText,
                    options: optionsText.split('\n').map((s) => s.trim()).filter(Boolean),
                    answer: answerKey,
                  }}
                  candidateMatch={candidate}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
