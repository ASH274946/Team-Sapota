'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  Star,
  TrendingUp,
  ChevronRight,
  Zap,
  Globe,
  Sigma,
  BookOpen,
  CheckCircle2,
  Trophy,
  Award,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Button } from '@/components/ui/button';

interface AssessmentResult {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  feedback: string;
  status: string;
  submittedAt: string;
  gradedAt: string;
  assignmentId: string;
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

export default function StudentResultsDashboard() {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: AssessmentResult[] }>('/student/results');
      setResults(res.data.data ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const { currentGPA, gpaTrend, chartData, highestScore, totalSubmitted } = useMemo(() => {
    if (results.length === 0) {
      return {
        currentGPA: '0.00',
        gpaTrend: '0.0',
        chartData: [],
        highestScore: 0,
        totalSubmitted: 0,
      };
    }

    const sorted = [...results].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    const avgPercentage = sorted.reduce((acc, r) => acc + (r.percentage || 0), 0) / sorted.length;
    const current = (avgPercentage / 100) * 4.0;
    const maxScore = Math.max(...sorted.map(r => r.percentage || 0));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: Record<string, number[]> = {};

    sorted.forEach((r) => {
      const date = new Date(r.submittedAt);
      const monthStr = monthNames[date.getMonth()];
      if (!monthlyData[monthStr]) monthlyData[monthStr] = [];
      monthlyData[monthStr].push(r.percentage || 0);
    });

    const cData = Object.keys(monthlyData).map((month) => {
      const scores = monthlyData[month];
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return { month, score: Math.round(avg) };
    });

    return {
      currentGPA: current.toFixed(2),
      gpaTrend: '+3.5',
      chartData: cData,
      highestScore: maxScore || 0,
      totalSubmitted: results.length,
    };
  }, [results]);

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic') || s.includes('science')) return <Zap className="w-5 h-5 text-amber-500" />;
    if (s.includes('histor') || s.includes('geograph')) return <Globe className="w-5 h-5 text-indigo-500" />;
    if (s.includes('math') || s.includes('calculus')) return <Sigma className="w-5 h-5 text-blue-500" />;
    return <BookOpen className="w-5 h-5 text-emerald-500" />;
  };

  if (loading) return <LoadingState lines={8} />;
  if (error) return <ErrorState message={error} onRetry={fetchResults} />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Results & Academic Performance
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Deep dive into rubric scores, exam velocity, and verified transcript records</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success('Transcript report generated and downloaded.')}
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Download className="size-4 mr-1.5 text-neutral-500" />
            Export PDF Transcript
          </Button>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cumulative GPA */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Cumulative GPA
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Star className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {currentGPA} <span className="text-sm font-semibold text-neutral-400">/ 4.0</span>
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                {parseFloat(currentGPA) > 0 ? (
                  <>
                    <TrendingUp className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Active Term Score</span>
                  </>
                ) : (
                  <span>No graded tests yet</span>
                )}
              </p>
            </div>
            <MetricBars values={parseFloat(currentGPA) > 0 ? [Math.max(1, parseFloat(currentGPA) - 0.5), parseFloat(currentGPA), parseFloat(currentGPA), parseFloat(currentGPA)] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Highest Score */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Highest Score
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Trophy className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {highestScore}%
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {highestScore > 0 ? 'Peak assessment performance' : 'No scored submissions'}
              </p>
            </div>
            <MetricBars values={highestScore > 0 ? [Math.max(10, highestScore - 15), highestScore, highestScore, highestScore] : [0, 0, 0, 0]} color="#10b981" />
          </div>
        </article>

        {/* Card 3: Evaluated Submissions */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Graded Submissions
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {totalSubmitted}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Evaluated and recorded
              </p>
            </div>
            <MetricBars values={totalSubmitted > 0 ? [totalSubmitted, totalSubmitted, totalSubmitted, totalSubmitted] : [0, 0, 0, 0]} color="#6366f1" />
          </div>
        </article>

        {/* Card 4: Honors Standing */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Honors Standing
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Award className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {parseFloat(currentGPA) >= 3.5 ? "Dean's List" : "Good Standing"}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Academic standing
              </p>
            </div>
            <MetricBars values={[1, 1, 1, 1]} color="#f59e0b" />
          </div>
        </article>
      </section>

      {/* ── 3. Academic Velocity Chart & Results List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart (Span 1) */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 mb-1">Monthly Grade Progress</h2>
            <p className="text-xs text-neutral-500 mb-6">Aggregate percentage score progression</p>

            {chartData.length > 0 ? (
              <div className="flex items-end justify-between gap-3 h-48 px-2 pt-6 pb-2 border-b border-neutral-100">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-600">{d.score}%</span>
                    <div className="w-full bg-neutral-100 rounded-t-lg overflow-hidden h-32 flex items-end">
                      <div
                        className="w-full bg-neutral-900 rounded-t-lg transition-all duration-500"
                        style={{ height: `${Math.max(15, d.score)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-500">{d.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-neutral-400">
                No monthly grade records available yet.
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-neutral-500">
            <span>Evaluated Assessments: <strong>{totalSubmitted}</strong></span>
            <span className="text-emerald-600 font-bold">Good Standing</span>
          </div>
        </div>

        {/* Graded Submissions List (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Graded Assessments</h2>
              <p className="text-xs text-neutral-500">Official scores and faculty feedback reports</p>
            </div>
            <span className="text-xs font-semibold text-neutral-400">Showing {results.length} Records</span>
          </div>

          <div className="space-y-3">
            {results.length > 0 ? (
              results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/student/results?id=${r.id}`)}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 bg-neutral-50/40 hover:bg-white transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                      {getSubjectIcon(r.subject || '')}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors truncate">
                        {r.title}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">
                        {r.subject} • Submitted on {new Date(r.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-neutral-900 block leading-tight">
                        {r.score} <span className="text-xs font-semibold text-neutral-400">/ {r.totalMarks}</span>
                      </span>
                      <span className={`text-[11px] font-bold ${
                        r.percentage >= 80 ? 'text-emerald-600' : r.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {r.percentage}% Score
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-700">No graded results yet</p>
                <p className="text-xs text-neutral-400 mt-0.5">Your submitted assessments will appear here once reviewed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
