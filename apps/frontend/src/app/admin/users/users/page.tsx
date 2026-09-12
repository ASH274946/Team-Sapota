'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Upload,
  X,
  Mail,
  User as UserIcon,
  Loader2,
  Building2,
  GraduationCap,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Eye,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { Avatar, AvatarFallback } from '@/components/base-ui/avatar';
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
interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  organization?: { id: string; name: string; email?: string; code?: string } | null;
  department?: { id: string; name: string } | null;
  createdAt: string;
  phone?: string;
}

interface Organization {
  id: string;
  name: string;
  email?: string;
  code?: string;
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

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState<'FACULTY' | 'STUDENT' | 'ALL'>('FACULTY');
  const [facultyList, setFacultyList] = useState<UserRecord[]>([]);
  const [studentList, setStudentList] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Slide-overs
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [drawerUser, setDrawerUser] = useState<UserRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  const { activeOrganizationId } = useAdminAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const selectedOrg = organizations.find((o) => o.id === activeOrganizationId);
  const domain = selectedOrg?.email ? selectedOrg.email.split('@')[1] : 'spec.com';

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const [facRes, stuRes, orgsRes] = await Promise.all([
        api.get(`/admin/faculty${queryParams}`),
        api.get(`/admin/students${queryParams}`),
        api.get('/admin/organizations').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (facRes.data?.success) setFacultyList(facRes.data.data || []);
      if (stuRes.data?.success) setStudentList(stuRes.data.data || []);
      if (orgsRes.data?.success) setOrganizations(orgsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load user records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeOrganizationId]);

  const handleOpenCreate = (targetRole?: 'TEACHER' | 'STUDENT') => {
    setModalType('create');
    setSelectedUser(null);
    setFirstName('');
    setLastName('');
    setEmailPrefix('');
    setUserRole(targetRole || (activeTab === 'STUDENT' ? 'STUDENT' : 'TEACHER'));
    setShowModal(true);
  };

  const handleOpenEdit = (u: UserRecord) => {
    setModalType('edit');
    setSelectedUser(u);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setEmailPrefix(u.email.split('@')[0] || '');
    setUserRole(u.role === 'STUDENT' ? 'STUDENT' : 'TEACHER');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailPrefix) {
      toast.error('First Name, Last Name, and Email Prefix are required.');
      return;
    }
    const fullEmail = `${emailPrefix.trim()}@${domain}`;
    const payload: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: fullEmail,
      role: userRole,
    };
    if (activeOrganizationId) payload.organizationId = activeOrganizationId;

    try {
      const endpoint = userRole === 'TEACHER' ? '/admin/faculty' : '/admin/students';
      setSubmitting(true);
      const toastId = toast.loading(modalType === 'create' ? 'Creating profile...' : 'Updating profile...');
      if (modalType === 'create') {
        const res = await api.post(endpoint, payload);
        if (res.data?.success) {
          toast.success(`${userRole === 'TEACHER' ? 'Faculty' : 'Student'} created successfully!`, { id: toastId });
          setShowModal(false);
          loadData();
        }
      } else if (selectedUser) {
        const res = await api.put(`${endpoint}/${selectedUser.id}`, payload);
        if (res.data?.success) {
          toast.success(`${userRole === 'TEACHER' ? 'Faculty' : 'Student'} updated successfully!`, { id: toastId });
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your organization?`)) return;
    const toastId = toast.loading('Removing user...');
    setActionLoading(id);
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const endpoint = '/admin/users';
      const res = await api.delete(`${endpoint}/${id}${queryParams}`);
      if (res.data?.success) {
        toast.success('User removed successfully.', { id: toastId });
        if (drawerUser?.id === id) setDrawerUser(null);
        loadData();
      } else {
        toast.error('Failed to remove user.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Deletion failed', { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const endpoint = activeTab === 'STUDENT' ? '/admin/students/import' : '/admin/faculty/import';
      const res = await api.post(`${endpoint}${queryParams}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success(`Import completed successfully!`);
        setShowImportModal(false);
        setCsvFile(null);
        loadData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    }
  };

  // Metrics
  const facultyCount = facultyList.length;
  const studentCount = studentList.length;
  const totalCount = facultyCount + studentCount;
  const allUsers = [...facultyList, ...studentList];
  const activeCount = allUsers.filter((u) => u.status === 'ACTIVE' || !u.status).length;

  // Active list based on tab
  const currentList = activeTab === 'FACULTY' ? facultyList : activeTab === 'STUDENT' ? studentList : allUsers;

  // Filter list based on search query
  const filteredList = currentList.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.organization?.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.department?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            User Management
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Calendar className="size-4 text-neutral-400" />
            <span>{todayFormatted}</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500 font-normal">
              Manage faculty, students, and institutional rosters
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Upload className="size-4 mr-1.5 text-neutral-500" />
            Bulk Import
          </Button>

          <Button
            type="button"
            onClick={() => handleOpenCreate()}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            Add {activeTab === 'STUDENT' ? 'Student' : 'Faculty'}
          </Button>
        </div>
      </section>

      {/* ── 2. Top 4 Metric Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Faculty"
          value={facultyCount}
          trend={`${facultyCount} active educators`}
          trendType="positive"
          icon={GraduationCap}
          bars={[
            Math.max(1, facultyCount - 3),
            Math.max(1, facultyCount - 2),
            Math.max(1, facultyCount - 1),
            facultyCount,
            facultyCount,
            Math.max(1, facultyCount),
          ]}
          color="#0284c7"
        />

        <MetricCard
          title="Total Students"
          value={studentCount}
          trend={`${studentCount} enrolled learners`}
          trendType="positive"
          icon={Users}
          bars={[
            Math.max(1, studentCount - 4),
            Math.max(1, studentCount - 2),
            studentCount,
            studentCount,
            studentCount,
            Math.max(1, studentCount),
          ]}
          color="#10b981"
        />

        <MetricCard
          title="Active Status"
          value={activeCount}
          trend={`${Math.round((activeCount / Math.max(totalCount, 1)) * 100)}% verified rate`}
          trendType="positive"
          icon={CheckCircle2}
          bars={[
            Math.max(1, activeCount - 2),
            activeCount,
            activeCount,
            activeCount,
            activeCount,
            Math.max(1, activeCount),
          ]}
          color="#8b5cf6"
        />

        <MetricCard
          title="Organization Domain"
          value={selectedOrg?.code || 'SPEC'}
          trend={`@${domain}`}
          trendType="neutral"
          icon={Building2}
          bars={[1, 1, 1, 1, 1, 1]}
          color="#f59e0b"
        />
      </section>

      {/* ── 3. Main Users Table Card ── */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-0 shadow-xs overflow-hidden min-h-[660px] flex flex-col justify-between">
        {/* Table Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-100 shrink-0">
          {/* Pill tab buttons */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('FACULTY');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'FACULTY'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Faculty ({facultyCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('STUDENT');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'STUDENT'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Students ({studentCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setCurrentPage(1);
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              All Users ({totalCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by name, email...`}
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
              <span className="text-neutral-500 text-xs font-medium">
                Loading {activeTab.toLowerCase()} records...
              </span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 px-6 text-center min-h-[500px]">
            <div className="size-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <UserIcon className="size-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">No users found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              No matching {activeTab.toLowerCase()} records found. Click &quot;Add User&quot; to create a new profile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col justify-between min-h-[520px]">
            <table className="w-full min-w-[700px] table-fixed text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 h-10">
                  <th className="w-[30%] px-5 py-2.5">User / Identity</th>
                  <th className="w-[26%] px-4 py-2.5">Email Address</th>
                  <th className="w-[14%] px-4 py-2.5">Organization</th>
                  <th className="w-[12%] px-4 py-2.5">Role</th>
                  <th className="w-[10%] px-4 py-2.5">Status</th>
                  <th className="w-[8%] px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedList.map((u) => {
                  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User Profile';
                  const initials = fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isTeacher = u.role === 'TEACHER' || u.role === 'FACULTY';

                  return (
                    <tr
                      key={u.id}
                      className="h-[60px] transition-colors hover:bg-neutral-50/70 cursor-pointer"
                      onClick={() => setDrawerUser(u)}
                    >
                      {/* Identity */}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-8 rounded-xl border border-neutral-200 shadow-2xs">
                            <AvatarFallback
                              className={cn(
                                'text-[11px] font-bold',
                                isTeacher
                                  ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">
                              {fullName}
                            </p>
                            <p className="text-[11px] text-neutral-400 font-medium truncate mt-0.5">
                              {u.department?.name || (isTeacher ? 'Academic Department' : 'Enrolled Student')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 text-neutral-700">
                          <Mail className="size-3.5 text-neutral-400 shrink-0" />
                          <span className="text-xs font-medium truncate">{u.email}</span>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 text-neutral-700">
                          <Building2 className="size-3.5 text-neutral-400 shrink-0" />
                          <span className="text-xs font-semibold text-neutral-800 truncate">
                            {u.organization?.code || u.organization?.name || selectedOrg?.code || 'SPEC'}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            isTeacher
                              ? 'bg-sky-50 text-sky-700 border border-sky-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          )}
                        >
                          {isTeacher ? 'Faculty' : 'Student'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            u.status === 'ACTIVE' || !u.status
                              ? 'bg-emerald-50 text-emerald-700'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          <span>{u.status || 'Active'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrawerUser(u)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === u.id}
                            onClick={() => handleDelete(u.id, fullName)}
                            className="size-7.5 rounded-lg p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                            title="Remove User"
                          >
                            {actionLoading === u.id ? (
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
                Showing {Math.min(itemsPerPage, filteredList.length - (currentPage - 1) * itemsPerPage)} of {filteredList.length} accounts
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

      {/* ── 4. Slide-Over User Profile Drawer ── */}
      <Sheet open={!!drawerUser} onOpenChange={(open) => !open && setDrawerUser(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-white border-l border-neutral-200"
        >
          {drawerUser && (
            <div className="flex flex-col h-full">
              <header className="border-b border-neutral-100 p-6 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Account Profile
                  </span>
                  <SheetTitle className="text-lg font-bold text-neutral-900 mt-1">
                    {drawerUser.firstName} {drawerUser.lastName}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-neutral-500 mt-0.5">
                    {drawerUser.email}
                  </SheetDescription>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Identity Summary Card */}
                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 rounded-xl border border-neutral-200 shadow-xs">
                      <AvatarFallback className="text-sm font-bold bg-neutral-900 text-white">
                        {`${drawerUser.firstName[0] || ''}${drawerUser.lastName[0] || ''}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">
                        {drawerUser.firstName} {drawerUser.lastName}
                      </p>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        {drawerUser.role === 'TEACHER' ? 'Faculty Instructor' : 'Enrolled Student'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    User Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                      <p className="text-[11px] text-neutral-500 font-medium">Role Type</p>
                      <p className="text-sm font-bold text-neutral-900 mt-1">
                        {drawerUser.role === 'TEACHER' ? 'Teacher' : 'Student'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                      <p className="text-[11px] text-neutral-500 font-medium">Status</p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {drawerUser.status || 'Active'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                      <p className="text-[11px] text-neutral-500 font-medium">Organization</p>
                      <p className="text-sm font-bold text-neutral-900 mt-1 truncate">
                        {drawerUser.organization?.name || selectedOrg?.name || 'SPEC'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                      <p className="text-[11px] text-neutral-500 font-medium">Registered</p>
                      <p className="text-sm font-bold text-neutral-900 mt-1">
                        {formatDate(drawerUser.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <footer className="border-t border-neutral-100 p-4 bg-neutral-50/50 flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleOpenEdit(drawerUser);
                    setDrawerUser(null);
                  }}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-neutral-200 hover:bg-neutral-100"
                >
                  <Edit3 className="size-3.5 mr-1.5" />
                  Edit Profile
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDelete(drawerUser.id, `${drawerUser.firstName} ${drawerUser.lastName}`)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Remove Account
                </Button>
              </footer>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 5. Add / Edit User Modal ── */}
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
              {modalType === 'create'
                ? `Add New ${userRole === 'TEACHER' ? 'Faculty' : 'Student'}`
                : `Edit ${userRole === 'TEACHER' ? 'Faculty' : 'Student'}`}
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Enter user profile details for your organization.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-hidden focus:border-neutral-400 shadow-2xs"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Email Prefix *
                </label>
                <div className="flex rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs focus-within:border-neutral-400">
                  <input
                    type="text"
                    required
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value.replace(/\s+/g, ''))}
                    className="w-full bg-transparent px-3.5 py-2 text-xs font-medium focus:outline-hidden"
                    placeholder="username"
                  />
                  <span className="inline-flex items-center px-3 bg-neutral-100 text-neutral-500 text-xs font-medium border-l border-neutral-200">
                    @{domain}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
                >
                  {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
                  {submitting
                    ? 'Saving...'
                    : modalType === 'create'
                    ? `Create ${userRole === 'TEACHER' ? 'Faculty' : 'Student'}`
                    : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Bulk Import Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowImportModal(false);
                setCsvFile(null);
              }}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Bulk Import {activeTab === 'STUDENT' ? 'Students' : 'Faculty'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Upload a `.csv` roster file with student or faculty accounts.
            </p>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors relative">
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileSpreadsheet className="mx-auto text-neutral-400 mb-2 size-8" />
                <span className="text-xs font-bold text-neutral-800 block">
                  {csvFile ? csvFile.name : 'Click to select CSV roster file'}
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Columns: firstName, lastName, email
                </span>
              </div>

              <Button
                type="submit"
                disabled={!csvFile}
                className="w-full h-10 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs disabled:opacity-50"
              >
                Import Accounts
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
