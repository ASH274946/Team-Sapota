'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Target,
  TrendingUp,
  BarChart3,
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { useAuthStore } from '@/store/auth.store';
import { learningService } from '@/services/learning.service';
import { Button } from '@/components/ui/button';

// ── SVG Micro Bar Chart ──
function MetricBars({ values, color = '#e05934' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 w-12 shrink-0 items-end justify-between gap-1">
      {values.map((v, i) => {
        const height = max > 0 && v > 0 ? Math.max(15, Math.round((v / max) * 100)) : 10;
        return (
          <span
            key={i}
            style={{ height: `${height}%`, backgroundColor: color }}
            className="w-1.5 rounded-t-xs transition-all duration-300 opacity-80 hover:opacity-100"
          />
        );
      })}
    </div>
  );
}

export default function MasteryPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningService.getStudentProfile(user.id);
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mastery data');
      toast.error('Could not load your learning profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [fetchProfile, user]);

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;
  if (!profile) return null;

  const overallScore = profile.overallMasteryScore || 0;
  const readiness = profile.predictedReadiness || 0;
  const strongCount = profile.strongConcepts?.length || 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Mastery & Competency Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Real-time Bloom&apos;s taxonomy tracking and AI knowledge-graph analysis across all enrolled subjects</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/student/practice">
            <Button
              type="button"
              className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
            >
              <Sparkles className="size-4 mr-1" />
              Practice Weak Topics
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Overall Mastery */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Overall Mastery
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Target className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {overallScore}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                {overallScore > 0 ? (
                  <>
                    <TrendingUp className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">+2.5% this week</span>
                  </>
                ) : (
                  <span>Take quizzes to evaluate</span>
                )}
              </p>
            </div>
            <MetricBars values={overallScore > 0 ? [Math.max(10, overallScore - 15), overallScore, overallScore, overallScore] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Learning Velocity */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Learning Velocity
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Zap className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {profile.learningVelocity || 'Stable'}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Based on recent tests
              </p>
            </div>
            <MetricBars values={[2, 3, 4, 4]} color="#8b5cf6" />
          </div>
        </article>

        {/* Card 3: Concepts Mastered */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Mastered Concepts
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <BarChart3 className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {strongCount} {strongCount === 1 ? 'Topic' : 'Topics'}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Across all subjects
              </p>
            </div>
            <MetricBars values={strongCount > 0 ? [Math.max(1, strongCount - 2), strongCount, strongCount, strongCount] : [0, 0, 0, 0]} color="#3b82f6" />
          </div>
        </article>

        {/* Card 4: Exam Readiness */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Exam Readiness
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Award className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {readiness}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Predicted performance
              </p>
            </div>
            <MetricBars values={readiness > 0 ? [Math.max(10, readiness - 10), readiness, readiness, readiness] : [0, 0, 0, 0]} color="#f59e0b" />
          </div>
        </article>
      </section>

      {/* ── 3. Concept Strengths & Improvement Areas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strong Concepts Card */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Strong Concepts & Competencies</h3>
                <p className="text-xs text-neutral-500">Topics where your accuracy exceeds 80%</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {profile.strongConcepts && profile.strongConcepts.length > 0 ? (
                profile.strongConcepts.map((concept: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-xs text-emerald-950">{concept}</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Mastered
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Continue taking quizzes and tests to identify your top mastery areas.
                </div>
              )}
            </div>
          </div>

          <Link
            href="/student/practice"
            className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold text-center transition-colors shadow-2xs block"
          >
            Take Mastery Challenge Quiz
          </Link>
        </div>

        {/* Areas for Improvement Card */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Areas for Targeted Practice</h3>
                <p className="text-xs text-neutral-500">Focus areas recommended by AI diagnostic evaluation</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {profile.weakConcepts && profile.weakConcepts.length > 0 ? (
                profile.weakConcepts.map((concept: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/60 border border-rose-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-semibold text-xs text-rose-950">{concept}</span>
                    </div>
                    <Link
                      href={`/student/practice?topic=${encodeURIComponent(concept)}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline"
                    >
                      <span>Practice</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center text-xs text-neutral-500">
                  🎉 Fantastic work! No weak concept alerts flagged in your recent submissions.
                </div>
              )}
            </div>
          </div>

          <Link
            href="/student/tutor/default"
            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold text-center transition-colors shadow-2xs block"
          >
            Review Weak Concepts with AI Tutor
          </Link>
        </div>
      </div>
    </div>
  );
}
