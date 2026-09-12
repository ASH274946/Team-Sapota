'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Calculator,
  Thermometer,
  Globe,
  Microscope,
  ChevronRight,
  BarChart2,
  Flame,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';
import { Button } from '@/components/ui/button';

interface GeneratedQuestion {
  id: string;
  question_text: string;
  options?: string[];
  answer?: string;
  difficulty: string;
  bloomLevel: string;
  ai_confidence_score: number;
  hint?: string;
}

interface ApiQuizSession {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  score: number;
  attempts: Record<string, string>;
  userId: string;
  createdAt: string;
  questions: Array<{
    id: string;
    questionIndex: number;
    questionText: string;
    options: string[];
    answer: string;
    difficulty: string;
    bloomLevel: string;
    aiConfidenceScore: number;
    hint?: string;
  }>;
}

interface HistoryQuiz {
  id: string;
  topic: string;
  subject: string;
  difficulty: string;
  bloomLevel: string;
  questions: GeneratedQuestion[];
  timeLimitSeconds: number;
  timeTakenSeconds: number;
  attempts: Record<number, string>;
  score: number;
  timestamp: number;
}

const TEMPLATES = [
  {
    id: 't1',
    title: 'Algebra & Polynomials',
    subject: 'MATHEMATICS',
    topic: 'Quadratic equations and polynomials',
    description: 'Quadratic equations, polynomials, and complex numbers with step-by-step AI hints.',
    qCount: 124,
    icon: <Calculator className="w-5 h-5 text-amber-600" />,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 't2',
    title: 'Thermodynamics & Heat',
    subject: 'PHYSICS',
    topic: 'Heat transfer and entropy',
    description: 'Heat transfer, laws of thermodynamics, and entropy visualization challenges.',
    qCount: 86,
    icon: <Thermometer className="w-5 h-5 text-orange-600" />,
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: 't3',
    title: 'Modern World History',
    subject: 'HISTORY',
    topic: 'WWII to Digital Age',
    description: 'World War II to the Digital Age. Chronology, treaties, and thematic analysis.',
    qCount: 210,
    icon: <Globe className="w-5 h-5 text-blue-600" />,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 't4',
    title: 'Cellular Biology',
    subject: 'BIOLOGY',
    topic: 'Organelles and transcription',
    description: 'Micro-interactions, organelles, and genetic transcription practice questions.',
    qCount: 156,
    icon: <Microscope className="w-5 h-5 text-emerald-600" />,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

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

export default function PracticeDashboard() {
  const router = useRouter();

  const [history, setHistory] = useState<HistoryQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Real stats calculated strictly from actual history
  const [avgScore, setAvgScore] = useState(0);
  const [timePerQuest, setTimePerQuest] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  const mapSessionToHistory = (s: ApiQuizSession): HistoryQuiz => ({
    id: s.id,
    topic: s.topic,
    subject: s.subject,
    difficulty: s.difficulty,
    bloomLevel: s.bloomLevel,
    questions: (s.questions || []).map((q) => ({
      id: q.id,
      question_text: q.questionText,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      ai_confidence_score: q.aiConfidenceScore,
      hint: q.hint,
    })),
    timeLimitSeconds: s.timeLimitSeconds,
    timeTakenSeconds: s.timeTakenSeconds,
    attempts: (s.attempts || {}) as unknown as Record<number, string>,
    score: s.score,
    timestamp: new Date(s.createdAt).getTime(),
  });

  function calculateStats(data: HistoryQuiz[]) {
    if (data.length === 0) {
      setAvgScore(0);
      setTimePerQuest(0);
      setStreakDays(0);
      return;
    }

    let totalScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;
    let totalAttemptedQuestions = 0;

    data.forEach((q) => {
      totalScore += q.score;
      totalQuestions += q.questions.length;
      totalTime += q.timeTakenSeconds || 0;
      totalAttemptedQuestions += Object.keys(q.attempts).length;
    });

    const scorePct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    setAvgScore(scorePct);

    const tpq = totalAttemptedQuestions > 0 ? Math.round(totalTime / totalAttemptedQuestions) : 0;
    setTimePerQuest(tpq);

    // Calculate unique practice days
    const dates = data.map((q) => {
      const d = new Date(q.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const currentMs = currentDate.getTime();

    if (uniqueDates.includes(currentMs) || uniqueDates.includes(currentMs - 86400000)) {
      let checkMs = uniqueDates.includes(currentMs) ? currentMs : currentMs - 86400000;
      while (uniqueDates.includes(checkMs)) {
        streak++;
        checkMs -= 86400000;
      }
    }
    setStreakDays(streak);
  }

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiQuizSession[] }>('/generate/history');
      const mapped = (res.data.data || []).map(mapSessionToHistory);
      mapped.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(mapped);
      calculateStats(mapped);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleStartPractice = async (template: (typeof TEMPLATES)[0]) => {
    setGeneratingTemplateId(template.id);
    try {
      const count = 5;
      const res = await apiClient.post<{ success: boolean; data: GeneratedQuestion[] }>(
        '/generate/questions',
        {
          topic: template.topic,
          subject: template.subject,
          difficulty: 'MEDIUM',
          bloomLevel: 'APPLY',
          count,
        }
      );
      const questions = res.data.data;
      const timeLimit = count * 60;
      const newQuiz = {
        topic: template.topic,
        subject: template.subject,
        difficulty: 'MEDIUM',
        bloomLevel: 'APPLY',
        timeLimitSeconds: timeLimit,
        timeTakenSeconds: 0,
        score: 0,
        attempts: {},
        questions,
      };

      const saveRes = await apiClient.post<{ success: boolean; data: { id: string } }>(
        '/generate/session',
        newQuiz
      );
      router.push(`/student/practice/attempt?sessionId=${saveRes.data.data.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate practice module');
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Adaptive Practice & Quizzes
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Generate instant Bloom&apos;s taxonomy practice sessions or choose pre-calibrated topic templates</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsTemplateModalOpen(true)}
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <BookOpen className="size-4 mr-1.5 text-neutral-500" />
            Topic Templates
          </Button>
          <Button
            type="button"
            onClick={() => router.push('/student/practice/generate')}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
          >
            <Sparkles className="size-4 mr-1" />
            Generate Custom Quiz
          </Button>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Avg Accuracy */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Average Accuracy
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{avgScore}%</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {avgScore > 0 ? 'Quiz accuracy rate' : 'No quizzes completed'}
              </p>
            </div>
            <MetricBars values={avgScore > 0 ? [Math.max(10, avgScore - 15), avgScore, avgScore, avgScore] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Speed / Question */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Avg Speed
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{timePerQuest}s</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {timePerQuest > 0 ? 'Per question response' : 'Pacing metric'}
              </p>
            </div>
            <MetricBars values={timePerQuest > 0 ? [timePerQuest, timePerQuest, timePerQuest, timePerQuest] : [0, 0, 0, 0]} color="#3b82f6" />
          </div>
        </article>

        {/* Card 3: Practice Streak */}
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
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{streakDays} {streakDays === 1 ? 'Day' : 'Days'}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {streakDays > 0 ? '🔥 Active streak' : 'Take a quiz today'}
              </p>
            </div>
            <MetricBars values={streakDays > 0 ? [streakDays, streakDays, streakDays, streakDays] : [0, 0, 0, 0]} color="#f59e0b" />
          </div>
        </article>

        {/* Card 4: Quizzes Completed */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Completed Quizzes
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Award className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">{history.length}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Total practice sessions</p>
            </div>
            <MetricBars values={history.length > 0 ? [history.length, history.length, history.length, history.length] : [0, 0, 0, 0]} color="#8b5cf6" />
          </div>
        </article>
      </section>

      {/* ── 3. Topic Templates & History Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Topics (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Featured Study Modules</h2>
              <p className="text-xs text-neutral-500">Pre-calibrated practice sets from core syllabus</p>
            </div>
            <span className="text-xs font-semibold text-neutral-400">4 Modules Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-xl border border-neutral-200/90 bg-white hover:border-neutral-300 transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shadow-2xs">
                      {t.icon}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${t.badgeBg}`}>
                      {t.subject}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors mb-1">
                    {t.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" /> {t.qCount} Questions
                  </span>
                  <button
                    onClick={() => handleStartPractice(t)}
                    disabled={generatingTemplateId === t.id}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {generatingTemplateId === t.id ? 'Generating...' : 'Start Set'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Practice History (Span 1) */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-neutral-900">Recent Attempts</h2>
              <span className="text-xs text-neutral-400">History</span>
            </div>

            <div className="space-y-3 mb-4">
              {history.length > 0 ? (
                history.slice(0, 5).map((session) => {
                  const pct =
                    session.questions.length > 0
                      ? Math.round((session.score / session.questions.length) * 100)
                      : 0;
                  return (
                    <div
                      key={session.id}
                      onClick={() => router.push(`/student/practice/attempt?sessionId=${session.id}`)}
                      className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 bg-neutral-50/60 hover:bg-white transition-all cursor-pointer shadow-2xs group flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors truncate">
                          {session.topic}
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {new Date(session.timestamp).toLocaleDateString()} • {session.questions.length} Qs
                        </p>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          pct >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : pct >= 50
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-neutral-400">
                  No practice history recorded yet.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push('/student/practice/generate')}
            className="w-full py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold text-center transition-colors shadow-2xs block"
          >
            Create New Practice Set
          </button>
        </div>
      </div>

      {/* ── 4. Template Selection Modal ── */}
      <AnimatePresence>
        {isTemplateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-neutral-200 relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Quiz Templates</h3>
                  <p className="text-xs text-neutral-500">Select a pre-calibrated syllabus module to start</p>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {TEMPLATES.map((t) => (
                  <div
                    key={`modal-${t.id}`}
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      handleStartPractice(t);
                    }}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate">{t.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}