'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
  Loader2,
  X,
  Layers,
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/Pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ── Interfaces ──
interface ClassRecord {
  id: string;
  grade: string;
  section: string;
  academicYear: string;
  facultyId?: string;
  faculty?: { firstName?: string; lastName?: string; email?: string } | null;
  _count?: { students: number };
}

// ── Subcomponents ──

function MetricBars({
  values,
  color = '#0284c7',
}: {
  values: number[];
  color?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 w-12 shrink-0 items-end justify-between gap-1">
      {values.map((val, idx) => (
        <span
          key={idx}
          className="w-1.5 rounded-t-xs transition-all duration-300"
          style={{
            height: `${Math.max((val / max) * 100, 15)}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendType?: 'positive' | 'warning' | 'neutral' | 'danger';
  icon: React.ComponentType<{ className?: string }>;
  bars: number[];
  color: string;
}

function MetricCard({
  title,
  value,
  trend,
  trendType = 'positive',
  icon: Icon,
  bars,
  color,
}: MetricCardProps) {
  return (
    <div className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {title}
        </h3>
        <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold flex items-center gap-1',
              trendType === 'positive' && 'text-emerald-600',
              trendType === 'warning' && 'text-amber-600',
              trendType === 'danger' && 'text-red-600',
              trendType === 'neutral' && 'text-neutral-500'
            )}
          >
            {trendType === 'positive' && <TrendingUp className="size-3.5" />}
            {trendType === 'warning' && <AlertCircle className="size-3.5" />}
            {trendType === 'danger' && <AlertCircle className="size-3.5" />}
            <span>{trend}</span>
          </p>
        </div>

        <MetricBars values={bars} color={color} />
      </div>
    </div>
  );
}

export default function ClassesManagement() {
  const [list, setList] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStart, setBulkStart] = useState('1');
  const [bulkEnd, setBulkEnd] = useState('12');

  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [viewingClass, setViewingClass] = useState<ClassRecord | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const [analytics, setAnalytics] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { activeOrganizationId } = useAdminAuthStore();

  const loadData = async (isInitial = false) => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const [res, analyticsRes] = await Promise.all([
        api.get(`/admin/classrooms${queryParams}`),
        api.get(`/admin/analytics/dashboard${queryParams}`).catch(() => null),
      ]);

      if (res.data?.success) {
        setList(res.data.data || []);
        if (isInitial && res.data.data.length === 0) {
          setShowBulkModal(true);
        }
      }
      if (analyticsRes?.data?.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [activeOrganizationId]);

  const handleOpenCreate = () => {
    setModalType('create');
    setSelectedClass(null);
    setGrade('');
    setSection('A');
    setAcademicYear(new Date().getFullYear().toString());
    setShowModal(true);
  };

  const handleOpenEdit = (c: ClassRecord) => {
    setModalType('edit');
    setSelectedClass(c);
    setGrade(c.grade);
    setSection(c.section);
    setAcademicYear(c.academicYear || new Date().getFullYear().toString());
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class section? Associated students will be unassigned.')) return;
    const toastId = toast.loading('Deleting class...');
    setActionLoading(id);
    try {
      const res = await api.delete(`/admin/classrooms/${id}`);
      if (res.data?.success) {
        toast.success('Class deleted successfully', { id: toastId });
        loadData();
      } else {
        toast.error('Failed to delete class.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Deletion failed', { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !section) {
      toast.error('Grade and Section are required.');
      return;
    }
    const payload = {
      grade: grade.trim(),
      section: section.trim().toUpperCase(),
      academicYear: academicYear.trim(),
    };

    setSubmitting(true);
    const toastId = toast.loading(modalType === 'create' ? 'Creating class...' : 'Updating class...');
    try {
      if (modalType === 'create') {
        const res = await api.post('/admin/classrooms', payload);
        if (res.data?.success) {
          toast.success('Class created successfully', { id: toastId });
          setShowModal(false);
          loadData();
        }
      } else if (selectedClass) {
        const res = await api.put(`/admin/classrooms/${selectedClass.id}`, payload);
        if (res.data?.success) {
          toast.success('Class updated successfully', { id: toastId });
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);
    if (isNaN(start) || isNaN(end) || start > end) {
      toast.error('Invalid range for bulk creation.');
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading('Generating classes...');
    try {
      const res = await api.post('/admin/classrooms/bulk', {
        startGrade: start,
        endGrade: end,
        sections: ['A'],
        academicYear,
      });
      if (res.data?.success) {
        toast.success(`Successfully created ${res.data.data?.length || 0} classes!`, { id: toastId });
        setShowBulkModal(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk creation failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewStudents = async (c: ClassRecord) => {
    setViewingClass(c);
    setShowStudentsModal(true);
    setStudentsLoading(true);
    try {
      const res = await api.get('/admin/students');
      if (res.data?.success) {
        const filtered = (res.data.data || []).filter((s: any) => s.classId === c.id || s.classroom?.id === c.id);
        setClassStudents(filtered);
        setStudentSearch('');
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Filter & Sort
  const filteredList = list.filter(
    (c) =>
      (c.grade || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.section || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.academicYear || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.faculty?.firstName || '').toLowerCase().includes(search.toLowerCase())
  );

  const sortedList = [...filteredList].sort((a, b) => {
    const numA = parseInt(a.grade);
    const numB = parseInt(b.grade);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA === numB) return (a.section || '').localeCompare(b.section || '');
      return numA - numB;
    }
    return (a.grade || '').localeCompare(b.grade || '');
  });

  const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
  const paginatedList = sortedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filteredClassStudents = classStudents.filter(
    (s) =>
      `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const totalClasses = analytics?.totalClasses || list.length || 0;
  const totalStudents = analytics?.totalStudents || 0;
  const totalFaculty = analytics?.totalFaculty || 0;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* ── 1. Page Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Class Management
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Calendar className="size-4 text-neutral-400" />
            <span>{todayFormatted}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500 font-normal">
              Manage classrooms, grade sections, and student rosters
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBulkModal(true)}
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Layers className="size-4 mr-1.5 text-neutral-500" />
            Bulk Create
          </Button>

          <Button
            type="button"
            onClick={handleOpenCreate}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            Add Class
          </Button>
        </div>
      </section>

      {/* ── 2. Top 4 Metric Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Classes"
          value={totalClasses}
          trend={`${totalClasses} active sections`}
          trendType="positive"
          icon={BookOpen}
          bars={[
            Math.max(1, totalClasses - 3),
            Math.max(1, totalClasses - 2),
            totalClasses,
            totalClasses,
            totalClasses,
            Math.max(1, totalClasses),
          ]}
          color="#0284c7"
        />

        <MetricCard
          title="Active Students"
          value={totalStudents}
          trend={`${totalStudents} enrolled students`}
          trendType="positive"
          icon={Users}
          bars={[
            Math.max(1, totalStudents - 4),
            Math.max(1, totalStudents - 2),
            totalStudents,
            totalStudents,
            totalStudents,
            Math.max(1, totalStudents),
          ]}
          color="#10b981"
        />

        <MetricCard
          title="Assigned Faculty"
          value={totalFaculty}
          trend={`${totalFaculty} department faculty`}
          trendType="positive"
          icon={GraduationCap}
          bars={[
            Math.max(1, totalFaculty - 2),
            totalFaculty,
            totalFaculty,
            totalFaculty,
            totalFaculty,
            Math.max(1, totalFaculty),
          ]}
          color="#8b5cf6"
        />

        <MetricCard
          title="Academic Session"
          value={academicYear}
          trend="Current Term 2026-27"
          trendType="neutral"
          icon={Calendar}
          bars={[1, 1, 1, 1, 1, 1]}
          color="#f59e0b"
        />
      </section>

      {/* ── 3. Main Classes Table Card ── */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-0 shadow-xs overflow-hidden min-h-[660px] flex flex-col justify-between">
        {/* Table Filter Header & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-neutral-900">Class Roster</h2>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
              {list.length} sections
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search grade or section..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-xs font-medium text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20 min-h-[500px]">
            <div className="flex flex-col items-center gap-2.5">
              <Loader2 size={32} className="animate-spin text-neutral-800" />
              <span className="text-neutral-500 text-xs font-medium">Loading classroom records...</span>
            </div>
          </div>
        ) : sortedList.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 px-6 text-center min-h-[500px]">
            <div className="size-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="size-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">No classes configured</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first grade and section, or use Bulk Create to configure Grades 1-12.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col justify-between min-h-[520px]">
            <table className="w-full min-w-[700px] table-fixed text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 h-10">
                  <th className="w-[30%] px-5 py-2.5">Class / Grade</th>
                  <th className="w-[20%] px-4 py-2.5">Section</th>
                  <th className="w-[20%] px-4 py-2.5">Academic Year</th>
                  <th className="w-[18%] px-4 py-2.5">Enrolled Students</th>
                  <th className="w-[12%] px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedList.map((c) => {
                  const studentCount = c._count?.students ?? 0;
                  return (
                    <tr
                      key={c.id}
                      className="h-[60px] transition-colors hover:bg-neutral-50/70 cursor-pointer"
                      onClick={() => handleViewStudents(c)}
                    >
                      {/* Grade & Icon */}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-xl bg-neutral-100 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200">
                            {c.grade}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">
                              Grade {c.grade}
                            </p>
                            <p className="text-[11px] text-neutral-400 font-medium truncate mt-0.5">
                              Section {c.section}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700 border border-neutral-200">
                          Section {c.section}
                        </span>
                      </td>

                      {/* Academic Year */}
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-neutral-700">
                          {c.academicYear || '2026-27'}
                        </span>
                      </td>

                      {/* Students Count */}
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStudents(c);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100 transition-colors"
                        >
                          <Users className="size-3.5" />
                          <span>{studentCount} Students</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewStudents(c)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer"
                            title="View Students"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit Class"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === c.id}
                            onClick={() => handleDelete(c.id)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            title="Delete Class"
                          >
                            {actionLoading === c.id ? (
                              <Loader2 className="size-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Spacer */}
            <div className="flex-1 min-h-0" />

            {/* Pagination Footer */}
            <div className="mt-auto px-5 py-3 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3 bg-white h-13 shrink-0">
              <p className="text-xs text-neutral-500 font-medium">
                Showing {Math.min(itemsPerPage, sortedList.length - (currentPage - 1) * itemsPerPage)} of {sortedList.length} classes
              </p>
              <div className="max-w-[280px]">
                <Pagination
                  totalPages={totalPages || 1}
                  value={currentPage}
                  onChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Students In Class Drawer ── */}
      <Sheet open={showStudentsModal} onOpenChange={setShowStudentsModal}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-white border-l border-neutral-200"
        >
          {viewingClass && (
            <div className="flex flex-col h-full">
              <header className="border-b border-neutral-100 p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Enrolled Students
                </span>
                <SheetTitle className="text-lg font-bold text-neutral-900 mt-1">
                  Grade {viewingClass.grade} — Section {viewingClass.section}
                </SheetTitle>
                <SheetDescription className="text-xs text-neutral-500 mt-0.5">
                  Academic Year {viewingClass.academicYear || '2026-27'}
                </SheetDescription>
              </header>

              <div className="p-4 border-b border-neutral-100">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filter students by name, email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-neutral-500" />
                  </div>
                ) : filteredClassStudents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-500">
                    No students currently assigned to this section.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                    {filteredClassStudents.map((s) => (
                      <div key={s.id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-neutral-900">
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text-[11px] text-neutral-500">{s.email}</p>
                        </div>
                        {s.rollNo && (
                          <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                            Roll #{s.rollNo}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <footer className="border-t border-neutral-100 p-4 bg-neutral-50/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStudentsModal(false)}
                  className="w-full h-9.5 rounded-xl text-xs font-bold border-neutral-200 hover:bg-neutral-100"
                >
                  Close
                </Button>
              </footer>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 5. Add / Edit Class Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-1">
              {modalType === 'create' ? 'Add New Class' : 'Edit Class Section'}
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Enter grade and section specifications.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Grade *
                  </label>
                  <input
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                    placeholder="e.g. 10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Section *
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                    placeholder="e.g. A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                  placeholder="2026-27"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
                >
                  {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  {submitting ? 'Saving...' : modalType === 'create' ? 'Create Class' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Bulk Create Modal ── */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Bulk Create Classes
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Quickly generate grade sections 1 through 12.
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Start Grade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    End Grade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
              >
                {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
                Generate Classes
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
