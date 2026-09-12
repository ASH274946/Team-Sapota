import { useState, useCallback, useEffect } from 'react';
import { classInsightService } from '@/services/class-insight.service';
import toast from 'react-hot-toast';

export interface ClassInfo {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
}

export interface StudentInsight {
  id: string;
  name: string;
  rollNo: string;
  attendanceRate: number;
  assignmentCompletionRate: number;
  averageGrade: number | null;
  isAtRisk: boolean;
}

export interface DashboardInsights {
  overview: {
    totalStudents: number;
    attendanceRate: number;
    assignmentCompletionRate: number;
    averageGrade: number;
    activeStudents: number;
    atRiskCount: number;
  };
  trends: {
    attendance: { date: string; rate: number }[];
    submissions: { date: string; submissions: number }[];
  };
  studentInsights: StudentInsight[];
}

export function useClassInsights() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardInsights | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await classInsightService.getAssignedClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].id);
      }
    } catch (e) {
      toast.error('Failed to load assigned classes');
      setError('Could not load classes');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const fetchDashboard = useCallback(async (classId: string) => {
    if (!classId) return;
    try {
      setLoadingDashboard(true);
      setError(null);
      const data = await classInsightService.getDashboardInsights(classId);
      setDashboardData(data);
    } catch (e) {
      toast.error('Failed to load class insights dashboard');
      setError('Could not load dashboard for this class');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClassId) {
      fetchDashboard(selectedClassId);
    }
  }, [selectedClassId, fetchDashboard]);

  return {
    classes,
    selectedClassId,
    setSelectedClassId,
    dashboardData,
    loadingClasses,
    loadingDashboard,
    error,
    refresh: () => {
      if (selectedClassId) fetchDashboard(selectedClassId);
    }
  };
}
