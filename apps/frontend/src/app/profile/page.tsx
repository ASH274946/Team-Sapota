'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/design-system/PageHeader';
import { LoadingState } from '@/design-system/LoadingState';
import { User, Mail, Building2, Pencil, Clock, Globe } from 'lucide-react';
import { EditProfile, ProfileData } from '@/components/ui/EditProfile';
import { getDefaultAvatarByGender } from '@/config/avatars.config';
import { apiClient } from '@/services/api.client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <LoadingState lines={6} />;

  const formattedRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase().replace('_', ' ') : 'Student';
  const userGender = (user?.preferences?.gender as 'male' | 'female' | 'other') || 'male';

  const initialData: ProfileData = {
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
    email: user?.email || '',
    gender: userGender,
    timezone: user?.preferences?.timezone || 'GMT-8',
    role: formattedRole,
    avatarUrl: user?.avatar || getDefaultAvatarByGender(userGender),
    lastUpdated: user?.preferences?.lastUpdated || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const handleSaveProfile = async (updated: ProfileData) => {
    try {
      const parts = updated.fullName.trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      const updatedPrefs = {
        ...(user?.preferences || {}),
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
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Profile"
        subtitle="View and manage your profile information."
      />

      <div style={{
        maxWidth: 640,
        padding: 24,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#FFEDD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: '#EA580C',
              overflow: 'hidden'
            }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.firstName?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#111827' }}>
                {user?.firstName} {user?.lastName}
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>
                {user?.preferences?.title || user?.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#0F0F0F',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#222222')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0F0F0F')}
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <Mail size={18} color="#9CA3AF" />
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Email</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <Globe size={18} color="#9CA3AF" />
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Timezone</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.preferences?.timezone || 'GMT-8'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
            <Clock size={18} color="#9CA3AF" />
            <div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Working Hours</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.preferences?.workingHours || '9:00 AM - 5:00 PM'}</p>
            </div>
          </div>

          {user?.organizationName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid #E5E7EB' }}>
              <Building2 size={18} color="#9CA3AF" />
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Organization</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{user.organizationName}</p>
              </div>
            </div>
          )}

          {user?.departmentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <User size={18} color="#9CA3AF" />
              <div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 2 }}>Department</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{user.departmentName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditProfile
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        initialData={initialData}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

