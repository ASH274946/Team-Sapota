'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Member } from '../types';

interface MemberCardProps {
  member: Member;
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
}

const BlueBadge = () => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white shrink-0 ml-1 shadow-sm">
    <Check className="w-2.5 h-2.5 stroke-[4]" />
  </span>
);

export function MemberCard({ member, isFollowing, onToggleFollow }: MemberCardProps) {
  const rawRole = member.role.toUpperCase();
  const isStudent = rawRole.includes('STUDENT');

  // Premium badge styling based on roles
  let badgeStyles = 'bg-indigo-50 text-indigo-600 border-indigo-100';
  if (rawRole.includes('SUPER_ADMIN') || rawRole.includes('ADMIN')) {
    badgeStyles = 'bg-rose-50 text-rose-600 border-rose-100';
  } else if (rawRole.includes('TEACHER') || rawRole.includes('FACULTY')) {
    badgeStyles = 'bg-sky-50 text-sky-600 border-sky-100';
  } else if (isStudent) {
    badgeStyles = 'bg-blue-50 text-blue-600 border-blue-100';
  }

  return (
    <div
      className="bg-white border border-neutral-150 rounded-[20px] p-6 transition-all duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:scale-[1.01] flex flex-col items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.015)] relative group select-none"
      style={{ minHeight: '270px' }}
    >
      <div className="flex flex-col items-center w-full">
        {/* Avatar Container */}
        <div className="relative mb-5 p-1 border border-neutral-100 rounded-full bg-neutral-50/50">
          <img
            src={member.avatar_url}
            alt={member.full_name}
            className="w-20 h-20 rounded-full object-cover bg-neutral-50"
          />
          
          {/* Top Right Role Capsule Badge */}
          <span className={`absolute -top-1.5 -right-3 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wide shadow-sm ${badgeStyles}`}>
            {member.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : member.role}
          </span>
          
          {/* Bottom Right Online status indicator */}
          {member.isOnline && (
            <span className="absolute bottom-0 right-1 w-4 h-4 bg-[#10b981] border-2 border-white rounded-full flex items-center justify-center shadow-sm" title="Online now">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute opacity-75" />
            </span>
          )}
        </div>

        {/* Member Name with Badge */}
        <h3 className="font-bold text-[16px] text-neutral-900 leading-tight flex items-center justify-center">
          {member.full_name}
          <BlueBadge />
        </h3>
        
        {/* Username */}
        <p className="text-[12px] text-neutral-400 mt-1">@{member.username}</p>
        
        {/* Department Info */}
        {member.department && (
          <p className="text-[11px] text-neutral-500 font-medium mt-1 bg-neutral-50 px-2.5 py-0.5 rounded-full border border-neutral-100">
            {member.department}
          </p>
        )}
      </div>

      {/* Connection Buttons */}
      <div className="w-full mt-4">
        {isStudent ? (
          <button
            onClick={() => onToggleFollow(member.id)}
            className={`w-full py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-neutral-100 ${
              isFollowing
                ? 'bg-neutral-50 text-neutral-450 border border-neutral-200 hover:bg-neutral-100/60'
                : 'bg-white text-neutral-900 border-2 border-neutral-900 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        ) : (
          <button
            onClick={() => onToggleFollow(member.id)}
            className={`w-full py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 ${
              isFollowing
                ? 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                : 'bg-neutral-900 text-white border border-transparent hover:bg-neutral-800'
            }`}
          >
            {isFollowing ? 'Connected' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}
