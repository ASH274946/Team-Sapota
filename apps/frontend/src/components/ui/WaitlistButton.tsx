'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface WaitlistButtonProps {
  label?: string;
  tooltipTitle?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  avatars?: string[];
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
];

export function WaitlistButton({
  label = 'Join Waitlist',
  tooltipTitle = '15k+ already joined',
  href,
  onClick,
  className = '',
  avatars = DEFAULT_AVATARS,
}: WaitlistButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonContent = (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Social Proof Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 6, scale: 0.95, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 350 }}
            className="absolute -top-16 left-1/2 z-30 flex flex-col items-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white rounded-2xl shadow-xl border border-neutral-800 backdrop-blur-md">
              <span className="text-[11px] font-semibold tracking-wide text-neutral-300 whitespace-nowrap">
                {tooltipTitle}
              </span>

              {/* Overlapping Avatar Stack */}
              <div className="flex items-center -space-x-1.5">
                {avatars.slice(0, 6).map((src, i) => (
                  <motion.img
                    key={i}
                    src={src}
                    alt={`Member ${i + 1}`}
                    initial={{ opacity: 0, scale: 0.5, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="w-5 h-5 rounded-full ring-2 ring-neutral-950 object-cover"
                  />
                ))}
              </div>
            </div>

            {/* Downward Pointer Triangle */}
            <div className="w-2.5 h-2.5 bg-neutral-950 rotate-45 -mt-1 border-r border-b border-neutral-800" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Button */}
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        className="relative inline-flex items-center gap-2 rounded-full bg-[#e05934] hover:bg-[#c94a2a] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-orange-200" />
        <span>{label}</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/80 transition-transform group-hover:translate-x-0.5" />
      </motion.button>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block no-underline">
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}

export default WaitlistButton;
