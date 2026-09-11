'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  Clock,
  AlertCircle,
  Plus,
  Zap,
  Calendar,
  BarChart3,
  Timer,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { RescheduleModal } from '@/components/student/RescheduleModal';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Button } from '@/components/ui/button';

type DashboardCategory = 'UPCOMING' | 'COMPLETED' | 'MISSED' | 'LIVE NOW';

interface StudentAssessment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  duration: number;
  attemptStatus: string;
  dashboardCategory: DashboardCategory;
  submittedAt?: string;
  score?: number;
  evaluatedMarks?: number;
  teacherId?: string;
}

export default function StudentAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleItem, setRescheduleItem] = useState<StudentAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/student/assessments');
      const list: StudentAssessment[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray((res.data as any)?.data?.assessments)
        ? (res.data as any).data.assessments
        : Array.isArray(res.data)
        ? (res.data as any)
        : [];
      setAssessments(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleStart = async (id: string, isStarted: boolean) => {
    if (isStarted) {
      router.push(`/assignments/${id}`);
      return;
    }

    try {
      await api.post(`/student/assessments/${id}/start`);
      toast.success('Assessment started');
      router.push(`/assignments/${id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start assessment');
    }
  };

  const handleViewResult = (assessment: StudentAssessment) => {
    router.push(`/student/results?id=${assessment.id}`);
  };

  const counts = useMemo(() => {
    return {
      all: assessments.length,
      live: assessments.filter(a => a.dashboardCategory === 'LIVE NOW').length,
      upcoming: assessments.filter(a => a.dashboardCategory === 'UPCOMING').length,
      completed: assessments.filter(a => a.dashboardCategory === 'COMPLETED').length,
      missed: assessments.filter(a => a.dashboardCategory === 'MISSED').length,
    };
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesCat =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'LIVE NOW' && a.dashboardCategory === 'LIVE NOW') ||
        (selectedCategory === 'UPCOMING' && a.dashboardCategory === 'UPCOMING') ||
        (selectedCategory === 'COMPLETED' && a.dashboardCategory === 'COMPLETED') ||
        (selectedCategory === 'MISSED' && a.dashboardCategory === 'MISSED');

      const matchesSearch =
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [assessments, selectedCategory, searchQuery]);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchAssessments} />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Tests & Assessments
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Manage and track scheduled exams, quizzes, and assessments across all subjects</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            onClick={() => router.push('/student/practice')}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            Create Practice Test
          </Button>
        </div>
      </section>

      {/* ── 2. Stat Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Tests</span>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{counts.all}</p>
          <span className="text-xs text-neutral-400 mt-0.5 block">Across all subjects</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Live & Upcoming</span>
          <p className="text-2xl font-bold text-[#e05934] mt-1">{counts.live + counts.upcoming}</p>
          <span className="text-xs text-orange-600 font-medium mt-0.5 block">{counts.live > 0 ? `${counts.live} Live Now` : 'Ready to attempt'}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Completed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.completed}</p>
          <span className="text-xs text-neutral-400 mt-0.5 block">Evaluated & Graded</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Missed</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{counts.missed}</p>
          <span className="text-xs text-rose-500 font-medium mt-0.5 block">Eligible for reschedule</span>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: 'All Tests', count: counts.all },
            { key: 'LIVE NOW', label: 'Live Now', count: counts.live },
            { key: 'UPCOMING', label: 'Upcoming', count: counts.upcoming },
            { key: 'COMPLETED', label: 'Completed', count: counts.completed },
            { key: 'MISSED', label: 'Missed', count: counts.missed },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.key ? 'bg-neutral-700 text-neutral-200' : 'bg-white text-neutral-600 border border-neutral-200'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e05934]"
          />
        </div>
      </div>

      {/* ── 4. Assessment Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssessments.map(a => {
          const isUpcoming = a.dashboardCategory === 'UPCOMING';
          const isCompleted = a.dashboardCategory === 'COMPLETED';
          const isMissed = a.dashboardCategory === 'MISSED';
          const isLive = a.dashboardCategory === 'LIVE NOW';

          const dateObj = new Date(a.dueDate);
          const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

          if (isLive) {
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl p-6 border-2 border-orange-500 shadow-md shadow-orange-500/10 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                      <Timer className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider bg-orange-600 text-white shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      LIVE NOW
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 mb-1 line-clamp-1">{a.title}</h3>
                  <p className="text-xs font-semibold text-neutral-500 mb-4">{a.subject} • {a.totalMarks} Marks</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-neutral-600 mb-1.5">
                    <span>DURATION: {a.duration} MINS</span>
                    <span className="text-orange-600">{a.attemptStatus === 'STARTED' ? 'In Progress' : 'Ready'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-orange-600 rounded-full w-2/3 animate-pulse" />
                  </div>

                  <button
                    onClick={() => handleStart(a.id, a.attemptStatus === 'STARTED')}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    {a.attemptStatus === 'STARTED' ? 'Resume Assessment' : 'Start Assessment'}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={a.id}
              className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs flex flex-col justify-between hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                    {isCompleted ? (
                      <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                    ) : isMissed ? (
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <Zap className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      isUpcoming
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {a.dashboardCategory}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-900 mb-1 line-clamp-1">{a.title}</h3>
                <p className="text-xs font-semibold text-neutral-500 mb-4">{a.subject} • {a.totalMarks} Marks</p>

                <div className="space-y-2 py-3 border-y border-neutral-100 mb-4">
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-medium">{dateStr} at {timeStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-medium">Allocated: {a.duration} Minutes</span>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>
                        Score: {a.score !== undefined && a.score !== null ? `${a.score} / ${a.evaluatedMarks || a.totalMarks}` : 'Evaluated'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {isUpcoming && (
                  <button
                    onClick={() => handleStart(a.id, false)}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
                  >
                    View Details & Instructions
                  </button>
                )}
                {isCompleted && (
                  <button
                    onClick={() => handleViewResult(a)}
                    className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-colors shadow-2xs"
                  >
                    Review Graded Submission
                  </button>
                )}
                {isMissed && (
                  <button
                    onClick={() => setRescheduleItem(a)}
                    className="w-full py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors"
                  >
                    Request Reschedule
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Create Practice Test Empty/CTA card */}
        <div
          onClick={() => router.push('/student/practice')}
          className="bg-neutral-50/70 hover:bg-white rounded-2xl p-6 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#e05934] group min-h-[260px]"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 group-hover:text-[#e05934] group-hover:scale-110 transition-all mb-3 shadow-2xs">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors mb-1">
            Create Custom Practice Test
          </h3>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed">
            Generate customized questions with AI to reinforce tricky topics before test day.
          </p>
        </div>
      </div>

      {rescheduleItem && (
        <RescheduleModal
          isOpen={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          assessmentId={rescheduleItem.id}
          courseTitle={rescheduleItem.title}
          originalDate={rescheduleItem.dueDate}
          teacherId={rescheduleItem.teacherId || ''}
        />
      )}
    </div>
  );
}
