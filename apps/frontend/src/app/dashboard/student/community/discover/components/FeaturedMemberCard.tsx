'use client';

import React from 'react';
import { MessageSquare, Sparkles, User, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FeaturedMemberCardProps {
  onMessageClick?: () => void;
  onViewProfileClick?: () => void;
}

export function FeaturedMemberCard({ onMessageClick, onViewProfileClick }: FeaturedMemberCardProps) {
  const handleViewProfile = () => {
    if (onViewProfileClick) {
      onViewProfileClick();
    } else {
      toast.success('Viewing Jordan Michaels profile...');
    }
  };

  const handleSendMessage = () => {
    if (onMessageClick) {
      onMessageClick();
    } else {
      toast.success('Opening direct messages with Jordan Michaels...');
    }
  };

  return (
    <div className="col-span-1 sm:col-span-2 bg-gradient-to-br from-[#1d5ce5] via-[#2563eb] to-[#0a389c] rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-[0_16px_32px_rgba(29,92,229,0.15)] min-h-[250px] relative group select-none border border-blue-400/20">
      {/* Decorative Blur Orbs for SaaS feeling */}
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-blue-300/20 rounded-full blur-2xl pointer-events-none group-hover:scale-105 transition-transform duration-700" />

      <div className="p-8 flex flex-col justify-between flex-1 text-white relative z-10">
        <div>
          <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-blue-200 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/15">
            <Sparkles className="w-3 h-3 text-blue-300 fill-blue-300" />
            <span>Featured Member</span>
          </span>
          <h2 className="text-2.5xl font-extrabold mt-4 mb-2 leading-tight tracking-tight flex items-center gap-2">
            Jordan Michaels
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full border border-[#1d5ce5] inline-block shadow-sm" />
          </h2>
          <p className="text-xs text-blue-100 leading-relaxed max-w-sm font-medium">
            Awarded 'Researcher of the Term' for contributions to Quantum Computing ethics. Jordan is open to peer discussions on AI safety and multi-agent systems.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleViewProfile}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-[#1d5ce5] font-extrabold text-xs rounded-xl shadow-sm transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>View Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSendMessage}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-extrabold text-xs rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 backdrop-blur-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
        </div>
      </div>

      {/* Modern Mesh Grid Graphic Pattern on Right Side */}
      <div className="hidden md:flex w-1/3 bg-[#0c39a3] relative overflow-hidden shrink-0 items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a389c]/40 to-[#1d5ce5]/40" />
        
        {/* Dynamic mesh svg graphic */}
        <svg className="absolute inset-0 w-full h-full text-white/5 opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center relative shadow-inner group-hover:scale-105 transition-transform duration-500">
          <User className="w-10 h-10 text-white/40 group-hover:text-white/60 transition-colors" />
        </div>
      </div>
    </div>
  );
}
