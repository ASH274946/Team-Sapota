'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, UserPlus, Check, Search } from 'lucide-react';
import { RoleFilter } from '../types';

interface DiscoverActionBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRole: RoleFilter;
  setSelectedRole: (role: RoleFilter) => void;
  onInvitePeer?: () => void;
}

const ROLES: { value: RoleFilter; label: string }[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'TEACHER', label: 'Teachers' },
  { value: 'ADMIN', label: 'Admins' },
];

export function DiscoverActionBar({
  searchQuery,
  setSearchQuery,
  selectedRole,
  setSelectedRole,
  onInvitePeer
}: DiscoverActionBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 mb-8 select-none w-full">
      {/* Left: Search input field */}
      <div className="relative w-full md:max-w-md group">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-[#1d5ce5] transition-colors" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name, role, department..."
          className="w-full h-11 pl-10 pr-4 bg-neutral-100/60 hover:bg-neutral-100/90 focus:bg-white border-0 focus:ring-2 focus:ring-[#1d5ce5]/20 rounded-full text-xs font-semibold text-neutral-900 placeholder-neutral-400 outline-none transition-all duration-200"
          aria-label="Search community members"
        />
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-3 relative w-full md:w-auto justify-end">
        {/* Role Filter Dropdown Button */}
        <div>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-5 h-11 border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-bold text-xs rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#1d5ce5]/10"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Filter: {ROLES.find(r => r.value === selectedRole)?.label || 'All'}</span>
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-100 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => {
                      setSelectedRole(role.value);
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{role.label}</span>
                    {selectedRole === role.value && (
                      <Check className="w-3.5 h-3.5 text-[#1d5ce5] stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Invite Peer Button */}
        <button
          onClick={onInvitePeer}
          className="px-6 h-11 bg-[#1d5ce5] hover:bg-[#164ec4] text-white font-bold text-xs rounded-full flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-[#1d5ce5]/20 active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Peer</span>
        </button>
      </div>
    </div>
  );
}
