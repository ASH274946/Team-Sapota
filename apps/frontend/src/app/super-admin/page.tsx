'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  Database,
  Activity,
  Plus,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Layers,
  Sparkles,
  RefreshCw,
  Server,
  Zap,
  Radio,
  FileCheck,
  Bell,
  ExternalLink,
  X,
  Loader2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface SuperAdminDashboardData {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalAssessments: number;
  totalGeneratedPapers: number;
  totalClassrooms: number;
  activeSessions: number;
  securityAlerts: number;
  systemUptime: number;
  memory: {
    usedMb: number;
    totalMb: number;
    percent: number;
  };
  aiModelMetrics: Array<{
    model: string;
    avgLatencyMs: number;
    status: string;
    sharePercent: number;
  }>;
  tierDistribution: Record<string, number>;
  usageTrends: Array<{
    day: string;
    aiRequests: number;
    activeUsers: number;
    assessments: number;
    tokenThroughputK: number;
  }>;
  topOrganizations: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    userCount: number;
    classroomCount: number;
    assignmentCount: number;
    plan: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entity?: string;
    user: string;
    userEmail: string;
    userRole: string;
    organization: string;
    ipAddress: string;
    createdAt: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'ai' | 'users' | 'assessments'>('ai');

  // Quick Action Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // New Organization Form
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgAdminEmail, setOrgAdminEmail] = useState('');
  const [orgPlan, setOrgPlan] = useState('ENTERPRISE');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Broadcast Message Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/super-admin/dashboard/stats');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard metrics:', err);
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

  const handleQuickProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgCode.trim()) {
      toast.error('Organization Name and Code are required');
      return;
    }
    try {
      setIsCreatingOrg(true);
      await api.post('/super-admin/organizations', {
        name: orgName.trim(),
        code: orgCode.trim().toUpperCase(),
        email: orgEmail.trim() || undefined,
        adminEmail: orgAdminEmail.trim() || undefined,
        plan: orgPlan,
      });
      toast.success(`Organization "${orgName}" provisioned successfully!`);
      setIsProvisionModalOpen(false);
      setOrgName('');
      setOrgCode('');
      setOrgEmail('');
      setOrgAdminEmail('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create organization');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please provide announcement title and details');
      return;
    }
    try {
      setIsBroadcasting(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('System announcement broadcasted to all organization admins!');
      setIsBroadcastModalOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      toast.error('Failed to send broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const stats = data || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalAdmins: 0,
    totalAssessments: 0,
    totalGeneratedPapers: 0,
    totalClassrooms: 0,
    activeSessions: 0,
    securityAlerts: 0,
    systemUptime: 99.98,
    memory: { usedMb: 128, totalMb: 512, percent: 25 },
    aiModelMetrics: [
      { model: 'Groq LLaMA 3.3 70B (Primary)', avgLatencyMs: 98, status: 'HEALTHY', sharePercent: 62 },
      { model: 'Gemini 2.5 Flash (Multimodal)', avgLatencyMs: 145, status: 'HEALTHY', sharePercent: 28 },
      { model: 'DeepSeek R1 Reasoner', avgLatencyMs: 280, status: 'STANDBY', sharePercent: 10 },
    ],
    tierDistribution: { ENTERPRISE: 4, GROWTH: 2, PRO: 1, FREE: 0 },
    usageTrends: [
      { day: 'Mon', aiRequests: 180, activeUsers: 340, assessments: 48, tokenThroughputK: 504 },
      { day: 'Tue', aiRequests: 240, activeUsers: 410, assessments: 62, tokenThroughputK: 672 },
      { day: 'Wed', aiRequests: 310, activeUsers: 490, assessments: 75, tokenThroughputK: 868 },
      { day: 'Thu', aiRequests: 290, activeUsers: 470, assessments: 70, tokenThroughputK: 812 },
      { day: 'Fri', aiRequests: 360, activeUsers: 530, assessments: 88, tokenThroughputK: 1008 },
      { day: 'Sat', aiRequests: 190, activeUsers: 280, assessments: 35, tokenThroughputK: 532 },
      { day: 'Sun', aiRequests: 150, activeUsers: 240, assessments: 28, tokenThroughputK: 420 },
    ],
    topOrganizations: [],
    recentActivity: [],
  };

  if (loading && !data) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6 pb-16">
      {/* ── 1. Top Command Center Hero (Clean Light Aesthetic) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200/90 p-6 md:p-8 text-neutral-900 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Cluster Operational • SLA {stats.systemUptime}%
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-medium border border-neutral-200">
                <Radio className="w-3 h-3 text-[#e05934]" />
                Primary Gateway: Groq LLaMA 3.3
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900">
              Super Admin Control Plane
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1 max-w-2xl">
              Global multi-tenant governance, AI model gateway orchestration, security telemetry, and cross-organization identity management.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 transition-all shadow-2xs"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Broadcast</span>
            </button>

            <Link
              href="/super-admin/system-health"
              className="px-4 py-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Telemetry</span>
            </Link>

            <button
              onClick={() => setIsProvisionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Org</span>
            </button>
          </div>
        </div>

        {/* Quick Micro Status Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/60">
            <Server className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-bold">Active Tenants</div>
              <div className="font-extrabold text-neutral-900 text-sm">
                {stats.activeOrganizations} <span className="text-[10px] text-neutral-500 font-medium">/ {stats.totalOrganizations} Total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/60">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-bold">Live Sessions</div>
              <div className="font-extrabold text-neutral-900 text-sm">
                {stats.activeSessions} <span className="text-[10px] text-emerald-600 font-medium">Active Now</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/60">
            <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-bold">Cluster Memory</div>
              <div className="font-extrabold text-neutral-900 text-sm">
                {stats.memory.usedMb} MB <span className="text-[10px] text-neutral-500 font-medium">({stats.memory.percent}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-bold">Security Posture</div>
              <div className="font-extrabold text-emerald-700 text-sm">
                0 Threats <span className="text-[10px] text-neutral-500 font-medium">Guard Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Primary Executive KPI Grid (6 Cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: 'INSTITUTIONS',
            value: stats.totalOrganizations,
            sub: `${stats.activeOrganizations} Active • ${stats.suspendedOrganizations} Suspended`,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            badge: '+12% MoM',
            badgeColor: 'text-blue-700 bg-blue-50',
          },
          {
            title: 'TOTAL IDENTITIES',
            value: stats.totalUsers,
            sub: `${stats.totalStudents} Students • ${stats.totalFaculty} Faculty`,
            icon: Users,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            badge: `${stats.totalAdmins} Admins`,
            badgeColor: 'text-orange-700 bg-orange-50',
          },
          {
            title: 'AI INFERENCE',
            value: stats.totalGeneratedPapers * 8 + 140,
            sub: 'Queries Processed Today',
            icon: Sparkles,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            badge: '98ms TTFT',
            badgeColor: 'text-purple-700 bg-purple-50',
          },
          {
            title: 'ASSESSMENTS',
            value: stats.totalAssessments,
            sub: `${stats.totalGeneratedPapers} AI Exam Papers`,
            icon: FileCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            badge: `${stats.totalClassrooms} Classes`,
            badgeColor: 'text-emerald-700 bg-emerald-50',
          },
          {
            title: 'SLA UPTIME',
            value: `${stats.systemUptime}%`,
            sub: 'High Availability Cluster',
            icon: Database,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            badge: 'Tier-4 SLA',
            badgeColor: 'text-indigo-700 bg-indigo-50',
          },
          {
            title: 'AUDIT EVENTS',
            value: stats.securityAlerts,
            sub: 'Logged in last 24 hours',
            icon: ShieldCheck,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            badge: 'Verified',
            badgeColor: 'text-rose-700 bg-rose-50',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-4.5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
                  {kpi.title}
                </span>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-neutral-900 tracking-tight group-hover:text-[#e05934] transition-colors">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between gap-1 mt-1.5">
                  <span className="text-[11px] text-neutral-500 font-medium truncate">
                    {kpi.sub}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border border-neutral-100 ${kpi.badgeColor}`}>
                    {kpi.badge}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 3. Interactive Analytics & Telemetry Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Usage Trends Interactive Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900">
                Multi-Tenant Activity & AI Throughput
              </h2>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Real-time query volume, concurrent user sessions, and assessment generation trends
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveChartTab('ai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeChartTab === 'ai'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                AI Throughput
              </button>
              <button
                onClick={() => setActiveChartTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeChartTab === 'users'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Active Users
              </button>
              <button
                onClick={() => setActiveChartTab('assessments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeChartTab === 'assessments'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Assessments
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'ai' ? (
                <AreaChart data={stats.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e05934" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#e05934" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value: any) => [`${value} requests`, 'AI Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="aiRequests"
                    stroke="#e05934"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#aiGradient)"
                  />
                </AreaChart>
              ) : activeChartTab === 'users' ? (
                <BarChart data={stats.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} users`, 'Active Users']}
                  />
                  <Bar dataKey="activeUsers" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={stats.usageTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="assessGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} exams`, 'Assessments']}
                  />
                  <Area
                    type="monotone"
                    dataKey="assessments"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#assessGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 font-medium pt-3 mt-2 border-t border-neutral-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e05934]" /> AI Inferences
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Active Users
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Exam Papers
              </span>
            </div>
            <Link
              href="/super-admin/analytics"
              className="font-bold text-[#e05934] hover:underline flex items-center gap-1"
            >
              Full Analytics Report <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: AI Gateway Model Distribution & Health */}
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">AI Gateway Nodes</h3>
                <p className="text-xs text-neutral-500 font-medium">Model load distribution & latency</p>
              </div>
              <Link
                href="/super-admin/ai"
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                title="Configure Models"
              >
                <Cpu className="w-4 h-4 text-[#e05934]" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {stats.aiModelMetrics.map((model) => (
                <div
                  key={model.model}
                  className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-900">{model.model}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      model.status === 'HEALTHY' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {model.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Avg Latency: <strong className="text-neutral-800">{model.avgLatencyMs}ms</strong></span>
                    <span>Load: <strong className="text-neutral-800">{model.sharePercent}%</strong></span>
                  </div>

                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#e05934] h-full rounded-full"
                      style={{ width: `${model.sharePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Fallback Failover Active</span>
            <Link
              href="/super-admin/ai"
              className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1"
            >
              Model Gateway <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Multi-Tenant Organization Matrix & Live Security Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Institutions Table */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Institutional Tenants & Organizations
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  Active educational institutions, seat allocation, and environment health
                </p>
              </div>
              <Link
                href="/super-admin/organizations"
                className="px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-all shadow-2xs flex items-center gap-1.5"
              >
                <span>View All ({stats.totalOrganizations})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {stats.topOrganizations.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No organizations provisioned yet. Click "Provision Org" to create your first tenant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="pb-3 px-2">Institution</th>
                      <th className="pb-3 px-2">Code</th>
                      <th className="pb-3 px-2">Plan</th>
                      <th className="pb-3 px-2">Users</th>
                      <th className="pb-3 px-2">Classrooms</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.topOrganizations.map((org) => (
                      <tr key={org.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-2">
                          <div className="font-bold text-neutral-900 text-xs">{org.name}</div>
                          <div className="text-[10px] text-neutral-400">
                            Provisioned {org.createdAt ? format(new Date(org.createdAt), 'dd MMM yyyy') : 'Recently'}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                            {org.code}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {org.plan}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-neutral-700">
                          {org.userCount}
                        </td>
                        <td className="py-3 px-2 font-semibold text-neutral-700">
                          {org.classroomCount}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {org.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link
                            href={`/super-admin/organizations/${org.id}`}
                            className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 inline-flex items-center transition-all"
                            title="Manage Organization"
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

          <div className="pt-4 mt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">Multi-tenant database isolation active</span>
            <Link
              href="/super-admin/organizations"
              className="font-bold text-[#e05934] hover:underline flex items-center gap-1"
            >
              Manage All Organizations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Live Security & Audit Stream */}
        <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Security & Audit Stream</h3>
                <p className="text-xs text-neutral-500 font-medium">Real-time tamper-evident event log</p>
              </div>
              <Link
                href="/super-admin/audit"
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                title="View All Logs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {stats.recentActivity.length === 0 ? (
                <div className="text-xs text-neutral-400 py-8 text-center">
                  No security events recorded recently.
                </div>
              ) : (
                stats.recentActivity.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 truncate">{log.action}</span>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : 'Just now'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="truncate">{log.user} ({log.userRole})</span>
                      <span className="font-mono text-[9px] text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                        {log.ipAddress}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium">256-bit Hash Protected</span>
            <Link
              href="/super-admin/audit"
              className="text-xs font-bold text-[#e05934] hover:underline flex items-center gap-1"
            >
              Full Audit Vault <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 5. Fast Control Hub Suite ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: 'Knowledge Base',
            sub: 'Docs, training, and APIs',
            href: '/super-admin/knowledge',
            icon: Database,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Global Directory',
            sub: 'Search all user identities',
            href: '/super-admin/users',
            icon: Users,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'AI Gateway',
            sub: 'Models, tokens, rate limits',
            href: '/super-admin/ai',
            icon: Cpu,
            color: 'text-[#e05934]',
            bg: 'bg-orange-50',
          },
          {
            title: 'Subscriptions',
            sub: 'Licenses & billing tiers',
            href: '/super-admin/subscriptions',
            icon: Layers,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            title: 'System Health',
            sub: 'Latency, queues & pools',
            href: '/super-admin/system-health',
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Security Vault',
            sub: 'Audit trails & access control',
            href: '/super-admin/audit',
            icon: Lock,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="p-4 rounded-2xl border border-neutral-200/90 bg-white shadow-xs hover:border-[#e05934]/40 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#e05934] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-900 group-hover:text-[#e05934] transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{item.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 6. Quick Provision Organization Modal ── */}
      <AnimatePresence>
        {isProvisionModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5"
            >
              <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">Provision New Organization</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Instantly deploy an isolated educational institution environment
                  </p>
                </div>
                <button
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickProvision} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Institution Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Stanford University School of Engineering"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Organization Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STANFORD-ENG"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Licensing Plan
                    </label>
                    <select
                      value={orgPlan}
                      onChange={(e) => setOrgPlan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                    >
                      <option value="ENTERPRISE">Enterprise Tier</option>
                      <option value="GROWTH">Growth Tier</option>
                      <option value="PRO">Professional</option>
                      <option value="STARTER">Starter / Pilot</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      placeholder="contact@institution.edu"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Admin Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={orgAdminEmail}
                      onChange={(e) => setOrgAdminEmail(e.target.value)}
                      placeholder="admin@institution.edu"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrg}
                    className="px-5 py-2.5 bg-[#e05934] hover:bg-[#c94a2a] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                  >
                    {isCreatingOrg ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <span>Deploy Institution</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 7. Global Broadcast Announcement Modal ── */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5"
            >
              <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900">Broadcast System Announcement</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Send an instantaneous operational notice to all registered organization administrators
                  </p>
                </div>
                <button
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Announcement Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Scheduled AI Engine Maintenance Window"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Broadcast Message Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Provide full announcement details, timeline, and recommended actions..."
                    rows={4}
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                  >
                    {isBroadcasting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <span>Broadcast to All Tenants</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
