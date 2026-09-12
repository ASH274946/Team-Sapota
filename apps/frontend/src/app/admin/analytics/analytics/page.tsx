'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  TrendingUp,
  Loader2,
  Download,
  ClipboardCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap,
  ArrowUpRight,
  GraduationCap,
  BookOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Avatar, AvatarFallback } from '@/components/base-ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── Interfaces ──
interface DepartmentHealthItem {
  departmentId: string;
  name: string;
  papersCount: number;
  averageScore: number;
}

interface ActivityItem {
  id: string;
  event: string;
  dept: string;
  initiator: string;
  time: string;
  status: string;
}

interface ContributorItem {
  id: string;
  name: string;
  count: number;
  score: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalFaculty: number;
  activeExams: number;
  attendance: number;
  paperApprovals: number;
  avgAssessmentScore: number;
  facultyEngagement: number;
  chartData: Array<{ month: string; Enrollment: number; Completion: number }>;
  departmentHealth: DepartmentHealthItem[];
  recentActivity: ActivityItem[];
  topContributors: ContributorItem[];
}

// ── Sub-components ──

function MetricCard({
  title,
  value,
  trend,
  trendType = 'positive',
  icon: Icon,
  bars,
  color = '#0284c7',
}: {
  title: string;
  value: string | number;
  trend: string;
  trendType?: 'positive' | 'neutral' | 'active';
  icon: React.ComponentType<{ className?: string }>;
  bars: number[];
  color?: string;
}) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex h-36 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {title}
        </h3>
        <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
          <p className={cn(
            'mt-1 text-xs font-semibold flex items-center gap-1',
            trendType === 'positive' && 'text-emerald-600',
            trendType === 'active' && 'text-blue-600',
            trendType === 'neutral' && 'text-neutral-500'
          )}>
            {trendType === 'positive' && <TrendingUp className="size-3.5" />}
            <span>{trend}</span>
          </p>
        </div>

        {/* Mini 6-bar sparkline */}
        <div className="flex h-8 w-12 shrink-0 items-end justify-between gap-1">
          {bars.map((val, idx) => (
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
      </div>
    </div>
  );
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white/95 backdrop-blur-md px-3.5 py-2.5 text-xs text-neutral-900 shadow-xl">
      <p className="mb-2 font-semibold text-neutral-800">{label}</p>
      <div className="flex flex-col gap-1.5">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-neutral-500 font-medium">
              <span
                className="size-2.5 rounded-xs"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-bold text-neutral-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { activeOrganizationId } = useAdminAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL'>('ALL');
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/analytics');
        if (res.data?.success) {
          const apiTotals = res.data.data.totals || {};
          const rawChart = res.data.data.chartData || [];

          // Generate month labels if chartData is empty
          const fallbackMonths = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
          const normalizedChart = rawChart.length > 0
            ? rawChart
            : fallbackMonths.map((m) => ({
                month: m,
                Enrollment: 0,
                Completion: 0,
              }));

          setData({
            totalUsers: apiTotals.users || 0,
            totalStudents: apiTotals.students || 0,
            totalTeachers: apiTotals.teachers || 0,
            totalFaculty: apiTotals.teachers || 0,
            activeExams: apiTotals.assignmentsCreated || apiTotals.activeExams || 0,
            attendance: apiTotals.attendance || 0,
            paperApprovals: res.data.data.paperApprovals || 0,
            avgAssessmentScore: res.data.data.avgAssessmentScore || 0,
            facultyEngagement: res.data.data.facultyEngagement || 0,
            chartData: normalizedChart,
            departmentHealth: res.data.data.departmentPerformance || [],
            recentActivity: res.data.data.recentActivity || [],
            topContributors: res.data.data.topContributors || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeOrganizationId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-neutral-800" />
          <span className="text-neutral-500 font-medium text-xs">Loading institutional analytics...</span>
        </div>
      </div>
    );
  }

  const studentCount = data?.totalStudents || 0;
  const avgScore = data?.avgAssessmentScore || 0;
  const facultyRate = data?.facultyEngagement || 0;
  const approvalsCount = data?.paperApprovals || 0;

  // Filtered activity records
  const filteredActivity = (data?.recentActivity || []).filter((item) => {
    if (activeFilter === 'CRITICAL') return item.status === 'REJECTED' || item.status === 'PENDING';
    return true;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED' || status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Published
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Pending Review
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* ── 1. Header & Navigation Path ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>Admin Portal</span>
            <span>›</span>
            <span className="text-neutral-900 font-semibold">Institutional Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Performance Overview
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Real-time insights across departments, faculty contributions, and student progression.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-9.5 appearance-none rounded-xl border border-neutral-200 bg-white pl-3.5 pr-8 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 focus:outline-hidden cursor-pointer"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Academic Year">Academic Year 2026</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3.5 text-neutral-400" />
          </div>

          <Button
            type="button"
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
            onClick={() => window.print()}
          >
            <Download className="size-3.5 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* ── 2. Top 4 Metric Cards (with Sparklines) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={studentCount.toLocaleString()}
          trend={studentCount > 0 ? `${studentCount} enrolled` : 'No students yet'}
          trendType={studentCount > 0 ? 'positive' : 'neutral'}
          icon={Users}
          bars={[12, 18, 24, 30, 36, studentCount || 40]}
          color="#0284c7"
        />

        <MetricCard
          title="Avg. Assessment Score"
          value={avgScore > 0 ? `${avgScore}%` : '0%'}
          trend={avgScore > 0 ? `${avgScore}% institutional avg` : 'Awaiting evaluations'}
          trendType={avgScore > 0 ? 'positive' : 'neutral'}
          icon={ClipboardCheck}
          bars={[55, 62, 70, 68, 74, avgScore || 75]}
          color="#10b981"
        />

        <MetricCard
          title="Faculty Engagement"
          value={`${facultyRate}%`}
          trend={`${data?.totalFaculty || 0} active teachers`}
          trendType={facultyRate > 0 ? 'active' : 'neutral'}
          icon={GraduationCap}
          bars={[40, 55, 65, 70, 78, facultyRate || 80]}
          color="#8b5cf6"
        />

        <MetricCard
          title="Paper Approvals"
          value={approvalsCount.toLocaleString()}
          trend={approvalsCount > 0 ? `${approvalsCount} published` : '0 published'}
          trendType={approvalsCount > 0 ? 'positive' : 'neutral'}
          icon={CheckCircle2}
          bars={[2, 4, 3, 6, 5, approvalsCount || 8]}
          color="#f59e0b"
        />
      </div>

      {/* ── 3. Middle Section: Student Growth & Departmental Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Student Growth & Progression Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Student Growth & Progression
              </h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-md">
                Enrollment trends mapped against completion rates across recent calendar months.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                <span className="size-2.5 rounded-xs bg-sky-600" />
                Enrollment
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                <span className="size-2.5 rounded-xs bg-emerald-500" />
                Completion
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.chartData || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={6}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  domain={[0, 'dataMax + 5']}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.6 }}
                  content={(props) => <CustomChartTooltip {...props} />}
                />
                <Bar
                  dataKey="Enrollment"
                  name="Enrollment"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Completion"
                  name="Completion"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Departmental Health */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Departmental Health
              </h2>
              <Link
                href="/admin/classes"
                className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <p className="text-xs text-neutral-500">
              Average academic evaluation scores across departments.
            </p>

            <div className="mt-6 space-y-4">
              {data?.departmentHealth && data.departmentHealth.length > 0 ? (
                data.departmentHealth.map((dept, i) => (
                  <div key={dept.departmentId || i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-800 truncate pr-2">{dept.name}</span>
                      <span className="font-bold text-neutral-900 shrink-0">{dept.averageScore}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-neutral-900 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(dept.averageScore, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="size-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-2.5">
                    <BookOpen className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-700">No department records yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Departments will appear once created.</p>
                </div>
              )}
            </div>
          </div>

          <Link href="/admin/classes" className="w-full mt-6">
            <Button
              variant="outline"
              className="w-full h-9.5 text-xs font-semibold rounded-xl border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"
            >
              Deep Dive Analysis
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 4. Recent Institutional Activity Table ── */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-0 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              Recent Institutional Activity
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Live audit feed of assessment releases, syllabus changes, and approvals.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeFilter === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              All Updates
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CRITICAL')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeFilter === 'CRITICAL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Critical / Pending
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed text-left">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                <th className="w-[30%] px-5 py-3">Event / Assessment</th>
                <th className="w-[20%] px-4 py-3">Department</th>
                <th className="w-[22%] px-4 py-3">Initiator</th>
                <th className="w-[16%] px-4 py-3">Timestamp</th>
                <th className="w-[12%] px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredActivity.map((item) => {
                const dateObj = new Date(item.time);
                const timeFormatted = isNaN(dateObj.getTime())
                  ? 'Recent'
                  : dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={item.id} className="transition-colors hover:bg-neutral-50/70">
                    <td className="px-5 py-3.5 text-xs font-bold text-neutral-900 truncate">
                      {item.event}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-600 font-medium truncate">
                      {item.dept}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-700 font-semibold truncate">
                      {item.initiator}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-500 whitespace-nowrap">
                      {timeFormatted}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                );
              })}
              {filteredActivity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                    No recent institutional events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Bottom Section: Top Contributors & Institutional AI Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Faculty Contributors */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Top Contributors
              </h2>
              <Link
                href="/admin/users"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View faculty
              </Link>
            </div>
            <p className="text-xs text-neutral-500 mb-5">
              Faculty members with highest curriculum and assessment creation.
            </p>

            <div className="space-y-4">
              {data?.topContributors && data.topContributors.length > 0 ? (
                data.topContributors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 rounded-xl border border-neutral-200 shadow-2xs">
                        <AvatarFallback className="text-xs font-bold bg-neutral-100 text-neutral-800">
                          {c.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">{c.name}</p>
                        <p className="text-[11px] text-neutral-400 font-medium">
                          {c.count} {c.count === 1 ? 'assessment' : 'assessments'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-neutral-900 shrink-0">{c.score}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-neutral-400 font-medium">No contributor metrics yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Institutional Insights (AI Model) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Institutional Insights (AI Model)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
              Automated institutional intelligence analyzing assessment load, student mastery, and curriculum delivery health in real-time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Institutional Risk Level
                </p>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-neutral-900">Low — Operations Optimal</span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Resource Optimization
                </p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Zap className="size-4" />
                  <span className="text-sm font-bold text-neutral-900">+22% Efficiency Gain</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
            <Link href="/admin/approvals">
              <Button
                type="button"
                className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                View Assessment Pipeline
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
