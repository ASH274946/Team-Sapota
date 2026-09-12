'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  Users,
  UserCheck,
  FileText,
  UploadCloud,
  Percent,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Plus,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absent: number;
  testsConducted: number;
  assignmentsCreated: number;
  averageClassScore: number;
  pendingEvaluations: number;
  recentTests?: any[];
  topStudents?: any[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/teacher/dashboard/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        } else {
          setError('Failed to load statistics');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const data = stats || {
    totalStudents: 0,
    presentToday: 0,
    absent: 0,
    testsConducted: 0,
    assignmentsCreated: 0,
    averageClassScore: 0,
    pendingEvaluations: 0,
    recentTests: [],
    topStudents: [],
  };

  const teacherName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Professor';

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-80 rounded-2xl lg:col-span-2" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Welcome back, {teacherName}
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Faculty Command Center • Real-Time Classroom Analytics & Assessment Overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/copilot"
            className="px-4 py-2.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#e05934]" />
            <span>AI Lesson Copilot</span>
          </Link>
          <Link
            href="/assignments/create"
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </Link>
        </div>
      </div>

      {/* 4-Card Primary Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'TOTAL STUDENTS',
            value: data.totalStudents,
            sub: `${data.presentToday} present today`,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'TESTS CONDUCTED',
            value: data.testsConducted,
            sub: `${data.assignmentsCreated} assignments created`,
            icon: FileText,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
          },
          {
            title: 'CLASS AVERAGE',
            value: `${data.averageClassScore}%`,
            sub: 'Overall academic score',
            icon: Percent,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'PENDING EVALUATIONS',
            value: data.pendingEvaluations,
            sub: 'Submissions awaiting review',
            icon: ClipboardList,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{m.title}</span>
                <div className={`w-8 h-8 rounded-xl ${m.bg} ${m.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">{m.value}</div>
                <div className="text-xs text-neutral-500 font-medium mt-1">{m.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Assessments & Top Performers */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Recent Test Statistics Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Recent Test Statistics</h3>
                <p className="text-xs text-neutral-500 font-medium">Live evaluation metrics and class average outcomes</p>
              </div>
              <Link
                href="/teacher/assessments"
                className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1"
              >
                <span>View All Assessments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {data.recentTests && data.recentTests.length > 0 ? (
                data.recentTests.map((test: any) => (
                  <div
                    key={test.id}
                    className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e05934] border border-orange-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 truncate">{test.name}</h4>
                        <p className="text-xs text-neutral-500">{test.date}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-neutral-900">{test.score}% Avg</div>
                      <span className="text-[11px] font-semibold text-emerald-600">Evaluated</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-xl bg-neutral-50/50 border border-neutral-100">
                  <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700">No published tests yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Create and publish assessments to monitor student class performance.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Student Performance Table Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Student Academic Standings</h3>
                <p className="text-xs text-neutral-500 font-medium">Real-time grade rankings and mastery progress</p>
              </div>
              <Link
                href="/teacher/insights"
                className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1"
              >
                <span>Analytics Insight</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {data.topStudents && data.topStudents.length > 0 ? (
                data.topStudents.map((student: any, idx: number) => (
                  <div
                    key={student.id || idx}
                    className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/60 hover:bg-neutral-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900">{student.name}</div>
                        <div className="text-xs text-neutral-500">Roll: {student.rollNo || `STU-${idx + 1}`}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-neutral-900">{student.average}%</div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Score</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Grade A
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-xl bg-neutral-50/50 border border-neutral-100">
                  <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700">No student scores recorded</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Student performance entries will populate as submissions are graded.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Operations */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-neutral-900">Faculty Operations</h3>
            <p className="text-xs text-neutral-500 font-medium">Quick links to high-frequency teaching workflows</p>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {[
                {
                  label: 'AI Lesson Copilot',
                  desc: 'Generate interactive lesson plans & Bloom matrices',
                  href: '/teacher/copilot',
                  icon: Sparkles,
                  color: 'text-[#e05934]',
                  bg: 'bg-orange-50',
                },
                {
                  label: 'Attendance Register',
                  desc: 'Take, mark, and lock daily class attendance',
                  href: '/teacher/attendance',
                  icon: UserCheck,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Create Assessment',
                  desc: 'Design AI-generated test papers and rubrics',
                  href: '/assignments/create',
                  icon: Plus,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  label: 'Student Study Groups',
                  desc: 'Manage peer clusters and collaborative groups',
                  href: '/teacher/groups',
                  icon: Users,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  label: 'Digital Resource Library',
                  desc: 'Upload PDFs, notes, and curriculum syllabus',
                  href: '/teacher/library',
                  icon: UploadCloud,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                },
                {
                  label: 'Classroom Announcements',
                  desc: 'Broadcast notices to all students and sections',
                  href: '/teacher/announcements',
                  icon: BookOpen,
                  color: 'text-rose-600',
                  bg: 'bg-rose-50',
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-200 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${action.bg} ${action.color} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors">
                          {action.label}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-medium">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
