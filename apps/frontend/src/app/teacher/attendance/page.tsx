'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Users,
  Lock,
  Save,
} from 'lucide-react';
import { useAttendance, AttendanceStatus } from '@/hooks/useAttendance';

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Computer Science 101');
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    students,
    loading,
    isLocked,
    setStatus,
    setAllStatus,
    saveAttendance,
  } = useAttendance(date);

  const handleSaveClick = () => {
    if (isLocked) return;
    const unrecorded = students.filter((s) => s.status === 'NONE').length;
    if (unrecorded > 0) {
      saveAttendance(subject);
      return;
    }
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    await saveAttendance(subject);
  };

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const excusedCount = students.filter((s) => s.status === 'EXCUSED').length;
  const unrecordedCount = students.filter((s) => s.status === 'NONE').length;
  const totalCount = students.length;

  const attendanceRate =
    totalCount > 0
      ? Math.round(((presentCount + lateCount + excusedCount) / totalCount) * 100)
      : 0;

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Greeting & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Class Attendance Register
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Record, mark, and synchronize daily or lecture-specific attendance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLocked ? (
            <span className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center gap-2">
              <Lock className="w-4 h-4" /> Attendance Finalized
            </span>
          ) : (
            <button
              onClick={handleSaveClick}
              className="px-5 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save & Finalize Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Date & Class Filter Bar + Metric Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">DATE SELECTOR</span>
          <div className="flex items-center gap-2 mt-2">
            <CalendarIcon className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">TOTAL ENROLLED</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{totalCount}</div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">PRESENT</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{presentCount}</div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase">ABSENT</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">{absentCount}</div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ATTENDANCE RATE</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{attendanceRate}%</div>
        </div>
      </div>

      {/* Main Student Attendance Roster */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Student Roll Call</h3>
            <p className="text-xs text-neutral-500 font-medium">Mark status individually or apply fast batch actions</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllStatus('PRESENT')}
              disabled={isLocked}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors disabled:opacity-50"
            >
              Mark All Present
            </button>
            <button
              onClick={() => setAllStatus('ABSENT')}
              disabled={isLocked}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors disabled:opacity-50"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-neutral-300 mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No Students Enrolled</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              There are no enrolled students registered in this section or subject roster.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {students.map((student, idx) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">{student.name}</div>
                    <div className="text-[11px] text-neutral-400">Roll: {student.rollNo || `ID-${student.id.slice(0, 5)}`}</div>
                  </div>
                </div>

                {/* Status Selector Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {[
                    { key: 'PRESENT', label: 'Present', activeCls: 'bg-emerald-500 text-white font-bold' },
                    { key: 'ABSENT', label: 'Absent', activeCls: 'bg-rose-500 text-white font-bold' },
                    { key: 'LATE', label: 'Late', activeCls: 'bg-amber-500 text-white font-bold' },
                    { key: 'EXCUSED', label: 'Excused', activeCls: 'bg-blue-500 text-white font-bold' },
                  ].map((s) => {
                    const isSelected = student.status === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={isLocked}
                        onClick={() => setStatus(student.id, s.key as AttendanceStatus)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? s.activeCls
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                        } disabled:opacity-50`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Confirm Attendance Submission</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              You are about to save attendance records for <strong>{students.length} students</strong> on <strong>{date}</strong>.
              Present: {presentCount}, Absent: {absentCount}, Late: {lateCount}.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
