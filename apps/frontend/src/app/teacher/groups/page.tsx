'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string;
  subject: string;
  className: string;
  students: number;
  color?: string;
}

export default function GroupsListingPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Group[] }>('/groups');
      setGroups(res.data.data || []);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.delete(`/groups/${id}`);
      toast.success('Group deleted successfully');
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete group');
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.className && g.className.toLowerCase().includes(search.toLowerCase())) ||
        (g.subject && g.subject.toLowerCase().includes(search.toLowerCase()))
    );
  }, [groups, search]);

  const totalMembers = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.students || 0), 0);
  }, [groups]);

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Student Study Groups
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Organize student project cohorts, target assignments, and monitor group performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/groups/create"
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ACTIVE GROUPS</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{groups.length}</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">TOTAL MEMBERS</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{totalMembers} Students</div>
        </div>
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">SUBJECT COVERAGE</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">
            {new Set(groups.map((g) => g.subject).filter(Boolean)).size || 1} Subjects
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search groups by name, subject, or class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
        />
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center">
          <Users className="w-10 h-10 text-neutral-300 mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No Groups Found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            {search
              ? 'No groups match your search criteria.'
              : 'Create your first student study group to collaborate and assign focused tests.'}
          </p>
          <Link
            href="/teacher/groups/create"
            className="mt-5 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Study Group</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:border-neutral-300 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-orange-50 text-[#e05934] border border-orange-100">
                    {group.subject || 'General'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-1 rounded-lg hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-900">{group.name}</h3>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-1 font-medium">
                  {group.description || 'Targeted project group for active curriculum study and reviews.'}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-bold text-neutral-800">{group.students || 0} Students</span>
                </div>
                <span className="text-xs font-semibold text-neutral-500">{group.className || 'All Sections'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
