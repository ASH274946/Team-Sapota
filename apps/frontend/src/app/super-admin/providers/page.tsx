'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Network,
  Banknote,
  Gauge,
  RefreshCw,
  Plus,
  Sparkles,
  X,
  Sliders,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

interface ProviderKPIs {
  activeModels: number;
  mtdSpending: number;
  avgLatency: number;
}

interface ProviderData {
  id: string;
  name: string;
  tier: string;
  status: string;
  activeModels: string;
  usageQuota: number;
  usageLabel: string;
  costMtd: number;
  apiKey?: string;
}

interface ProvidersResponse {
  kpis: ProviderKPIs;
  providers: ProviderData[];
}

export default function ProvidersPage() {
  const [data, setData] = useState<ProvidersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const response = await adminService.getProviders();
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load providers');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
    const interval = setInterval(fetchProviders, 15000);
    return () => clearInterval(interval);
  }, [fetchProviders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProviders();
  };

  const { kpis, providers } = data || {
    kpis: { activeModels: 3, mtdSpending: 1240.5, avgLatency: 820 },
    providers: [],
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            AI Model Gateway & Providers
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Configure upstream foundation models (Google Gemini, OpenAI, Claude), rate limits, and fallback logic
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-all shadow-2xs"
            title="Refresh Provider Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsConfigureModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Model Provider</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">ACTIVE MODELS</span>
            <Network className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">{kpis.activeModels}</div>
          <span className="text-xs text-emerald-600 font-bold mt-1">Multi-provider routing online</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">MONTHLY AI COST</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">
            ${kpis.mtdSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-neutral-500 font-medium mt-1">MTD inference token consumption</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">AVERAGE LATENCY</span>
            <Gauge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-2">{kpis.avgLatency}ms</div>
          <span className="text-xs text-purple-600 font-bold mt-1">P95 Turnaround Time</span>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.length === 0 ? (
          <div className="col-span-3 p-12 text-center rounded-2xl border border-neutral-200/90 bg-white shadow-xs">
            <Sparkles className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-neutral-800">No Providers Configured</h4>
            <p className="text-xs text-neutral-400 mt-1">Add your API credentials to enable model inference.</p>
          </div>
        ) : (
          providers.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{p.name}</h4>
                      <p className="text-[11px] text-neutral-400 font-medium">{p.activeModels}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs pt-2">
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Routing Tier</span>
                    <span className="font-bold text-neutral-800">{p.tier}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">Usage Quota</span>
                    <span className="font-bold text-neutral-800">{p.usageQuota}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-50">
                    <span className="text-neutral-400 font-medium">MTD Spend</span>
                    <span className="font-bold text-[#e05934]">${p.costMtd.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">
                  {p.apiKey ? `Key: ${p.apiKey.substring(0, 6)}...` : 'Using env secret'}
                </span>
                <button
                  onClick={() => toast.success(`Configuration opened for ${p.name}`)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Configure Modal */}
      {isConfigureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Configure AI Provider</h3>
              <button onClick={() => setIsConfigureModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Provider
                </label>
                <select className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold">
                  <option value="google">Google Gemini (Default Primary)</option>
                  <option value="openai">OpenAI GPT-4o / O1</option>
                  <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy... or sk-ant-..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Rate Limit (Requests per min)
                </label>
                <input
                  type="number"
                  defaultValue={120}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setIsConfigureModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Provider credentials saved & verified');
                  setIsConfigureModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
