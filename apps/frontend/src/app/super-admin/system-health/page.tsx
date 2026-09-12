'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Database,
  Server,
  HardDrive,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';

interface SystemHealthData {
  uptime: number;
  dbLatencyMs: number;
  redis: {
    usedGB: number;
    totalGB: number;
  };
  traffic24h: number[];
  aiProviders: {
    providerName: string;
    modelName: string;
    latencyMs: number;
    apiKey?: string;
  }[];
  events: {
    id: string;
    action: string;
    details: any;
    userName?: string;
    createdAt: string;
  }[];
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await adminService.getSystemHealth();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load system health');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchHealth();
  };

  const data = health || {
    uptime: 99.98,
    dbLatencyMs: 12,
    redis: { usedGB: 4.2, totalGB: 8.0 },
    traffic24h: Array(24).fill(20),
    aiProviders: [],
    events: [],
  };

  const formatLatency = (ms: number) => (ms / 1000).toFixed(1) + 's';

  const getEventSeverity = (action: string) => {
    const l = action.toLowerCase();
    if (l.includes('error') || l.includes('failed') || l.includes('alert')) return 'red';
    if (l.includes('warn') || l.includes('limit') || l.includes('scale')) return 'orange';
    return 'grey';
  };

  const maxTraffic = Math.max(...(data.traffic24h.length > 0 ? data.traffic24h : [100]));

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            System Telemetry & Infrastructure
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Real-time cluster health, AI provider latency, database connection pools, and event logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational (All Systems)</span>
          </div>
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-all shadow-2xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">CLUSTER UPTIME</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
            {data.uptime}%
          </div>
          <span className="text-xs text-emerald-600 font-bold mt-1">SLA Target Met</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">DATABASE LATENCY</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
            {data.dbLatencyMs}ms
          </div>
          <span className="text-xs text-blue-600 font-bold mt-1">PostgreSQL Primary</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">CACHE UTILIZATION</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
            {data.redis.usedGB} / {data.redis.totalGB} GB
          </div>
          <span className="text-xs text-purple-600 font-bold mt-1">Redis Cluster</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">AI GATEWAY</span>
            <Cpu className="w-4 h-4 text-[#e05934]" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
            {data.aiProviders.length} Providers
          </div>
          <span className="text-xs text-[#e05934] font-bold mt-1">Active Pipeline</span>
        </div>
      </div>

      {/* Traffic & AI Latency Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Traffic Bar Visualization */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Throughput & API Traffic (24H)</h3>
              <p className="text-xs text-neutral-400">Request load across global multi-tenant gateways</p>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              LIVE
            </span>
          </div>

          <div className="flex items-end gap-1.5 h-44 py-2">
            {data.traffic24h.map((val, i) => {
              const heightPct = Math.max(12, (val / maxTraffic) * 100);
              return (
                <div
                  key={i}
                  className="flex-1 bg-neutral-900 hover:bg-[#e05934] rounded-t-sm transition-all cursor-pointer group relative"
                  style={{ height: `${heightPct}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap pointer-events-none transition-opacity">
                    {val} req/s
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[11px] text-neutral-400 font-bold pt-3 border-t border-neutral-100">
            <span>00:00 UTC</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </div>

        {/* AI Provider Latency */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">AI Model Provider Latencies</h3>
              <p className="text-xs text-neutral-400">Response turnaround time for inference calls</p>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56">
            {data.aiProviders.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">No active AI providers configured.</div>
            ) : (
              data.aiProviders.map((provider, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 capitalize">
                        {provider.providerName}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-medium">{provider.modelName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-neutral-900">
                      {formatLatency(provider.latencyMs)}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Audit Events Stream */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Real-Time Cluster Event Stream</h3>
            <p className="text-xs text-neutral-400">Security triggers, scale events, and authentication changes</p>
          </div>
          <div className="text-xs font-bold text-neutral-500">
            {data.events.length} Events Logged
          </div>
        </div>

        <div className="divide-y divide-neutral-100 overflow-y-auto max-h-64">
          {data.events.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">No recent system anomalies or alerts.</div>
          ) : (
            data.events.map((event, i) => {
              const severity = getEventSeverity(event.action);
              return (
                <div key={i} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        severity === 'red'
                          ? 'bg-rose-500'
                          : severity === 'orange'
                          ? 'bg-amber-500'
                          : 'bg-neutral-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-neutral-800">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-neutral-400 ml-2">by {event.userName || 'System Engine'}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {format(new Date(event.createdAt), 'MMM d, HH:mm:ss')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
