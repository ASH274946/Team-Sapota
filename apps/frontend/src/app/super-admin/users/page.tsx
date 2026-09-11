'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  UserPlus,
  Building,
  X,
  Search,
  MoreVertical,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useUserFilters } from '@/hooks/useUserFilters';
import { Pagination } from '@/components/ui/Pagination';
import { NativeSelect } from '@/components/ui/native-select';
import toast from 'react-hot-toast';

interface UnifiedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  institution: string;
  lastActivity: string;
}

interface DirectoryData {
  users: UnifiedUser[];
  stats: {
    activeUsers: number;
    inactiveUsers: number;
    crossOrgEngagement: number;
    orgBreakdown: { name: string; count: number; id: string | null; code: string }[];
  };
}

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  TEACHER: { bg: 'bg-amber-50 text-amber-700 border-amber-200', color: 'text-amber-700', label: 'Faculty' },
  FACULTY: { bg: 'bg-amber-50 text-amber-700 border-amber-200', color: 'text-amber-700', label: 'Faculty' },
  ORG_ADMIN: { bg: 'bg-purple-50 text-purple-700 border-purple-200', color: 'text-purple-700', label: 'Org Admin' },
  ADMIN: { bg: 'bg-purple-50 text-purple-700 border-purple-200', color: 'text-purple-700', label: 'Admin' },
  STUDENT: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: 'text-emerald-700', label: 'Student' },
  SUPER_ADMIN: { bg: 'bg-rose-50 text-rose-700 border-rose-200', color: 'text-rose-700', label: 'Super Admin' },
};

export default function GlobalUsersDirectory() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Menus
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'STUDENT',
    organizationId: '',
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Bulk Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  // Filters
  const {
    roleFilter,
    setRoleFilter,
    orgFilter,
    setOrgFilter,
    statusFilter,
    setStatusFilter,
    periodFilter,
    setPeriodFilter,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    clearFilters,
    filteredUsers,
  } = useUserFilters(data?.users || []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, orgFilter, statusFilter, periodFilter, searchQuery, sortField, sortOrder]);

  const fetchDirectoryData = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/global-directory');
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load directory data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectoryData();
    const interval = setInterval(fetchDirectoryData, 15000);
    return () => clearInterval(interval);
  }, [fetchDirectoryData]);

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true);
      setCreateUserError(null);
      await api.post('/admin/users', newUserForm);
      toast.success('User identity created');
      setIsNewUserOpen(false);
      setNewUserForm({ firstName: '', lastName: '', email: '', role: 'STUDENT', organizationId: '' });
      setIsEmailManuallyEdited(false);
      fetchDirectoryData();
    } catch (err: any) {
      setCreateUserError(err.response?.data?.error || err.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      setImportError('Please select a CSV file to import.');
      return;
    }
    try {
      setIsImporting(true);
      setImportError(null);
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data?.data || res.data);
      toast.success('Bulk import finished');
      fetchDirectoryData();
    } catch (err: any) {
      setImportError(err.response?.data?.error || err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleToggleSuspendUser = async (u: UnifiedUser) => {
    setActiveActionMenu(null);
    const isSuspended = u.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} ${u.firstName} ${u.lastName} (${u.email})?`)) return;
    try {
      await api.put(`/admin/users/${u.id}/suspend`, { suspend: !isSuspended });
      toast.success(`User ${isSuspended ? 'activated' : 'suspended'} successfully.`);
      fetchDirectoryData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (u: UnifiedUser) => {
    setActiveActionMenu(null);
    if (!confirm(`Generate a temporary password reset for ${u.firstName} ${u.lastName}?`)) return;
    try {
      const res = await api.post(`/admin/users/${u.id}/reset-password`);
      const tempPass = res.data?.data?.tempPassword || res.data?.tempPassword;
      if (tempPass) {
        toast.success(`Temporary password: ${tempPass}`, { duration: 10000 });
      } else {
        toast.success('Password reset initiated successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Password reset failed');
    }
  };

  const handleDeleteUser = async (u: UnifiedUser) => {
    setActiveActionMenu(null);
    if (!confirm(`Permanently remove ${u.firstName} ${u.lastName} (${u.email})? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success('User removed successfully.');
      fetchDirectoryData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Delete user failed');
    }
  };

  useEffect(() => {
    if (isEmailManuallyEdited) return;
    if (!newUserForm.firstName && !newUserForm.lastName) {
      setNewUserForm((prev) => ({ ...prev, email: '' }));
      return;
    }
    let domain = 'vidya.ai';
    if (newUserForm.organizationId && data?.stats?.orgBreakdown) {
      const org = data.stats.orgBreakdown.find((o) => o.id === newUserForm.organizationId);
      if (org && org.code) {
        domain = org.code.toLowerCase() + '.com';
      } else if (org && org.name) {
        domain = org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      }
    }
    const first = newUserForm.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const last = newUserForm.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let emailPrefix = '';
    if (first && last) emailPrefix = `${first}${last}`;
    else if (first) emailPrefix = first;
    else if (last) emailPrefix = last;

    if (emailPrefix) {
      setNewUserForm((prev) => ({ ...prev, email: `${emailPrefix}@${domain}` }));
    }
  }, [
    newUserForm.firstName,
    newUserForm.lastName,
    newUserForm.organizationId,
    data?.stats?.orgBreakdown,
    isEmailManuallyEdited,
  ]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getInitials = (f: string, l: string) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

  const getRoleStyle = (role: string, status: string) => {
    if (status === 'SUSPENDED') {
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', color: 'text-rose-700', label: 'Suspended' };
    }
    return ROLE_STYLES[role] || { bg: 'bg-neutral-100 text-neutral-700 border-neutral-200', color: 'text-neutral-700', label: role };
  };

  const { stats } = data || {
    stats: { activeUsers: 0, inactiveUsers: 0, crossOrgEngagement: 0, orgBreakdown: [] },
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Global User Directory
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Manage multi-tenant identity directory, credential policies, and cross-ecosystem synchronization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => setIsNewUserOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>New User Identity</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Role
            </label>
            <NativeSelect
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-800"
            >
              <option value="All Roles">All Roles</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Org Admin">Org Admin</option>
              <option value="Super Admin">Super Admin</option>
            </NativeSelect>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Organization
            </label>
            <NativeSelect
              value={orgFilter}
              onChange={(e) => {
                setOrgFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-800"
            >
              <option value="All Organizations">All Organizations</option>
              {stats?.orgBreakdown.map((o) => (
                <option key={o.name} value={o.name}>
                  {o.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Status
            </label>
            <NativeSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-800"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Active Only">Active</option>
              <option value="Suspended">Suspended</option>
            </NativeSelect>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Activity
            </label>
            <NativeSelect
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-800"
            >
              <option value="All Time">All Time</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 7 Days">Last 7 Days</option>
            </NativeSelect>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-end">
            <button
              onClick={() => {
                clearFilters();
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-50 flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name, email address, role, or institution code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-neutral-300 mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No Users Matching Criteria</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Try adjusting your filter settings or search query to find accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th
                    className="py-3.5 px-6 cursor-pointer hover:text-neutral-700"
                    onClick={() => {
                      setSortOrder(sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                      setSortField('name');
                    }}
                  >
                    User Profile {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3.5 px-6 cursor-pointer hover:text-neutral-700"
                    onClick={() => {
                      setSortOrder(sortField === 'role' && sortOrder === 'asc' ? 'desc' : 'asc');
                      setSortField('role');
                    }}
                  >
                    Role {sortField === 'role' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3.5 px-6 cursor-pointer hover:text-neutral-700"
                    onClick={() => {
                      setSortOrder(sortField === 'organization' && sortOrder === 'asc' ? 'desc' : 'asc');
                      setSortField('organization');
                    }}
                  >
                    Organization {sortField === 'organization' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    className="py-3.5 px-6 cursor-pointer hover:text-neutral-700"
                    onClick={() => {
                      setSortOrder(sortField === 'lastActivity' && sortOrder === 'asc' ? 'desc' : 'asc');
                      setSortField('lastActivity');
                    }}
                  >
                    Last Activity {sortField === 'lastActivity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedUsers.map((u) => {
                  const roleStyle = getRoleStyle(u.role, u.status);
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-neutral-400 text-[11px] font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleStyle.bg}`}
                        >
                          {roleStyle.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5 text-neutral-700 font-semibold">
                          <Building className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{u.institution}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-neutral-500 font-medium">
                        {u.lastActivity
                          ? formatDistanceToNow(new Date(u.lastActivity), { addSuffix: true })
                          : 'Never'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveActionMenu(activeActionMenu === u.id ? null : u.id)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeActionMenu === u.id && (
                            <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white border border-neutral-200 shadow-lg py-1 z-20 text-xs text-left">
                              <button
                                onClick={() => handleResetPassword(u)}
                                className="w-full px-3 py-2 text-neutral-700 hover:bg-neutral-50 text-left font-medium flex items-center justify-between"
                              >
                                <span>Reset Password</span>
                              </button>
                              <button
                                onClick={() => handleToggleSuspendUser(u)}
                                className={`w-full px-3 py-2 text-left font-medium ${
                                  u.status === 'SUSPENDED' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                                }`}
                              >
                                {u.status === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 text-left font-medium border-t border-neutral-100"
                              >
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50">
          <span className="text-xs font-medium text-neutral-500">
            {filteredUsers.length > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(
                  currentPage * itemsPerPage,
                  filteredUsers.length
                )} of ${filteredUsers.length} identities`
              : 'Showing 0 users'}
          </span>
          <div className="max-w-xs">
            <Pagination totalPages={totalPages || 1} value={currentPage} onChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {/* New User Modal */}
      {isNewUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Provision User Identity</h3>
              <button onClick={() => setIsNewUserOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {createUserError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    First Name
                  </label>
                  <input
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Last Name
                  </label>
                  <input
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => {
                    setIsEmailManuallyEdited(true);
                    setNewUserForm((prev) => ({ ...prev, email: e.target.value }));
                  }}
                  placeholder="user@vidya.ai"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  System Role
                </label>
                <NativeSelect
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Faculty</option>
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </NativeSelect>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Assigned Institution
                </label>
                <NativeSelect
                  value={newUserForm.organizationId}
                  onChange={(e) => setNewUserForm((prev) => ({ ...prev, organizationId: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold"
                >
                  <option value="">Select Organization (Optional)</option>
                  {stats?.orgBreakdown
                    .filter((o) => o.id)
                    .map((o) => (
                      <option key={o.id} value={o.id!}>
                        {o.name}
                      </option>
                    ))}
                </NativeSelect>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsNewUserOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isCreatingUser}
                className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold disabled:opacity-50"
              >
                {isCreatingUser ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Bulk Import via CSV</h3>
              <button onClick={() => setIsBulkImportOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative border-2 border-dashed border-neutral-200 hover:border-neutral-300 rounded-2xl p-8 text-center bg-neutral-50 flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImportFile(e.target.files[0]);
                    setImportError(null);
                    setImportResult(null);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="text-xs font-bold text-neutral-800">
                {importFile ? importFile.name : 'Click to select or drag CSV file here'}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">Columns: firstName, lastName, email, role, code</p>
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Import Completed</span>
                </div>
                <p>Created: {importResult.created || 0} users</p>
                <p>Skipped / Duplicates: {importResult.skipped || importResult.duplicates || 0}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!importFile || isImporting}
                className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
