'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, 
  Users, 
  Mail, 
  Shield, 
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useSystemStore } from '@/store/system.store';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('organization');

  // Form State
  const [institutionName, setInstitutionName] = useState('St. Xavier\'s Institute of Technology');
  const [adminEmail, setAdminEmail] = useState('admin@stx-tech.edu');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const { updateLocalSettings } = useSystemStore();

  const load = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        // Load Global Settings
        const res = await api.get('/admin/settings');
        if (res.data?.success) {
          const s = res.data.data;
          setInstitutionName(s.platformName || 'Vidya AI Education');
          // For super admin, admin email might not exist, mock it or use email from user
          setAdminEmail(user?.email || 'admin@vidya.ai');
        }
      } else {
        // Load Org Settings
        const res = await api.get('/admin/organization/settings');
        if (res.data?.success) {
          const s = res.data.data;
          setInstitutionName(s.platformName || 'Vidya AI Education');
          setLogoUrl(s.logoUrl || null);
          setAdminEmail(user?.email || 'admin@stx-tech.edu');
        }
      }
    } catch {
      toast.error('Failed to load settings');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isSuperAdmin, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (isSuperAdmin) {
        const payload = {
          platformName: institutionName,
        };
        const res = await api.put('/super-admin/settings', payload);
        if (res.data?.success) {
          toast.success('Global settings saved successfully!');
          updateLocalSettings(payload);
        }
      } else {
        const payload = {
          platformName: institutionName,
          // Mock sending adminEmail to backend.
          adminEmail,
          logoUrl: logoUrl || undefined
        };
        const res = await api.put('/admin/organization/settings', payload);
        if (res.data?.success) {
          toast.success('Organization profile saved successfully!');
          updateLocalSettings(payload);
        }
      }
    } catch (err) { 
      toast.error('Failed to save settings'); 
    }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'roles', label: 'Roles & Permissions', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={40} className="animate-spin text-[#F97316]" />
          <span className="text-gray-500 font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-12 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your institution's global configuration and workspace controls.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-100/80 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-gray-900' : 'text-gray-500'} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'organization' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
              <form onSubmit={handleSave}>
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Organization Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Global branding and institutional identity settings.</p>
                  </div>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="px-6 py-2 bg-black text-white text-sm font-bold rounded-3xl hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Institution Name</label>
                    <input 
                      type="text" 
                      value={institutionName} 
                      onChange={e => setInstitutionName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow text-gray-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Administrative Email</label>
                    <input 
                      type="email" 
                      value={adminEmail} 
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-shadow text-gray-800" 
                    />
                  </div>
                </div>

                {/* Brand Identity */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-4">Brand Identity</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-[20px] p-6 flex flex-col sm:flex-row items-center gap-6">
                    {/* Logo Preview */}
                    <div className="w-[120px] h-[120px] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 p-4">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center flex-col relative overflow-hidden">
                          {/* Placeholder visual resembling the mockup's book/logo */}
                          <div className="w-full h-2 bg-gray-50 absolute top-0 left-0"></div>
                          <div className="text-center mt-2">
                             <div className="flex justify-center mb-1">
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-800"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                             </div>
                             <div className="w-10 h-1 bg-gray-200 mx-auto mt-2 rounded"></div>
                             <div className="w-6 h-0.5 bg-gray-200 mx-auto mt-1 rounded"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Institutional Logo</h4>
                      <p className="text-[13px] text-gray-500 mb-4">SVG, PNG, or JPG (max 2MB). Recommended 512×512px.</p>
                      <div className="flex items-center gap-4">
                        <button type="button" className="px-4 py-1.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                          Upload New
                        </button>
                        <button type="button" onClick={() => setLogoUrl(null)} className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab !== 'organization' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield size={20} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Module Upcoming</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">The {tabs.find(t => t.id === activeTab)?.label} configuration module is currently being redesigned.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Footer */}
      <div className="mt-auto pt-16 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-gray-500">
        <div>© 2024 Vidya AI Ecosystem. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-gray-800 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-800 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-800 transition-colors">Security Overview</a>
        </div>
      </div>
    </div>
  );
}
