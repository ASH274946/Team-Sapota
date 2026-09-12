'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  BookOpen,
  Sparkles,
  Target,
  Flame,
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

export default function StudyPlanPage() {
  const { user } = useAuthStore();
  const [studyPlan, setStudyPlan] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningService.getStudyPlan(user.id);
      setStudyPlan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load study plan');
      toast.error('Could not load your study plan');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPlan();
  }, [fetchPlan, user]);

  const toggleTaskDone = (index: number) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    toast.success('Task milestone updated!');
  };

  if (isLoading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchPlan} />;

  const tasks = studyPlan?.dailyPlan || [];
  const totalMinutes = tasks.reduce((sum: number, t: any) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Personalized Daily Study Plan
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>AI-calibrated schedule to close knowledge gaps and maintain consistent exam readiness</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={() => {
              toast.success('Study plan synchronized with latest test scores!');
              fetchPlan();
            }}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
          >
            <Sparkles className="size-4 mr-1" />
            Recalculate Roadmap
          </Button>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Tasks */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Today&apos;s Tasks
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Target className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{tasks.length} Modules</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {Object.values(completedTasks).filter(Boolean).length} completed
              </p>
            </div>
            <MetricBars values={tasks.length > 0 ? [tasks.length, tasks.length, tasks.length, tasks.length] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Estimated Time */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Est. Study Time
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{totalMinutes} Mins</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {totalMinutes > 0 ? 'Optimal daily workload' : 'No tasks pending'}
              </p>
            </div>
            <MetricBars values={totalMinutes > 0 ? [totalMinutes, totalMinutes, totalMinutes, totalMinutes] : [0, 0, 0, 0]} color="#3b82f6" />
          </div>
        </article>

        {/* Card 3: Target Completion */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Milestone Progress
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {tasks.length > 0
                  ? Math.round(
                      (Object.values(completedTasks).filter(Boolean).length / tasks.length) * 100
                    )
                  : 100}
                %
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {tasks.length > 0 ? 'On pace for goals' : 'All caught up'}
              </p>
            </div>
            <MetricBars values={[100, 100, 100, 100]} color="#10b981" />
          </div>
        </article>

        {/* Card 4: Study Streak */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Plan Adherence
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Flame className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">100%</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Consistency rating</p>
            </div>
            <MetricBars values={[1, 1, 1, 1]} color="#f59e0b" />
          </div>
        </article>
      </section>

      {/* ── 3. Plan Tasks & Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Tasks List (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Scheduled Milestones</h2>
              <p className="text-xs text-neutral-500">Prioritized by AI diagnostic outcomes</p>
            </div>
            <span className="text-xs font-semibold text-neutral-400">{tasks.length} Activities</span>
          </div>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task: any, index: number) => {
                const isDone = !!completedTasks[index];
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                      isDone
                        ? 'bg-neutral-50/50 border-neutral-200 opacity-60'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-2 h-10 rounded-full shrink-0 ${
                          task.priority === 'HIGH'
                            ? 'bg-rose-500'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              task.priority === 'HIGH'
                                ? 'bg-rose-50 text-rose-700'
                                : task.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {task.priority || 'NORMAL'} Priority
                          </span>
                          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {task.estimatedMinutes || 20} mins
                          </span>
                        </div>
                        <h3
                          className={`text-sm font-bold truncate ${
                            isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                          }`}
                        >
                          {task.topic}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{task.activity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link
                        href={task.type === 'PRACTICE' ? '/student/practice' : '/student/tutor/default'}
                        className="px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1"
                      >
                        {task.type === 'PRACTICE' ? <Play className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                        <span>Launch</span>
                      </Link>
                      <button
                        onClick={() => toggleTaskDone(index)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-700">You are all caught up for today!</p>
                <p className="text-xs text-neutral-400 mt-0.5">Explore practice quizzes or review recent lesson notes.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Guidance & Tips */}
        <div className="space-y-6">
          <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>Smart Study Guidance</span>
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Spaced Repetition & Recall</h3>
            <p className="text-neutral-300 text-xs leading-relaxed mb-6 font-normal">
              Reviewing short 15-minute concept summaries right after lectures has been shown to increase long-term memory retention by over 30%.
            </p>
            <Link
              href="/student/tutor/default"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold transition-colors"
            >
              <span>Ask AI Tutor for Summary</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
              Weekly Targets
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800">Practice Sets</span>
                <span className="text-xs font-extrabold text-neutral-600">On Track</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800">Attendance Target</span>
                <span className="text-xs font-extrabold text-emerald-600">75% Min Met</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
