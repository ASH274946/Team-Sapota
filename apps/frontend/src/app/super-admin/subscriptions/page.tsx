'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  ChevronRight,
  Layers,
  CreditCard,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/format';
import { motion } from 'framer-motion';

interface OrgSubscription {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  plan: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const PLANS = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as const;

const PLAN_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  FREE: { bg: 'bg-neutral-100', color: 'text-neutral-700', border: 'border-neutral-200' },
  STARTER: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200' },
  PRO: { bg: 'bg-purple-50', color: 'text-purple-700', border: 'border-purple-200' },
  ENTERPRISE: { bg: 'bg-orange-50', color: 'text-[#e05934]', border: 'border-orange-200' },
};

export default function SuperAdminSubscriptions() {
  const [list, setList] = useState<OrgSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/billing/subscriptions');
      if (res.data?.success) setList(res.data.data || []);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChangePlan = async (orgId: string, orgName: string, newPlan: string) => {
    if (!confirm(`Change ${orgName}'s tier to ${newPlan}?`)) return;
    try {
      const res = await api.put(`/admin/billing/subscriptions/${orgId}`, { plan: newPlan });
      if (res.data?.success) {
        toast.success(`${orgName} upgraded to ${newPlan}`);
        load();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Plan change failed');
    }
  };

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchesPlan = !planFilter || s.plan === planFilter;
      const matchesSearch =
        !search ||
        s.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
        s.organizationCode?.toLowerCase().includes(search.toLowerCase());
      return matchesPlan && matchesSearch;
    });
  }, [list, planFilter, search]);

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Subscription & License Tiers
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Global institutional licensing, seat quotas, and plan modifications
          </p>
        </div>
      </div>

      {/* Plan Tier Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PLANS.map((p, idx) => {
          const count = list.filter((s) => s.plan === p).length;
          const style = PLAN_STYLES[p];
          return (
            <motion.div
              key={p}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => setPlanFilter(planFilter === p ? '' : p)}
              className={`rounded-2xl border p-5 bg-white shadow-xs cursor-pointer transition-all ${
                planFilter === p ? 'ring-2 ring-[#e05934] border-[#e05934]' : 'border-neutral-200/90 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${style.bg} ${style.color} ${style.border}`}>
                  {p}
                </span>
                <Layers className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
                {count}
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                {count === 1 ? '1 Institution' : `${count} Institutions`}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant name or institutional code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setPlanFilter('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              !planFilter
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200/90 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            All Tiers
          </button>
          {PLANS.map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                planFilter === p
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200/90 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CreditCard className="w-10 h-10 text-neutral-300 mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No Subscriptions Found</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              {planFilter || search ? 'Try resetting your search query or tier filters.' : 'No active subscriptions registered.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-6">Organization</th>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Current Plan</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Expiration</th>
                  <th className="py-3.5 px-6 text-right">Change Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((sub) => {
                  const style = PLAN_STYLES[sub.plan] || PLAN_STYLES.FREE;
                  return (
                    <tr key={sub.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/super-admin/organizations`}
                          className="font-bold text-neutral-900 hover:text-[#e05934] transition-colors flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          <span>{sub.organizationName}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-neutral-600">{sub.organizationCode}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.color} ${style.border}`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-neutral-500 font-medium">
                        {sub.expiresAt ? formatDate(sub.expiresAt) : 'Perpetual / Active'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="relative inline-block text-left group">
                          <button className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1">
                            <span>Modify Tier</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-xl shadow-lg z-10 hidden group-hover:block py-1 text-left">
                            {PLANS.filter((p) => p !== sub.plan).map((plan) => (
                              <button
                                key={plan}
                                onClick={() => handleChangePlan(sub.organizationId, sub.organizationName, plan)}
                                className="block w-full text-left px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                              >
                                {plan}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
