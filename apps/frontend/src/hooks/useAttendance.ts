import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'NONE';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  status: AttendanceStatus;
}

/**
 * Parse a YYYY-MM-DD date string as local date (avoids UTC off-by-one issues).
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useAttendance(date: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  // isLocked = true only if the date is in the PAST (before today)
  const [isLocked, setIsLocked] = useState(false);
  // isFutureDate = true if date is after today (can view but not save)
  const [isFutureDate, setIsFutureDate] = useState(false);
  // isSaved = true if attendance has already been saved for this date+subject
  const [isSaved, setIsSaved] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const selectedDate = parseLocalDate(date);
      const today = getTodayLocal();

      const isPast = selectedDate < today;
      const isFuture = selectedDate > today;

      setIsLocked(isPast);
      setIsFutureDate(isFuture);

      const [studentsRes, attendanceRes] = await Promise.all([
        api.get('/teacher/students'),
        api.get(`/teacher/attendance?date=${date}`)
      ]);

      if (studentsRes.data?.success) {
        const studentList = studentsRes.data.data;
        const records: any[] = attendanceRes.data?.data || [];

        const merged = studentList.map((s: Omit<Student, 'status'>) => {
          const existingRecord = records.find((r: any) => r.studentId === s.id);
          return {
            ...s,
            status: existingRecord ? existingRecord.status : 'NONE'
          };
        });

        setStudents(merged);
        // Mark isSaved if any records already exist for this date
        setIsSaved(records.length > 0);
      }
    } catch (err) {
      toast.error('Failed to load data for the selected date');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const setStatus = (id: string, status: AttendanceStatus) => {
    if (isLocked) {
      toast.error('Attendance for past dates cannot be modified without admin permission.');
      return;
    }
    if (isFutureDate) {
      toast.error('Cannot mark attendance for a future date.');
      return;
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    if (isLocked) {
      toast.error('Attendance for past dates cannot be modified without admin permission.');
      return;
    }
    if (isFutureDate) {
      toast.error('Cannot mark attendance for a future date.');
      return;
    }
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const saveAttendance = async (subject: string) => {
    if (isLocked) {
      toast.error('Attendance for this date is locked. Contact admin to make changes.');
      return false;
    }
    if (isFutureDate) {
      toast.error('Cannot save attendance for a future date.');
      return false;
    }

    const unrecorded = students.filter(s => s.status === 'NONE').length;
    if (unrecorded > 0) {
      toast.error(`Please record attendance for all students (${unrecorded} remaining).`);
      return false;
    }

    try {
      await api.post('/teacher/attendance', {
        date,
        subject,
        records: students.map(s => ({
          studentId: s.id,
          status: s.status
        }))
      });
      toast.success(isSaved ? 'Attendance updated successfully' : 'Attendance saved successfully');
      setIsSaved(true);
      return true;
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Attendance for this date has been finalized. Admin permission required.');
        setIsLocked(true);
      } else {
        toast.error('Failed to save attendance');
      }
      return false;
    }
  };

  return {
    students,
    loading,
    isLocked,
    isFutureDate,
    isSaved,
    setStatus,
    setAllStatus,
    saveAttendance,
    refresh: fetchAttendance
  };
}
