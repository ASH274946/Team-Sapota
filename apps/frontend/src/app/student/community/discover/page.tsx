'use client';

import React, { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useDiscoverMembers } from './hooks/useDiscoverMembers';
import { MemberCard } from './components/MemberCard';
import { FeaturedMemberCard } from './components/FeaturedMemberCard';
import { InviteMembersDialog } from '@/components/ui/InviteMembersDialog';

export default function DiscoverPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const {
    members,
    loading,
    error,
    followingMap,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    handleToggleFollow,
  } = useDiscoverMembers();

  const ROLES = ['ALL', 'STUDENT', 'TEACHER', 'FACULTY', 'ADMIN'];

  return (
    <div style={{ minHeight: '100%', background: '#f8fafc', fontFamily: 'inherit', overflowY: 'auto', width: '100%' }}>
      <div style={{ width: '100%', padding: '40px 32px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Connect</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500, maxWidth: 560 }}>
            Discover and follow members in your organization to build your academic network.
          </p>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28, flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, flex: 1 }}>
            {ROLES.map(role => (
              <button key={role} onClick={() => setSelectedRole(role as any)} style={{
                height: 36, borderRadius: 100, padding: '0 16px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                borderColor: selectedRole === role ? '#2563eb' : '#e2e8f0',
                background: selectedRole === role ? '#2563eb' : '#fff',
                color: selectedRole === role ? '#fff' : '#64748b',
                transition: 'all .15s',
              }}>
                {role === 'ALL' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ position: 'relative', display: 'block' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8', pointerEvents: 'none' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Find people or groups..."
                style={{ height: 38, borderRadius: 10, border: '1.5px solid #e2e8f0', paddingLeft: 34, paddingRight: 14, fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', background: '#fff', width: 220 }} />
            </label>
            <button onClick={() => setIsInviteOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 18px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', whiteSpace: 'nowrap' as const }}>
              + Invite Peer
            </button>
          </div>
        </div>

        <InviteMembersDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={32} style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff5f5', borderRadius: 20, border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: 12, height: 36, borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 16px' }}>Retry</button>
          </div>
        ) : (
          <>
            {/* Members grid — CSS Grid so featured card spans 2 cols naturally */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {/* Featured card spans 2 columns */}
              <div style={{ gridColumn: 'span 2' }}>
                <FeaturedMemberCard />
              </div>

              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isFollowing={!!followingMap[member.id]}
                  onToggleFollow={handleToggleFollow}
                />
              ))}
            </div>

            {/* Empty state if no members */}
            {members.length === 0 && (
              <div style={{ marginTop: 24, border: '2px dashed #e2e8f0', borderRadius: 20, padding: '60px 24px', textAlign: 'center', background: '#fff' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Search size={24} style={{ color: '#2563eb' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Looking for someone specific?</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 20px' }}>Try searching for their department or research interest in the search bar above.</p>
                <button onClick={() => { setSearchQuery(''); setSelectedRole('ALL'); }} style={{ height: 38, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px' }}>
                  Advanced Directory Search
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
