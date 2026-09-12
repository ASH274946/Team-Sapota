'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Power,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useAuthStore } from '@/store/auth.store';
import { NativeSelect } from '@/components/ui/native-select';

interface Organization {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  subscriptionPlan: string;
  createdAt: string;
  _count?: { users: number };
}

interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  STUDENT: { label: 'Student', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  FACULTY: { label: 'Faculty', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  TEACHER: { label: 'Faculty', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ADMIN: { label: 'Admin', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export default function SuperAdminOrganizations() {
  const [list, setList] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { fetchAvailableOrganizations, switchOrganization, setOriginalAdminToken, originalAdminToken } =
    useAdminAuthStore();
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Users slide-over panel
  const [usersPanel, setUsersPanel] = useState<{ org: Organization } | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [orgUsersLoading, setOrgUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/organizations');
      if (res.data?.success) setList(res.data.data || []);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openUsersPanel = useCallback(async (org: Organization) => {
    setUsersPanel({ org });
    setUserSearch('');
    setRoleFilter('');
    setOrgUsers([]);
    setOrgUsersLoading(true);
    try {
      const res = await api.get(`/super-admin/organizations/${org.id}/users`);
      if (res.data?.success) setOrgUsers(res.data.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setOrgUsersLoading(false);
    }
  }, []);

  const openCreate = () => {
    setModalType('create');
    setSelectedId(null);
    setName('');
    setCode('');
    setEmail('');
    setPhone('');
    setAddress('');
    setAdminEmail('');
    setShowModal(true);
  };

  const openEdit = (org: Organization & { users?: { email: string }[] }) => {
    setModalType('edit');
    setSelectedId(org.id);
    setName(org.name);
    setCode(org.code);
    setEmail(org.email || '');
    setPhone(org.phone || '');
    setAddress(org.address || '');
    setAdminEmail(org.users?.[0]?.email || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required.');
      return;
    }
    try {
      if (modalType === 'create') {
        const res = await api.post('/super-admin/organizations', {
          name,
          code,
          email,
          phone,
          address,
          adminEmail,
        });
        if (res.data?.success) {
          toast.success('Organization created!');
          setShowModal(false);
          load();
          fetchAvailableOrganizations();
        }
      } else {
        const res = await api.post(`/super-admin/organizations/${selectedId}/update`, {
          name,
          code,
          email,
          phone,
          address,
          adminEmail,
        });
        if (res.data?.success) {
          toast.success('Organization updated!');
          setShowModal(false);
          load();
          fetchAvailableOrganizations();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this organization? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/super-admin/organizations/${id}`);
      if (res.data?.success) {
        toast.success('Organization deleted.');
        load();
        fetchAvailableOrganizations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Delete failed');
    }
  };

  const handleToggleSuspend = async (org: Organization) => {
    const isSuspended = org.status === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} ${org.name}?`)) return;
    try {
      const res = await api.post(`/super-admin/organizations/${org.id}/suspend`, {
        action: isSuspended ? 'activate' : 'suspend',
      });
      if (res.data?.success) {
        toast.success(`Organization ${isSuspended ? 'activated' : 'suspended'}.`);
        load();
        fetchAvailableOrganizations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  const filtered = useMemo(() => {
    return list.filter((org) => {
      const matchSearch =
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || org.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [list, search, statusFilter]);

  const filteredUsers = orgUsers.filter((u) => {
    const matchSearch =
      !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter || (roleFilter === 'FACULTY' && u.role === 'TEACHER');
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Tenant Organizations
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Provision, manage, and configure institutional environments across the multi-tenant cluster
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">TOTAL TENANTS</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{list.length}</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase">ACTIVE</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {list.filter((o) => o.status === 'ACTIVE').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase">SUSPENDED</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {list.filter((o) => o.status === 'SUSPENDED').length}
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-purple-600 uppercase">ENTERPRISE TIER</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">
            {list.filter((o) => o.subscriptionPlan === 'ENTERPRISE').length}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations by name or institutional code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-200/90 rounded-xl text-neutral-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </NativeSelect>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Building2 className="w-10 h-10 text-neutral-300 mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No Organizations Found</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              {search || statusFilter
                ? 'No organizations match the search criteria.'
                : 'Get started by creating your first tenant organization.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-6">Organization</th>
                  <th className="py-3.5 px-6">Tenant Code</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Plan</th>
                  <th className="py-3.5 px-6 text-center">Members</th>
                  <th className="py-3.5 px-6">Created On</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <button
                        onClick={async () => {
                          try {
                            if (!originalAdminToken && accessToken) {
                              setOriginalAdminToken(accessToken);
                            }
                            const success = await switchOrganization(org.id);
                            if (success) {
                              toast.success(`Switched to ${org.name}`);
                              window.location.href = '/dashboard/admin';
                            } else {
                              toast.error('Failed to switch organization');
                            }
                          } catch {
                            toast.error('Error switching organization');
                          }
                        }}
                        className="text-left font-bold text-neutral-900 hover:text-[#e05934] transition-colors flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4 text-neutral-400" />
                        <span>{org.name}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-neutral-600">{org.code}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          org.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : org.status === 'SUSPENDED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {org.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-neutral-700">
                      {org.subscriptionPlan || 'STANDARD'}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <button
                        onClick={() => openUsersPanel(org)}
                        className="px-3 py-1 rounded-full border border-neutral-200 hover:border-neutral-300 bg-neutral-50 text-neutral-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{org._count?.users ?? 0}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-6 text-neutral-500 font-medium">
                      {new Date(org.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(org)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(org)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            org.status === 'SUSPENDED'
                              ? 'hover:bg-emerald-50 text-emerald-600'
                              : 'hover:bg-amber-50 text-amber-600'
                          }`}
                          title={org.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                {modalType === 'create' ? 'Provision New Organization' : 'Edit Organization Settings'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Organization Name *
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Delhi Public School"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Code *
                  </label>
                  <input
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., DPS-DELHI"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Primary Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@school.edu"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Contact Phone
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@school.edu"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Institutional campus address..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold"
                >
                  {modalType === 'create' ? 'Provision Tenant' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Slide-over Panel */}
      <AnimatePresence>
        {usersPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUsersPanel(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{usersPanel.org.name}</h3>
                  <p className="text-xs text-neutral-400">Members & Role Directory</p>
                </div>
                <button
                  onClick={() => setUsersPanel(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-neutral-100 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                  />
                </div>
                <NativeSelect
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold"
                >
                  <option value="">All Roles</option>
                  <option value="STUDENT">Students</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admins</option>
                </NativeSelect>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {orgUsersLoading ? (
                  <div className="p-8 text-center text-xs text-neutral-400">Loading members...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400">No members found</div>
                ) : (
                  filteredUsers.map((u) => {
                    const meta = ROLE_META[u.role] || {
                      label: u.role,
                      color: 'text-neutral-700',
                      bg: 'bg-neutral-100 border-neutral-200',
                    };
                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.firstName?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-neutral-900 truncate">
                              {u.firstName} {u.lastName}
                            </h5>
                            <p className="text-[11px] text-neutral-500 truncate">{u.email}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} shrink-0`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
