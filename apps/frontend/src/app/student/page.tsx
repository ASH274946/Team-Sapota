'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Calendar,
  Trophy,
  Zap,
  Calculator,
  BookOpen,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Button } from '@/components/ui/button';

interface DashboardData {
  user: { firstName: string; lastName?: string };
  weeklyGoalProgress: number;
  nextTest: { title: string; daysLeft: number } | null;
  monthlyAttendance: number;
  attendanceTrend: string;
  globalRank: { current: number; total: number };
  activeAssignments: any[];
  upcomingTests: any[];
  aiInsight: any;
  currentStreak: number;
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

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashRes = await api.get('/student/dashboard');
      if (dashRes.data?.success) setData(dashRes.data.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  const dash = data || {
    user: { firstName: 'Student' },
    weeklyGoalProgress: 0,
    nextTest: null,
    monthlyAttendance: 0,
    attendanceTrend: '',
    globalRank: { current: 0, total: 0 },
    activeAssignments: [],
    upcomingTests: [],
    aiInsight: null,
    currentStreak: 0,
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  const streak = dash.currentStreak || 0;
  const attendance = dash.monthlyAttendance || 0;
  const weeklyProgress = dash.weeklyGoalProgress || 0;
  const rank = dash.globalRank?.current || 0;
  const totalRank = dash.globalRank?.total || 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Greeting Section (Exact Admin Layout) ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Good Morning, {dash.user.firstName} {dash.user.lastName || ''}
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Calendar className="size-4 text-neutral-400" />
            <span>{todayFormatted}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500 font-normal">
              {weeklyProgress}% weekly goals completed
              {dash.nextTest ? ` • Next test in ${dash.nextTest.daysLeft} days` : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/student/tutor/default">
            <Button
              type="button"
              variant="outline"
              className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
            >
              <BookOpen className="size-4 mr-1.5 text-indigo-600" />
              AI Tutor
            </Button>
          </Link>

          <Link href="/student/practice">
            <Button
              type="button"
              className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
            >
              <Sparkles className="size-4 mr-1" />
              Start Practice Quiz
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 2. Top 4 Metric Cards (Clean, exact Admin layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Attendance */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Monthly Attendance
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {attendance}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                {attendance > 0 ? (
                  <>
                    <TrendingUp className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">{dash.attendanceTrend || 'On Track'}</span>
                  </>
                ) : (
                  <span>No sessions recorded</span>
                )}
              </p>
            </div>
            <MetricBars
              values={attendance > 0 ? [Math.max(10, attendance - 15), Math.max(10, attendance - 10), attendance, attendance] : [0, 0, 0, 0]}
              color="#10b981"
            />
          </div>
        </article>

        {/* Card 2: Class Standing */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Class Standing
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Trophy className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {rank > 0 ? `#${rank}` : '—'}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {totalRank > 0 ? `Out of ${totalRank} students` : 'Cohort rank pending'}
              </p>
            </div>
            <MetricBars
              values={rank > 0 ? [rank + 2, rank + 1, rank, rank] : [0, 0, 0, 0]}
              color="#f59e0b"
            />
          </div>
        </article>

        {/* Card 3: Study Streak */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Study Streak
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Flame className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                {streak > 0 ? (
                  <span className="text-orange-600 font-semibold">🔥 Active Streak</span>
                ) : (
                  <span>Take a quiz to start</span>
                )}
              </p>
            </div>
            <MetricBars
              values={streak > 0 ? [Math.max(1, streak - 2), Math.max(1, streak - 1), streak, streak] : [0, 0, 0, 0]}
              color="#e05934"
            />
          </div>
        </article>

        {/* Card 4: Weekly Mastery */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Weekly Mastery
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Target className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {weeklyProgress}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-neutral-400" /> Target: 85%
              </p>
            </div>
            <MetricBars
              values={weeklyProgress > 0 ? [Math.max(10, weeklyProgress - 20), Math.max(10, weeklyProgress - 10), weeklyProgress, weeklyProgress] : [0, 0, 0, 0]}
              color="#6366f1"
            />
          </div>
        </article>
      </section>

      {/* ── 3. Main Dashboard Body (Left & Right Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Active Coursework & Tasks</h2>
                <p className="text-xs text-neutral-500">Pending assignments and submission deadlines</p>
              </div>
              <Link
                href="/student/assessments"
                className="flex items-center gap-1 text-xs font-bold text-[#e05934] hover:underline"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dash.activeAssignments && dash.activeAssignments.length > 0 ? (
                dash.activeAssignments.slice(0, 4).map((assignment, idx) => (
                  <div
                    key={assignment.id || idx}
                    className="flex flex-col justify-between p-4 rounded-xl border border-neutral-200/90 bg-white hover:border-neutral-300 transition-all shadow-2xs group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                          {idx % 2 === 0 ? <Zap className="w-4 h-4 text-amber-500" /> : <Calculator className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            assignment.dueDateStatus === 'DUE TODAY'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                          }`}
                        >
                          {assignment.dueDateStatus || 'UPCOMING'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors mb-1 line-clamp-1">
                        {assignment.title}
                      </h3>
                      <p className="text-xs text-neutral-500 mb-4 font-medium">
                        {assignment.subject} {assignment.teacher ? `• ${assignment.teacher}` : ''}
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-neutral-700 mb-1.5">
                        <span>Progress</span>
                        <span>{assignment.progress || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                          style={{ width: `${assignment.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 border border-dashed border-neutral-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-700">All caught up!</p>
                  <p className="text-xs text-neutral-400 mt-0.5">No pending active assignments right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Tiles */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Academic Quick Links</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/student/practice"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-orange-200 hover:bg-orange-50/20 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e05934] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800">Practice Quiz</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Self Assessment</span>
              </Link>

              <Link
                href="/student/mastery"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800">Topic Mastery</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Outcome Analytics</span>
              </Link>

              <Link
                href="/student/community"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800">Peer Hub</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Study Groups</span>
              </Link>

              <Link
                href="/student/results"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 hover:border-blue-200 hover:bg-blue-50/20 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800">Exam Results</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Report Cards</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* Upcoming Tests & Exams */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-neutral-900">Upcoming Tests</h2>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>

              <div className="space-y-3.5 mb-6">
                {dash.upcomingTests && dash.upcomingTests.length > 0 ? (
                  dash.upcomingTests.map((test, idx) => (
                    <div
                      key={test.id || idx}
                      className="flex items-center gap-3.5 p-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase leading-tight">
                          {test.dateStr ? test.dateStr.split('\n')[0] : 'AUG'}
                        </span>
                        <span className="text-base font-extrabold text-neutral-900 leading-tight">
                          {test.dateStr ? test.dateStr.split('\n')[1] : '30'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 truncate">
                          {test.title}
                        </h4>
                        <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                          {test.location || 'Main Hall'} • {test.time || '10:00 AM'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-neutral-400 text-xs">
                    No scheduled exams for the next 7 days.
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/student/assessments"
              className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold text-center transition-colors shadow-2xs block"
            >
              View Full Exam Schedule
            </Link>
          </div>

          {/* AI Learning Insight Card */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>Personalized AI Guidance</span>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed mb-6 font-normal">
              {dash.aiInsight?.recommendedTopic ? (
                <>
                  Based on your recent <strong className="text-white">{dash.aiInsight.performanceArea || 'coursework'}</strong> performance, we recommend reviewing <strong className="text-amber-300 border-b border-amber-400/50 pb-0.5 font-semibold">{dash.aiInsight.recommendedTopic}</strong> prior to the upcoming assessment.
                </>
              ) : (
                'Review your recent topics and practice quizzes to receive personalized AI recommendations and study plans.'
              )}
            </p>
            <Link
              href="/student/practice"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold transition-colors"
            >
              <span>Launch Recommended Practice</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
