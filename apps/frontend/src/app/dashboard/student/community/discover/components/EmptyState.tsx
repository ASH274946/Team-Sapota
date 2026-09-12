'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters: () => void;
  message?: string;
  hasFiltersActive?: boolean;
}

export function EmptyState({ onClearFilters, message, hasFiltersActive = true }: EmptyStateProps) {
  return (
    <div className="w-full mt-4 border-2 border-dashed border-neutral-200 rounded-[24px] p-12 flex flex-col items-center text-center bg-white shadow-sm hover:border-neutral-300 transition-colors select-none">
      <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100 shadow-inner">
        <Search className="w-6 h-6 text-[#1d5ce5]" />
      </div>
      <h2 className="font-extrabold text-[16px] text-neutral-800 mb-1.5">No members found</h2>
      <p className="text-xs text-neutral-500 max-w-sm mb-6 leading-relaxed">
        {message || "We couldn't find any organization members matching your search criteria or selected filters."}
      </p>
      {hasFiltersActive && (
        <button
          onClick={onClearFilters}
          className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Search & Filters</span>
        </button>
      )}
    </div>
  );
}
