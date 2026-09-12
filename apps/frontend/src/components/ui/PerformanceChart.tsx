'use client';

import { useMemo } from 'react';
import type { FC } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

export interface PerformanceDataItem {
  date: string;
  visitors: number;
}

export interface PerformanceChartProps {
  title?: string;
  description?: string;
  data?: PerformanceDataItem[];
  footerNote?: string;
}

const DEFAULT_CHART_DATA: PerformanceDataItem[] = [
  { date: '2025-01-01', visitors: 210 },
  { date: '2025-01-02', visitors: 320 },
  { date: '2025-01-03', visitors: 150 },
  { date: '2025-01-04', visitors: 400 },
  { date: '2025-01-05', visitors: 90 },
  { date: '2025-01-06', visitors: 275 },
  { date: '2025-01-07', visitors: 350 },
  { date: '2025-01-08', visitors: 500 },
  { date: '2025-01-09', visitors: 120 },
  { date: '2025-01-10', visitors: 380 },
  { date: '2025-01-11', visitors: 60 },
  { date: '2025-01-12', visitors: 420 },
  { date: '2025-01-13', visitors: 200 },
  { date: '2025-01-14', visitors: 310 },
  { date: '2025-01-15', visitors: 180 },
  { date: '2025-01-16', visitors: 390 },
  { date: '2025-01-17', visitors: 470 },
  { date: '2025-01-18', visitors: 130 },
  { date: '2025-01-19', visitors: 260 },
  { date: '2025-01-20', visitors: 340 },
  { date: '2025-01-21', visitors: 210 },
  { date: '2025-01-22', visitors: 370 },
  { date: '2025-01-23', visitors: 490 },
  { date: '2025-01-24', visitors: 110 },
  { date: '2025-01-25', visitors: 150 },
  { date: '2025-01-26', visitors: 410 },
  { date: '2025-01-27', visitors: 430 },
  { date: '2025-01-28', visitors: 170 },
  { date: '2025-01-29', visitors: 95 },
  { date: '2025-01-30', visitors: 460 },
  { date: '2025-01-31', visitors: 300 }
];

export const PerformanceChart: FC<PerformanceChartProps> = ({
  title = 'Student Performance Stats',
  description = 'Track daily performance and score trends for the selected period.',
  data = DEFAULT_CHART_DATA,
  footerNote = 'Analyze your academic progress and adjust study focus for improved test results.'
}) => {
  const chartData = data.length > 0 ? data : DEFAULT_CHART_DATA;
  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.visitors, 0), [chartData]);

  return (
    <div className="w-full rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 dark:border-neutral-800">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
          <CalendarIcon className="w-4 h-4 text-blue-500" />
          <span>Active Assessment Period</span>
        </div>
      </div>

      <div className="pt-6 pb-2">
        <div className="h-64 w-full">
          <BarChart
            width={520}
            height={240}
            data={chartData}
            margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
            className="w-full"
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={(value) => {
                const d = new Date(value);
                return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { day: 'numeric' });
              }}
            />
            <Bar dataKey="visitors" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </div>

        <div className="mt-5 text-center text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {footerNote}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300 font-medium">
        <span>Total Points Earned</span>
        <span className="font-bold text-neutral-900 dark:text-white text-base">{total.toLocaleString()} pts</span>
      </div>
    </div>
  );
};

export default PerformanceChart;
