'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  GraduationCap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Button } from '@/components/ui/button';

interface StudentLesson {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  duration: string;
  status: string;
  completedCount: number;
  totalCount: number;
  createdAt: string;
}

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

export default function StudentLessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: StudentLesson[] }>('/student/lessons');
      setLessons(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons');
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const stats = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter(
      (l) => l.totalCount > 0 && l.completedCount === l.totalCount
    ).length;
    const inProgress = lessons.filter(
      (l) => l.completedCount > 0 && l.completedCount < l.totalCount
    ).length;
    const notStarted = Math.max(0, total - completed - inProgress);

    return { total, completed, inProgress, notStarted };
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const progressPct =
        l.totalCount > 0 ? Math.round((l.completedCount / l.totalCount) * 100) : 0;
      const matchesFilter =
        selectedFilter === 'ALL' ||
        (selectedFilter === 'COMPLETED' && progressPct === 100) ||
        (selectedFilter === 'IN_PROGRESS' && progressPct < 100);

      const matchesSearch =
        searchQuery === '' ||
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.teacher && l.teacher.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [lessons, selectedFilter, searchQuery]);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchLessons} />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Course Lessons & Modules
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Browse structured lesson plans, track reading milestones, and access rich materials</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/student/tutor/default">
            <Button
              type="button"
              className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
            >
              <Sparkles className="size-4 mr-1 text-amber-400" />
              Ask AI Tutor
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Lessons */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Assigned Lessons
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{stats.total}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Across active subjects</p>
            </div>
            <MetricBars values={stats.total > 0 ? [stats.total, stats.total, stats.total, stats.total] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Completed */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Completed Modules
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{stats.completed}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {stats.completed > 0 ? 'Ready for examination' : 'Start learning'}
              </p>
            </div>
            <MetricBars values={stats.completed > 0 ? [stats.completed, stats.completed, stats.completed, stats.completed] : [0, 0, 0, 0]} color="#10b981" />
          </div>
        </article>

        {/* Card 3: In Progress */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              In Progress
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{stats.inProgress}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Active reading list</p>
            </div>
            <MetricBars values={stats.inProgress > 0 ? [stats.inProgress, stats.inProgress, stats.inProgress, stats.inProgress] : [0, 0, 0, 0]} color="#f59e0b" />
          </div>
        </article>

        {/* Card 4: Study Coverage */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Syllabus Coverage
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {stats.total > 0 ? 'Term milestone progress' : 'No lessons enrolled'}
              </p>
            </div>
            <MetricBars values={stats.total > 0 ? [Math.round((stats.completed / stats.total) * 100), Math.round((stats.completed / stats.total) * 100), Math.round((stats.completed / stats.total) * 100), Math.round((stats.completed / stats.total) * 100)] : [0, 0, 0, 0]} color="#6366f1" />
          </div>
        </article>
      </section>

      {/* ── 3. Filters & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: 'All Lessons' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedFilter === tab.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by lesson or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e05934]"
          />
        </div>
      </div>

      {/* ── 4. Lesson Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLessons.length > 0 ? (
          filteredLessons.map((lesson, i) => {
            const progressPct =
              lesson.totalCount > 0
                ? Math.round((lesson.completedCount / lesson.totalCount) * 100)
                : 0;

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/student/lessons/${lesson.id}`)}
                className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e05934] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {lesson.subject}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors mb-1 line-clamp-1">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mb-4">
                    Instructor: {lesson.teacher || 'Faculty Assigned'}
                  </p>
                </div>

                <div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-neutral-700">
                      <span>Module Progress</span>
                      <span>{progressPct}% ({lesson.completedCount}/{lesson.totalCount})</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {lesson.duration || '45 Mins'}
                    </span>
                    <span className="font-bold text-[#e05934] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Open Module <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200 p-8">
            <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">No lessons assigned yet</h3>
            <p className="text-xs text-neutral-400 mt-1">Your teacher has not assigned any lessons to your class yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
