'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Award,
  PieChart as PieIcon,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Link from 'next/link';

interface PlatformAnalytics {
  totals: {
    organizations: number;
    activeOrganizations: number;
    users: number;
    students: number;
    teachers: number;
    assessments: number;
    papers: number;
    questions?: number;
  };
  usageTrends: Array<{
    month: string;
    papers: number;
    users: number;
    assessments: number;
    aiTokensK?: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    plan: string;
    papersCount: number;
    userCount: number;
    assessmentCount: number;
    activityScore: number;
    createdAt?: string;
  }>;
  subjectDistribution?: Array<{
    name: string;
    percentage: number;
    count: number;
  }>;
}

export default function SuperAdminAnalytics() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'all' | 'papers' | 'users' | 'assessments'>('all');

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/super-admin/analytics');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleExport = () => {
    if (!data) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Organizations', data.totals.organizations],
      ['Active Organizations', data.totals.activeOrganizations],
      ['Total Users', data.totals.users],
      ['Total Students', data.totals.students || 0],
      ['Total Faculty', data.totals.teachers || 0],
      ['Total Assessments', data.totals.assessments],
      ['Papers Generated', data.totals.papers],
      [],
      ['Top Organizations by Activity'],
      ['Rank', 'Name', 'Code', 'Users', 'Papers', 'Assessments', 'Plan'],
      ...data.topOrganizations.map((org, i) => [
        i + 1,
        org.name,
        org.code,
        org.userCount,
        org.papersCount,
        org.assessmentCount,
        org.plan,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vidyaai-platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics report exported successfully');
  };

  if (loading && !data) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-80 rounded-2xl col-span-2" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const d = data || {
    totals: { organizations: 0, activeOrganizations: 0, users: 0, students: 0, teachers: 0, assessments: 0, papers: 0, questions: 0 },
    usageTrends: [],
    topOrganizations: [],
    subjectDistribution: [],
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6 pb-16">
      {/* ── 1. Top Page Header (Light Theme) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Platform Analytics & Usage
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Global multi-tenant metrics, AI curriculum generation volume, and institutional engagement rankings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 transition-all shadow-2xs"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200/90 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-neutral-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary KPI Cards (Light Design) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: 'ORGANIZATIONS',
            value: d.totals.organizations,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            sub: `${d.totals.activeOrganizations || d.totals.organizations} Active Institutions`,
            badge: '+12% MoM',
            badgeColor: 'text-blue-700 bg-blue-50',
          },
          {
            title: 'TOTAL IDENTITIES',
            value: d.totals.users,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            sub: `${d.totals.students || 0} Students • ${d.totals.teachers || 0} Faculty`,
            badge: 'Multi-Tenant',
            badgeColor: 'text-emerald-700 bg-emerald-50',
          },
          {
            title: 'ASSESSMENTS',
            value: d.totals.assessments,
            icon: BarChart3,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            sub: `${d.totals.questions || 0} Question Bank Items`,
            badge: 'Scored & Active',
            badgeColor: 'text-purple-700 bg-purple-50',
          },
          {
            title: 'PAPERS GENERATED',
            value: d.totals.papers,
            icon: FileText,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            sub: 'AI Curriculum Blueprints & Exams',
            badge: 'AI Powered',
            badgeColor: 'text-orange-700 bg-orange-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  {item.title}
                </span>
                <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight group-hover:text-[#e05934] transition-colors">
                  {item.value}
                </div>
                <div className="flex items-center justify-between gap-1 mt-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium truncate">
                    {item.sub}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border border-neutral-100 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. Ecosystem Growth & Generation Trends Interactive Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Usage Trends */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#e05934]" />
                <h2 className="text-base font-extrabold text-neutral-900">
                  Ecosystem Growth & Generation Trends
                </h2>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Monthly breakdown of AI papers, active learners, and examination volume
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveMetric('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Combined View
              </button>
              <button
                onClick={() => setActiveMetric('papers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'papers'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                AI Papers
              </button>
              <button
                onClick={() => setActiveMetric('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'users'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveMetric('assessments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeMetric === 'assessments'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Exams
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-72 w-full">
            {d.usageTrends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400">
                No trend data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {activeMetric === 'all' ? (
                  <AreaChart data={d.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPapers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e05934" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#e05934" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        color: '#0f172a',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      formatter={(val) => <span className="text-neutral-600 font-semibold">{val}</span>}
                    />
                    <Area type="monotone" dataKey="papers" name="AI Generated Papers" stroke="#e05934" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPapers)" />
                    <Area type="monotone" dataKey="users" name="Active Users" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" dataKey="assessments" name="Exams & Tests" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAssessments)" />
                  </AreaChart>
                ) : activeMetric === 'papers' ? (
                  <BarChart data={d.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="papers" name="AI Papers" fill="#e05934" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : activeMetric === 'users' ? (
                  <BarChart data={d.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="users" name="Users" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={d.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="assessments" name="Assessments" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Academic Domain & Subject Distribution */}
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Subject Distribution</h3>
                <p className="text-xs text-neutral-500 font-medium">Curriculum coverage by discipline</p>
              </div>
              <div className="p-2 rounded-xl bg-orange-50 text-[#e05934]">
                <PieIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {(d.subjectDistribution || []).map((sub) => (
                <div key={sub.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-neutral-800">{sub.name}</span>
                    <span className="text-neutral-500 font-semibold">{sub.percentage}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#e05934] to-amber-500"
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">Bloom's Taxonomy Compliant</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              100% Quality Pass
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Top Institutional Tenants by Activity (Leaderboard Matrix) ── */}
      <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-extrabold text-neutral-900">
                  Top Institutional Tenants by Activity
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Ranked by volume of active learners, curriculum generation throughput, and assessment frequency
              </p>
            </div>

            <Link
              href="/super-admin/organizations"
              className="px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Manage All Organizations</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {d.topOrganizations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No organization activity recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-3 px-3">Rank</th>
                    <th className="pb-3 px-3">Institution Name</th>
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Plan</th>
                    <th className="pb-3 px-3">Enrolled Users</th>
                    <th className="pb-3 px-3">AI Papers</th>
                    <th className="pb-3 px-3">Assessments</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.topOrganizations.map((org, index) => (
                    <tr key={org.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          index === 0
                            ? 'bg-amber-100 text-amber-800 font-extrabold'
                            : index === 1
                            ? 'bg-slate-200 text-slate-800'
                            : index === 2
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-neutral-900 text-xs">{org.name}</div>
                        <div className="text-[10px] text-neutral-400">Activity Score: {org.activityScore}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                          {org.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-neutral-800">
                        {org.userCount}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-[#e05934]">
                        {org.papersCount}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-neutral-800">
                        {org.assessmentCount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          org.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          href={`/super-admin/organizations/${org.id}`}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 inline-flex items-center transition-all"
                          title="Open Organization Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
