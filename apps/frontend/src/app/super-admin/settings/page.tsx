'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  AlertTriangle,
  Loader2,
  Save,
  Cpu,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemStore } from '@/store/system.store';
import { NativeSelect } from '@/components/ui/native-select';

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);

  const [platformName, setPlatformName] = useState('Vidya AI Platform');
  const [brandColor, setBrandColor] = useState('#e05934');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [timezone, setTimezone] = useState('UTC-5:00 Eastern Time (US & Canada)');
  const [retentionPolicy, setRetentionPolicy] = useState('90 Days');

  const [enableAiAnalytics, setEnableAiAnalytics] = useState(true);
  const [notifyApiSpikes, setNotifyApiSpikes] = useState(true);
  const [forceMfa, setForceMfa] = useState(false);

  const { updateLocalSettings } = useSystemStore();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      if (res.data?.success) {
        const s = res.data.data;
        if (s.platformName) setPlatformName(s.platformName);
        if (s.brandColor) setBrandColor(s.brandColor);
        if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode);
        if (s.defaultTimezone) setTimezone(s.defaultTimezone);
        if (s.dataRetentionDays !== undefined) setRetentionPolicy(`${s.dataRetentionDays} Days`);
        if (s.enableAiAnalytics !== undefined) setEnableAiAnalytics(s.enableAiAnalytics);
        if (s.notifyApiSpikes !== undefined) setNotifyApiSpikes(s.notifyApiSpikes);
        if (s.forceMfa !== undefined) setForceMfa(s.forceMfa);
      }
      const intRes = await api.get('/super-admin/integrations');
      if (intRes.data?.success) {
        setIntegrations(intRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        platformName,
        brandColor,
        maintenanceMode,
        defaultTimezone: timezone,
        dataRetentionDays: parseInt(retentionPolicy.split(' ')[0]),
        enableAiAnalytics,
        notifyApiSpikes,
        forceMfa,
      };

      const res = await api.put('/super-admin/settings', payload);

      if (res.data?.success) {
        toast.success('System configuration saved');
        updateLocalSettings(payload);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 flex flex-col gap-6 text-slate-900 font-sans">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            System Configuration
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Global parameters, white-label branding, security policies, and API connections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branding & Platform Identity */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <Building2 className="w-4 h-4 text-[#e05934]" />
                <h3 className="text-sm font-bold text-neutral-900">Branding & Platform Identity</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Primary Brand Hex Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Integrations */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-neutral-900">Ecosystem Integrations & LLMs</h3>
                </div>
              </div>

              <div className="space-y-3">
                {integrations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400">
                    Google Gemini, OpenAI, and Anthropic APIs configured via system environment.
                  </div>
                ) : (
                  integrations.map((int) => (
                    <div
                      key={int.id}
                      className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-bold text-xs flex items-center justify-center">
                          {int.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">{int.name}</h4>
                          <p className="text-[11px] text-neutral-400">{int.description}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {int.status || 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* System Preferences */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <Globe className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-neutral-900">Global System Preferences</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Default Timezone
                  </label>
                  <NativeSelect
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium"
                  >
                    <option value="UTC-5:00 Eastern Time (US & Canada)">UTC-5:00 Eastern Time</option>
                    <option value="UTC+5:30 Indian Standard Time (IST)">UTC+5:30 IST</option>
                    <option value="UTC+0:00 Greenwich Mean Time (GMT)">UTC+0:00 GMT</option>
                  </NativeSelect>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Audit Data Retention
                  </label>
                  <NativeSelect
                    value={retentionPolicy}
                    onChange={(e) => setRetentionPolicy(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="365 Days">1 Year</option>
                  </NativeSelect>
                </div>
              </div>
            </div>

            {/* Security Policies */}
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Security & Access Rules</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={forceMfa}
                    onChange={(e) => setForceMfa(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e05934] focus:ring-[#e05934]"
                  />
                  <span className="text-xs font-bold text-neutral-800">
                    Enforce Multi-Factor Authentication (MFA)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={notifyApiSpikes}
                    onChange={(e) => setNotifyApiSpikes(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e05934] focus:ring-[#e05934]"
                  />
                  <span className="text-xs font-bold text-neutral-800">
                    Notify On Inference Rate Spikes
                  </span>
                </label>
              </div>
            </div>

            {/* Emergency Controls */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900">Critical Controls</h3>
              </div>
              <p className="text-xs text-rose-700/80 leading-relaxed">
                Emergency maintenance mode restricts access to super admins while preserving background database jobs.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-rose-900">Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={() => setMaintenanceMode(!maintenanceMode)}
                  className="w-4 h-4 rounded text-rose-600"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
