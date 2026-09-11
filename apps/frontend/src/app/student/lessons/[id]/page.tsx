'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { LoadingState } from '@/design-system/LoadingState';
import { Button } from '@/components/ui/button';

interface LessonDetail {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  duration?: string;
  teacher?: string;
  objectives?: string[];
  sections?: Array<{
    title: string;
    content: string;
  }>;
  createdAt?: string;
}

export default function StudentLessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});

  const fetchLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: LessonDetail }>(`/student/lessons/${lessonId}`);
      setLesson(res.data.data);
    } catch {
      toast.error('Failed to load lesson module');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const toggleSection = (idx: number) => {
    setCompletedSections((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
    toast.success('Section progress updated!');
  };

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <LoadingState lines={8} />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 text-center py-20">
        <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-neutral-800">Lesson Module Not Found</h2>
        <p className="text-xs text-neutral-500 mt-1 mb-5">The requested lesson module could not be loaded.</p>
        <Link href="/student/lessons">
          <Button className="bg-neutral-900 text-white text-xs font-semibold">Back to Modules</Button>
        </Link>
      </div>
    );
  }

  const sections = lesson.sections || [];
  const objectives = lesson.objectives || [
    'Understand fundamental theory and real-world system architecture',
    'Demonstrate practical analytical reasoning across core questions',
    'Master Bloom’s cognitive criteria for syllabus examinations',
  ];
  const completedCount = Object.values(completedSections).filter(Boolean).length;
  const progressPct = sections.length > 0 ? Math.round((completedCount / sections.length) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col gap-6 text-slate-900 font-sans">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          <Link href="/student" className="hover:text-neutral-900 transition-colors">
            Student
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <Link href="/student/lessons" className="hover:text-neutral-900 transition-colors">
            Learning Modules
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          <span className="text-neutral-900 font-bold truncate max-w-[200px] sm:max-w-none">{lesson.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/student/tutor?topic=${encodeURIComponent(lesson.title)}`}>
            <Button
              type="button"
              className="h-9 rounded-xl px-3.5 text-xs font-bold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </Button>
          </Link>
          <Link href="/student/practice">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl px-3.5 text-xs font-bold border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Practice Quiz</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Module Hero Card ── */}
      <div className="p-6 md:p-8 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-orange-50 text-[#e05934] border border-orange-100">
              {lesson.subject}
            </span>
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {lesson.duration || '45 Mins'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium max-w-2xl">
            {lesson.chapter || 'Comprehensive interactive syllabus lesson plan with AI study diagnostics.'}
          </p>
        </div>

        {/* Progress gauge */}
        <div className="w-full md:w-64 p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between gap-2">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-700">
            <span>Module Completion</span>
            <span className="text-[#e05934]">{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-neutral-400">
            {completedCount} of {sections.length} units completed
          </span>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lesson Content (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objectives Box */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-neutral-900">Learning Objectives</h2>
            </div>
            <ul className="space-y-2.5">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-neutral-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e05934] mt-2 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Structured Units & Sections */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-neutral-900">Course Materials & Breakdown</h2>

            {sections.map((section, idx) => {
              const isCompleted = !!completedSections[idx];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-6 rounded-2xl bg-white border transition-all shadow-xs ${
                    isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-neutral-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-base font-bold text-neutral-900">{section.title}</h3>
                    <button
                      type="button"
                      onClick={() => toggleSection(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Completed' : 'Mark as Read'}</span>
                    </button>
                  </div>
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-medium">
                    {section.content}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Instructor & AI Study Helper */}
        <div className="space-y-6">
          {/* AI Helper Widget */}
          <div className="p-6 rounded-2xl bg-linear-to-br from-orange-50 via-white to-amber-50/40 border border-orange-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e05934] text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">AI Concept Tutor</h3>
                <p className="text-[11px] text-neutral-500">24/7 Socratic question answering</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 font-medium leading-relaxed">
              Confused about any theorem, SQL query, or architecture in this lesson? Ask your AI Tutor for step-by-step guidance.
            </p>
            <Link href={`/student/tutor?topic=${encodeURIComponent(lesson.title)}`}>
              <Button
                type="button"
                className="w-full h-9 rounded-xl text-xs font-bold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
              >
                Launch Tutor for this Lesson
              </Button>
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">Next Steps</h3>
            <div className="space-y-2">
              <Link
                href="/student/practice"
                className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 transition-all flex items-center justify-between text-xs font-bold text-neutral-800"
              >
                <span>Take Diagnostic Quiz</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/student/study-plan"
                className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 transition-all flex items-center justify-between text-xs font-bold text-neutral-800"
              >
                <span>View Daily Study Plan</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
              <Link
                href="/student/assessments"
                className="p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 transition-all flex items-center justify-between text-xs font-bold text-neutral-800"
              >
                <span>Check Upcoming Exams</span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
