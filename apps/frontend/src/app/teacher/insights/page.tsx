'use client';

import { Users, AlertTriangle, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useClassInsights } from '@/hooks/useClassInsights';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { NativeSelect } from '@/components/ui/native-select';

export default function ClassInsightsPage() {
  const {
    classes,
    selectedClassId,
    setSelectedClassId,
    dashboardData,
    loadingClasses,
    loadingDashboard,
    error,
    refresh,
  } = useClassInsights();

  if (loadingClasses) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">No Classes Assigned</h2>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          You currently do not have any assigned classes or course cohorts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Academic Performance & Class Insights
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Real-time curriculum progression, student mastery levels, and attendance correlations
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-200/90 shadow-2xs">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Class:</span>
          <NativeSelect
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Grade {c.grade} - {c.section} ({c.academicYear})
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {loadingDashboard || !dashboardData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: 'TOTAL ROSTER',
                value: dashboardData.overview.totalStudents,
                sub: 'Active enrolled students',
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                title: 'ATTENDANCE RATE',
                value: `${dashboardData.overview.attendanceRate.toFixed(1)}%`,
                sub: '30-day average attendance',
                icon: CheckCircle2,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                title: 'COMPLETION RATE',
                value: `${dashboardData.overview.assignmentCompletionRate.toFixed(1)}%`,
                sub: 'Submissions delivered on time',
                icon: BookOpen,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                title: 'AVERAGE GRADE',
                value: `${dashboardData.overview.averageGrade.toFixed(1)}%`,
                sub: `${dashboardData.overview.atRiskCount} at-risk students`,
                icon: TrendingUp,
                color: 'text-[#e05934]',
                bg: 'bg-orange-50',
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">
                      {card.title}
                    </span>
                    <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-neutral-900">{card.value}</div>
                    <div className="text-xs text-neutral-500 font-medium mt-1">{card.sub}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Real-Time Telemetry Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Attendance Progression (30 Days)</h3>
                <p className="text-xs text-neutral-500 font-medium">Daily student check-in percentages</p>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.trends.attendance}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Attendance']}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Submission Volume Velocity</h3>
                <p className="text-xs text-neutral-500 font-medium">Weekly homework and exam submission load</p>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.trends.submissions}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#e05934"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#e05934' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Student Diagnostic Roster Table */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Student Mastery & Risk Diagnostics</h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Granular performance, submission rate, and academic standing per student
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{dashboardData.overview.atRiskCount} Students Requiring Intervention</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Roll ID</th>
                    <th className="py-3 px-6">Attendance</th>
                    <th className="py-3 px-6">Submissions</th>
                    <th className="py-3 px-6">Avg Score</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {dashboardData.studentInsights.map((student) => (
                    <tr key={student.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-neutral-900">{student.name}</td>
                      <td className="py-3.5 px-6 text-neutral-500 font-medium">{student.rollNo}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${student.attendanceRate < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${student.attendanceRate}%` }}
                            />
                          </div>
                          <span className="font-semibold text-neutral-700">{student.attendanceRate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-neutral-700">
                        {student.assignmentCompletionRate.toFixed(0)}%
                      </td>
                      <td className="py-3.5 px-6 font-bold text-neutral-900">
                        {student.averageGrade !== null ? `${student.averageGrade.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {student.isAtRisk ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dashboardData.studentInsights.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400 font-medium">
                        No student diagnostic records available for this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
