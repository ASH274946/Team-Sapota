'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  courseTitle: string;
  originalDate: string;
  teacherId: string;
}

export function RescheduleModal({ isOpen, onClose, assessmentId, courseTitle, originalDate, teacherId }: RescheduleModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const charCount = reason.length;
  const isValid = date && time && charCount >= 20 && charCount <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await api.post('/student/reschedule', {
        courseId: assessmentId,
        teacherId,
        originalDate,
        preferredDate: new Date(`${date}T${time}`).toISOString(),
        preferredTime: time,
        reason
      });

      if (res.data?.success) {
        toast.success('Reschedule request submitted successfully!');
        onClose();
      } else {
        toast.error(res.data?.error || 'Failed to submit request');
      }
    } catch (err) {
      toast.error('An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Request Reschedule</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assessment</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 font-medium border border-gray-100">
                  {courseTitle}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Original Date</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2 border border-gray-100">
                    <Calendar size={16} />
                    {new Date(originalDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preferred Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Reason for Reschedule</label>
                  <span className={`text-xs font-medium ${charCount < 20 || charCount > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {charCount}/500
                  </span>
                </div>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to reschedule (min 20 characters)..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px] resize-y bg-white"
                />
                {charCount > 0 && charCount < 20 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} /> Minimum 20 characters required
                  </p>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
