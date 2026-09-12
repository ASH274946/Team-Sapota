'use client';
import { NativeSelect } from '@/components/ui/native-select';

 

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Database, ChevronRight, Building2,
  Loader2, Check, Moon, Sun, Globe, Key, Smartphone, Download, Trash2, Save, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api.client';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  organizationName: string;
  departmentName?: string;
  preferences?: Record<string, boolean>;
}

type SectionId = 'account' | 'school' | 'notifications' | 'appearance' | 'privacy' | 'data';

const SETTINGS_SECTIONS: { id: SectionId; title: string; icon: React.ComponentType<{ size?: number; color?: string }>; iconBg: string; iconColor: string }[] = [
  { id: 'account', title: 'Account', icon: User, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
  { id: 'school', title: 'School & Institution', icon: Building2, iconBg: '#FFF0E8', iconColor: '#E8531D' },
  { id: 'notifications', title: 'Notifications', icon: Bell, iconBg: '#FEF3C7', iconColor: '#D97706' },
  { id: 'appearance', title: 'Appearance', icon: Palette, iconBg: '#D1FAE5', iconColor: '#059669' },
  { id: 'privacy', title: 'Privacy & Security', icon: Shield, iconBg: '#DBEAFE', iconColor: '#2563EB' },
  { id: 'data', title: 'Data & Storage', icon: Database, iconBg: '#FCE7F3', iconColor: '#DB2777' },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button role="switch" aria-checked={enabled} onClick={onChange} style={{ width: 44, height: 24, borderRadius: 100, background: enabled ? 'var(--brand)' : 'var(--border-strong)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: enabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}
function PasswordInput({ label, placeholder, value, onChange, style }: { label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; style?: React.CSSProperties }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group" style={style}>
      <label className="label">{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={show ? "text" : "password"}
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ width: '100%', paddingRight: 40 }}
        />
        <button
          type="button"
          onMouseDown={() => setShow(true)}
          onMouseUp={() => setShow(false)}
          onMouseLeave={() => setShow(false)}
          onTouchStart={() => setShow(true)}
          onTouchEnd={() => setShow(false)}
          style={{
            position: 'absolute',
            right: 12,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
}

function SectionPanel({ id, onClose, profile, onProfileUpdate }: { id: SectionId; onClose: () => void; profile: UserProfile | null; onProfileUpdate: () => void }) {
  switch (id) {
    case 'account':
      return <AccountPanel onClose={onClose} profile={profile} onProfileUpdate={onProfileUpdate} />;
    case 'school':
      return <SchoolPanel onClose={onClose} profile={profile} onProfileUpdate={onProfileUpdate} />;
    case 'notifications':
      return <NotificationsPanel onClose={onClose} profile={profile} onProfileUpdate={onProfileUpdate} />;
    case 'appearance':
      return <AppearancePanel onClose={onClose} profile={profile} onProfileUpdate={onProfileUpdate} />;
    case 'privacy':
      return <PrivacyPanel onClose={onClose} />;
    case 'data':
      return <DataPanel onClose={onClose} />;
    default:
      return null;
  }
}

function AccountPanel({ onClose, profile, onProfileUpdate }: { onClose: () => void; profile: UserProfile | null; onProfileUpdate: () => void }) {
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const [name, setName] = useState(fullName);
  const [email, setEmail] = useState(profile?.email || '');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || 'User';
    const lastName = parts.slice(1).join(' ') || 'Name';
    try {
      await apiClient.put('/auth/me', { firstName, lastName, email: email.trim(), avatar });
      
      if (showPasswordChange) {
        if (!currentPassword || !confirmPassword || !newPassword) {
          toast.error('Please fill all password fields');
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('New passwords do not match');
          setSaving(false);
          return;
        }
        await apiClient.put('/auth/me/password', { currentPassword, newPassword });
        toast.success('Profile and password updated');
        setShowPasswordChange(false);
        setCurrentPassword('');
        setConfirmPassword('');
        setNewPassword('');
      } else {
        toast.success('Profile updated');
      }
      
      onProfileUpdate();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Profile Information</h3>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #E8531D, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
          {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile ? `${profile.firstName[0]}${profile.lastName[0]}` : 'JD')}
        </div>
        <div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            Upload Avatar
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        </div>
      </div>

      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">Full Name</label>
        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">Email</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        {!showPasswordChange ? (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <button className="btn btn-ghost" style={{ color: 'var(--brand)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0, fontWeight: 600 }} onClick={() => setShowPasswordChange(true)}>Change Password</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Change Password</h3>
              <button className="btn btn-ghost" style={{ color: 'var(--brand)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 }} onClick={() => setShowPasswordChange(false)}>Cancel</button>
            </div>
            <PasswordInput
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            <PasswordInput
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ marginBottom: 20 }}
            />
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 6 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
        </button>
      </div>
    </div>
  );
}

function SchoolPanel({ onClose, profile, onProfileUpdate }: { onClose: () => void; profile: UserProfile | null; onProfileUpdate: () => void }) {
  const [school, setSchool] = useState(profile?.organizationName || '');
  const [dept, setDept] = useState(profile?.departmentName || 'Science');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/me/organization', {
        organizationName: school,
        department: dept,
        academicYear: year,
      });
      toast.success('School settings saved');
      onProfileUpdate();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save school settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>School & Institution</h3>
      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">School Name</label>
        <input type="text" className="input" value={school} onChange={(e) => setSchool(e.target.value)} />
      </div>
      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">Department</label>
        <NativeSelect className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
          {['Science', 'Mathematics', 'English', 'Social Studies', 'Languages', 'Arts', 'Physical Education'].map((d) => <option key={d}>{d}</option>)}
        </NativeSelect>
      </div>
      <div className="input-group" style={{ marginBottom: 20 }}>
        <label className="label">Academic Year</label>
        <input type="text" className="input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2025-2026" />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 6 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
      </div>
    </div>
  );
}

function NotificationsPanel({ onClose, profile, onProfileUpdate }: { onClose: () => void; profile: UserProfile | null; onProfileUpdate: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(profile?.preferences || {});
  const [saving, setSaving] = useState(false);
  const items = [
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates' },
    { key: 'inAppAlerts', label: 'In-App Alerts', desc: 'Show notifications in app' },
    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary email' },
    { key: 'assignmentUpdates', label: 'Assignment Updates', desc: 'Status changes on assignments' },
  ];

  const handleToggle = (key: string) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/me/preferences', { preferences: prefs });
      toast.success('Notification preferences saved');
      onProfileUpdate();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
            </div>
            <Toggle enabled={!!prefs[item.key]} onChange={() => handleToggle(item.key)} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 6 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
      </div>
    </div>
  );
}

function AppearancePanel({ onClose, profile, onProfileUpdate }: { onClose: () => void; profile: UserProfile | null; onProfileUpdate: () => void }) {
  const prefs = profile?.preferences || {};
  const [theme, setTheme] = useState(prefs.darkMode ? 'dark' : 'light');
  const [fontSize, setFontSize] = useState(prefs.fontSize || 'medium');
  const [lang, setLang] = useState('english');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const darkMode = theme === 'dark';
      await apiClient.put('/auth/me/preferences', {
        preferences: { ...prefs, darkMode, fontSize },
      });
      
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (fontSize === 'small') document.documentElement.style.fontSize = '14px';
      else if (fontSize === 'large') document.documentElement.style.fontSize = '18px';
      else document.documentElement.style.fontSize = '16px';

      toast.success('Appearance settings saved');
      onProfileUpdate();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save appearance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Appearance</h3>
      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">Theme</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button key={value} className={`btn btn-sm ${theme === value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTheme(value)} style={{ gap: 6, flex: 1 }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="input-group" style={{ marginBottom: 14 }}>
        <label className="label">Font Size</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ].map(({ value, label }) => (
            <button key={value} className={`btn btn-sm ${fontSize === value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFontSize(value)} style={{ flex: 1 }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="input-group" style={{ marginBottom: 20 }}>
        <label className="label">Language</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Globe size={16} color="var(--text-muted)" />
          <NativeSelect className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
            {['english', 'hindi', 'spanish', 'french'].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </NativeSelect>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ gap: 6 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
      </div>
    </div>
  );
}

function PrivacyPanel({ onClose }: { onClose: () => void }) {
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: any[] }>('/auth/me/sessions');
      setSessions(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    try {
      await apiClient.delete(`/auth/me/sessions/${id}`);
      toast.success('Session revoked');
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const parseDevice = (userAgent: string) => {
    if (!userAgent) return 'Unknown Device';
    const isMobile = /Mobile|Android|iP(hone|od|ad)/.test(userAgent);
    const browser = /Chrome/.test(userAgent) ? 'Chrome' : /Safari/.test(userAgent) ? 'Safari' : /Firefox/.test(userAgent) ? 'Firefox' : 'Browser';
    const os = /Windows/.test(userAgent) ? 'Windows' : /Mac OS/.test(userAgent) ? 'Mac' : /Linux/.test(userAgent) ? 'Linux' : /Android/.test(userAgent) ? 'Android' : /iOS/.test(userAgent) ? 'iOS' : 'Unknown OS';
    return `${browser} on ${os}`;
  };

  const deduplicatedSessions = useMemo(() => {
    const map = new Map<string, any>();
    sessions.forEach(s => {
      const device = parseDevice(s.userAgent);
      if (!map.has(device)) {
        map.set(device, s);
      }
    });
    return Array.from(map.values());
  }, [sessions]);

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Privacy & Security</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Key size={14} /> Two-Factor Authentication
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add an extra layer of security</div>
        </div>
        <Toggle enabled={twoFA} onChange={() => setTwoFA(!twoFA)} />
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Active Sessions</h4>
      {loadingSessions ? <div style={{ padding: 12, fontSize: 13, color: 'var(--text-muted)' }}>Loading sessions...</div> : deduplicatedSessions.map((s, i) => (
        <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < deduplicatedSessions.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <Smartphone size={16} color="var(--text-muted)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{parseDevice(s.userAgent)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.lastActive || s.createdAt).toLocaleString()}</div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => handleRevoke(s.id)}>Revoke</button>
        </div>
      ))}
      <div style={{ marginTop: 12, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { toast.success('Security settings saved'); onClose(); }} style={{ gap: 6 }}><Save size={14} /> Save</button>
      </div>
    </div>
  );
}

function DataPanel({ onClose }: { onClose: () => void }) {
  const [storageData, setStorageData] = useState<{ formattedUsed: string; formattedLimit: string; percentage: number } | null>(null);

  const fetchStorage = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/me/storage');
      setStorageData(res.data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { void fetchStorage(); }, [fetchStorage]);

  const storageUsed = storageData?.formattedUsed || '0 MB';
  const totalStorage = storageData?.formattedLimit || '100 MB';
  const pct = storageData?.percentage || 0;

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Data & Storage</h3>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Storage Used</span>
          <span style={{ fontWeight: 600 }}>{storageUsed} / {totalStorage}</span>
        </div>
        <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-secondary" style={{ gap: 6, justifyContent: 'center' }} onClick={() => toast.success('Data export started. You will receive an email when ready.')}>
          <Download size={14} /> Export All Data
        </button>
        <button className="btn btn-secondary" style={{ gap: 6, justifyContent: 'center', color: '#EF4444', borderColor: '#FECACA' }} onClick={() => { if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) { toast.success('Account deletion requested'); } }}>
          <Trash2 size={14} /> Delete Account
        </button>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={onClose} style={{ gap: 6 }}><Check size={14} /> Done</button>
      </div>
    </div>
  );
}

import { EditProfile, ProfileData } from '@/components/ui/EditProfile';
import { getDefaultAvatarByGender } from '@/config/avatars.config';
import { useAuthStore } from '@/store/auth.store';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: UserProfile }>('/auth/me');
      setProfile(res.data.data);
    } catch {
      // will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const prefs = profile?.preferences || {};
  const [toggles, setToggles] = useState([true, false, true, false]);
  // Sync toggles from profile prefs once loaded
  useEffect(() => {
    if (profile?.preferences) {
      setToggles([
        !!prefs.emailNotifications,
        !!prefs.darkMode,
        !!prefs.autoSave,
        !!prefs.weeklyDigest,
      ]);
    }
  }, [profile]);

  const handleToggleChange = async (index: number) => {
    const newToggles = toggles.map((v, j) => (j === index ? !v : v));
    setToggles(newToggles);
    try {
      await apiClient.put('/auth/me/preferences', {
        preferences: {
          emailNotifications: newToggles[0],
          darkMode: newToggles[1],
          autoSave: newToggles[2],
          weeklyDigest: newToggles[3],
        },
      });
    } catch {
      setToggles(toggles);
      toast.error('Failed to save preference');
    }
  };

  const formattedRole = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).toLowerCase().replace('_', ' ') : 'Student';
  const userGender = ((profile?.preferences as any)?.gender as 'male' | 'female' | 'other') || 'male';

  const initialProfileData: ProfileData = {
    fullName: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 'User',
    email: profile?.email || '',
    gender: userGender,
    timezone: (profile?.preferences as any)?.timezone || 'GMT-8',
    role: formattedRole,
    avatarUrl: profile?.avatar || getDefaultAvatarByGender(userGender),
    lastUpdated: (profile?.preferences as any)?.lastUpdated || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const handleSaveProfile = async (updated: ProfileData) => {
    try {
      const parts = updated.fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      const updatedPrefs = {
        ...(profile?.preferences || {}),
        gender: updated.gender,
        timezone: updated.timezone,
        lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      await apiClient.put('/auth/me/profile', {
        firstName,
        lastName,
        email: updated.email,
        avatar: updated.avatarUrl,
      });

      await apiClient.put('/auth/me/preferences', {
        preferences: updatedPrefs,
      });

      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              firstName,
              lastName,
              email: updated.email,
              avatar: updated.avatarUrl,
              preferences: updatedPrefs,
            }
          : null,
      }));

      toast.success('Profile updated successfully!');
      setIsEditProfileOpen(false);
      void loadProfile();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 40, color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" /> Loading settings...
        </div>
      </div>
    );
  }

  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}` : 'JD';

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="status-dot" aria-hidden="true" />
          <h1 className="page-title">Settings</h1>
        </div>
        <p className="page-subtitle">Manage your account preferences and application settings.</p>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="mobile-header-title">Settings</h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 16, marginBottom: 24 }}>
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 16, gridColumn: 'span 2' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #E8531D, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
            {profile?.avatar ? <img src={profile.avatar} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{profile?.firstName} {profile?.lastName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{profile?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Building2 size={13} color="var(--text-muted)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile?.organizationName}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm cursor-pointer" onClick={() => setIsEditProfileOpen(true)}>Edit Profile</button>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Quick Settings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Email notifications', desc: 'Receive updates about your assignments via email' },
            { label: 'Dark mode', desc: 'Switch between light and dark interface' },
            { label: 'Auto-save drafts', desc: 'Automatically save assignment drafts every 5 minutes' },
            { label: 'Weekly digest', desc: 'Get a weekly summary of your activity' },
          ].map((setting, i) => (
            <div key={setting.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{setting.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{setting.desc}</div>
              </div>
              <Toggle enabled={toggles[i]} onChange={() => handleToggleChange(i)} />
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
        {SETTINGS_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div key={section.id} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }} style={{ cursor: 'pointer' }} onClick={() => setActiveSection(section.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: section.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={section.iconColor} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{section.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Click to configure</span>
                <ChevronRight size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeSection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setActiveSection(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: 'var(--bg-card)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
              <SectionPanel id={activeSection} onClose={() => setActiveSection(null)} profile={profile} onProfileUpdate={loadProfile} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditProfile
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={initialProfileData}
        onSave={handleSaveProfile}
      />
    </div>
  );
}