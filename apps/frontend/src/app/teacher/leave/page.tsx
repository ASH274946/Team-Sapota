'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Clock,
  FileText,
  Check,
  X,
} from 'lucide-react';

interface LeaveApplication {
  id: string;
  title: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  duration: string;
  createdAt: string;
  student: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function TeacherLeaveRequestsPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: LeaveApplication[] }>('/attendance/teacher/leave');
      setLeaves(res.data.data || []);
    } catch {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/attendance/teacher/leave/${id}/status`, { status: newStatus });
      toast.success(`Leave request ${newStatus.toLowerCase()}`);
      fetchLeaves();
    } catch {
      toast.error('Failed to update leave request');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'ALL') return leaves;
    return leaves.filter((l) => l.status === filter);
  }, [leaves, filter]);

  const counts = useMemo(() => {
    return {
      all: leaves.length,
      pending: leaves.filter((l) => l.status === 'PENDING').length,
      approved: leaves.filter((l) => l.status === 'APPROVED').length,
      rejected: leaves.filter((l) => l.status === 'REJECTED').length,
    };
  }, [leaves]);

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Student Leave Applications
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Review, authorize, or decline student absence applications and medical notes
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ALL APPLICATIONS</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{counts.all}</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-amber-600 uppercase">PENDING REVIEW</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{counts.pending}</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">APPROVED</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{counts.approved}</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase">DECLINED</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{counts.rejected}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filter === tab
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-white border border-neutral-200/90 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {tab} ({counts[tab.toLowerCase() as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center">
          <FileText className="w-10 h-10 text-neutral-300 mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No Leave Requests</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            There are no student leave applications matching the selected status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((leave, idx) => (
            <motion.div
              key={leave.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 md:p-6 shadow-xs flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {leave.student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">{leave.student.name}</h4>
                    <p className="text-xs text-neutral-500 font-medium">{leave.student.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration: {leave.duration}</span>
                  </span>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      leave.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : leave.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {leave.status}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-bold text-neutral-900">{leave.title || leave.subject}</h5>
                <p className="text-xs text-neutral-600 leading-relaxed mt-1 whitespace-pre-wrap">{leave.body}</p>
              </div>

              {leave.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Leave</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
