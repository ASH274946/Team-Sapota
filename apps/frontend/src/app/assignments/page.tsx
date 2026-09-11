'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Clock,
  ChevronRight,
  Plus,
  Star,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Assignment } from '@/types/assignment.types';

const STATUS_BADGES: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-purple-50 text-purple-700 border-purple-200',
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/assignments?limit=100');
      const list: Assignment[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray((res.data as any)?.data?.assignments)
        ? (res.data as any).data.assignments
        : Array.isArray(res.data)
        ? (res.data as any)
        : [];
      setAssignments(list);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStudent) {
      router.replace('/student/assessments');
      return;
    }
    fetchAssignments();
  }, [isStudent, router, fetchAssignments]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.subject.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        selectedStatus === 'ALL' || a.status.toUpperCase() === selectedStatus.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, selectedStatus]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
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
            Assignment Management
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Author, review, publish, and monitor question papers and exams across all sections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/assignments/create"
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Assignment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'ALL ASSIGNMENTS', value: assignments.length, color: 'text-neutral-900' },
          {
            label: 'PUBLISHED & ACTIVE',
            value: assignments.filter((a) => ['PUBLISHED', 'ACTIVE'].includes(a.status)).length,
            color: 'text-emerald-600',
          },
          {
            label: 'PENDING APPROVAL',
            value: assignments.filter((a) => a.status === 'PENDING_APPROVAL').length,
            color: 'text-amber-600',
          },
          {
            label: 'DRAFTS',
            value: assignments.filter((a) => a.status === 'DRAFT').length,
            color: 'text-purple-600',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">{stat.label}</span>
            <div className={`text-2xl font-extrabold mt-2 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, subject, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PUBLISHED', 'PENDING_APPROVAL', 'APPROVED', 'DRAFT'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200/90 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center text-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold">Failed to load assignments</h3>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center">
          <FileText className="w-10 h-10 text-neutral-300 mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No Assignments Found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            {search || selectedStatus !== 'ALL'
              ? 'No assignments match the active search or filter criteria.'
              : 'Create your first assessment paper using AI question generation.'}
          </p>
          <Link
            href="/assignments/create"
            className="mt-5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((assignment, idx) => {
            const badgeCls = STATUS_BADGES[assignment.status] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-neutral-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#e05934] border border-orange-100">
                      {assignment.subject}
                    </span>
                    <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeCls}`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 leading-snug line-clamp-2">
                    {assignment.title}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1.5 font-medium">
                    {assignment.description || `Assessment paper covering key curriculum topics in ${assignment.subject}.`}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{assignment.duration}m</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>{assignment.totalMarks} Marks</span>
                    </span>
                  </div>

                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
