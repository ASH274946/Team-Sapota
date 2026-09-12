'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2, Users, BookOpen, GraduationCap, FileText, Edit3, Power, Trash2,
  ShieldCheck, Mail, Phone, MapPin, Calendar, CreditCard, ChevronLeft, X
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface OrgDetail {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; classrooms: number; assignments: number };
}

interface OrgUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface OrgStats {
  facultyCount: number;
  studentCount: number;
  classCount: number;
  assessmentCount: number;
}

type Tab = 'overview' | 'users' | 'departments' | 'classes' | 'subscriptions';

export default function OrganizationDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Assign admin modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');

  const loadOrg = async () => {
    try {
      setLoading(true);
      const [orgRes, statsRes, usersRes] = await Promise.all([
        api.get(`/super-admin/organizations/${id}`),
        api.get(`/super-admin/organizations/${id}/stats`),
        api.get(`/super-admin/organizations/${id}/users`),
      ]);
      if (orgRes.data?.success) {
        const o = orgRes.data.data;
        setOrg(o);
        setEditName(o.name); setEditCode(o.code);
        setEditEmail(o.email || ''); setEditPhone(o.phone || ''); setEditAddress(o.address || '');
      }
      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
    } catch { toast.error('Failed to load organization'); }
    finally { setLoading(false); }
  };

   
  useEffect(() => { if (id) loadOrg(); }, [id]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editCode) { toast.error('Name and Code required'); return; }
    try {
      const res = await api.put(`/super-admin/organizations/${id}`, {
        name: editName, code: editCode, email: editEmail, phone: editPhone, address: editAddress
      });
      if (res.data?.success) { toast.success('Organization updated'); setShowEdit(false); loadOrg(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Update failed'); }
  };

  const handleSuspend = async () => {
    if (!org) return;
    const isSuspended = org.status === 'SUSPENDED';
    if (!confirm(`${isSuspended ? 'Activate' : 'Suspend'} ${org.name}?`)) return;
    try {
      const res = await api.post(`/super-admin/organizations/${id}/suspend`);
      if (res.data?.success) { toast.success(`Organization ${isSuspended ? 'activated' : 'suspended'}.`); loadOrg(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDelete = async () => {
    if (!org) return;
    if (!confirm(`Permanently delete ${org.name} and all its data?`)) return;
    try {
      const res = await api.delete(`/super-admin/organizations/${id}`);
      if (res.data?.success) { toast.success('Organization deleted'); router.push('/super-admin/organizations'); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail) { toast.error('Enter an email'); return; }
    try {
      const res = await api.post(`/super-admin/organizations/${id}/assign-admin`, { email: assignEmail });
      if (res.data?.success) { toast.success('Admin assigned'); setShowAssign(false); setAssignEmail(''); loadOrg(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to assign admin'); }
  };

  const handleChangePlan = async (plan: string) => {
    if (!confirm(`Change plan to ${plan}?`)) return;
    try {
      const res = await api.put(`/super-admin/organizations/${id}/plan`, { plan });
      if (res.data?.success) { toast.success(`Plan changed to ${plan}`); loadOrg(); }
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Plan change failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) {
    return <div className="text-center py-16 text-gray-400 text-xs">Organization not found.</div>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'departments', label: 'Departments' },
    { key: 'classes', label: 'Classes' },
    { key: 'subscriptions', label: 'Subscriptions' },
  ];

  const planColorMap: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-700', STARTER: 'bg-blue-50 text-blue-700',
    PRO: 'bg-purple-50 text-purple-700', ENTERPRISE: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/super-admin/organizations" className="hover:text-blue-600 font-semibold flex items-center gap-1">
          <ChevronLeft size={14} /> Organizations
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-bold">{org.name}</span>
      </div>

      {/* Org Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="font-semibold">Code: {org.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {org.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${planColorMap[org.subscriptionPlan] || 'bg-gray-100 text-gray-700'}`}>
                  {org.subscriptionPlan}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1"><Edit3 size={13} /> Edit</button>
            <button onClick={handleSuspend} className={`${org.status === 'ACTIVE' ? 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'} border font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1`}><Power size={13} /> {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>
            <button onClick={() => setShowAssign(true)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1"><ShieldCheck size={13} /> Assign Admin</button>
            <button onClick={handleDelete} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1"><Trash2 size={13} /> Delete</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
          {org.email && <span className="flex items-center gap-1"><Mail size={12} /> {org.email}</span>}
          {org.phone && <span className="flex items-center gap-1"><Phone size={12} /> {org.phone}</span>}
          {org.address && <span className="flex items-center gap-1"><MapPin size={12} /> {org.address}</span>}
          <span className="flex items-center gap-1"><Calendar size={12} /> Created: {new Date(org.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-[1px] ${activeTab === tab.key ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Faculty', value: stats?.facultyCount || 0, icon: <GraduationCap size={20} />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Students', value: stats?.studentCount || 0, icon: <Users size={20} />, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Classes', value: stats?.classCount || 0, icon: <BookOpen size={20} />, color: 'bg-purple-50 text-purple-600' },
            { label: 'Assessments', value: stats?.assessmentCount || 0, icon: <FileText size={20} />, color: 'bg-orange-50 text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{s.label}</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{s.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-semibold text-gray-800">{u.firstName} {u.lastName}</td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[9px] font-bold">{u.role}</span></td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{u.status}</span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <Building2 size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-xs">Department management coming soon.</p>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-xs">Class management coming soon.</p>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Current Plan</h3>
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-blue-600" />
              <div>
                <span className="text-lg font-bold text-gray-900">{org.subscriptionPlan}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${org.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{org.status}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Change Plan</h3>
            {['FREE', 'STARTER', 'PRO', 'ENTERPRISE'].filter(p => p !== org.subscriptionPlan).map(plan => (
              <button key={plan} onClick={() => handleChangePlan(plan)}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors">
                Switch to {plan}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowEdit(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Edit Organization</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Name *</label><input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
              <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Code *</label><input type="text" required value={editCode} onChange={e => setEditCode(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
                <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Phone</label><input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Address</label><input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" /></div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">Update</button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowAssign(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Assign Organization Admin</h3>
            <form onSubmit={handleAssignAdmin} className="space-y-4">
              <div><label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">User Email *</label><input type="email" required value={assignEmail} onChange={e => setAssignEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" placeholder="admin@example.com" /></div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs">Assign Admin</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
