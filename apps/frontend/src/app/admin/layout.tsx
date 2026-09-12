'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    const hasAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (!hasAdminRole) return;
    if (user?.forcePasswordReset) setShowResetModal(true);
    else setShowResetModal(false);
  }, [user, isAuthenticated, isLoading, router]);

  const handleForceReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    try {
      setResetting(true);
      const res = await api.post('/admin/users/self/reset-password-force', { newPassword });
      if (res.data?.success) {
        toast.success('Password changed successfully!');
        setShowResetModal(false);
        if (user) useAuthStore.setState({ user: { ...user, forcePasswordReset: false } });
      }
    } catch (err: any) { toast.error(err.message || 'Failed to update password.'); }
    finally { setResetting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAdminRole = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  if (!isAuthenticated || !hasAdminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-sm mb-6">You do not have administrative privileges to access this area.</p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-all shadow-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-blue-600" />
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
              <KeyRound size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Your Password</h2>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">
              This is your first login or your password has been reset. Please set a strong password.
            </p>
            <form onSubmit={handleForceReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} required value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 pr-10"
                    placeholder="Enter new password" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 pr-10"
                    placeholder="Confirm new password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={resetting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md mt-2 disabled:opacity-50">
                {resetting ? 'Updating...' : 'Update Password & Enter'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
