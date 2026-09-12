'use client';

import React from 'react';
import { Star } from 'lucide-react';

export interface AvatarItem {
  src: string;
  alt: string;
}

export interface SocialProofAvatarsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarItem[];
  extraCount?: number;
  stars?: boolean;
  rating?: number;
  children?: React.ReactNode;
  className?: string;
}

const DEFAULT_AVATARS: AvatarItem[] = [
  {
    alt: 'Dr. Priya Sharma - Dean of Sciences',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    alt: 'Prof. Rajesh Menon - HOD Computer Science',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  {
    alt: 'Ananya Iyer - Academic Director',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  {
    alt: 'Dr. Vivek Verma - Principal',
    src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  },
  {
    alt: 'Sunita Rao - Controller of Examinations',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
  },
];

export function SocialProofAvatars({
  avatars = DEFAULT_AVATARS,
  extraCount = 2400,
  stars = true,
  rating = 5,
  children,
  className = '',
  ...props
}: SocialProofAvatarsProps) {
  return (
    <div
      className={`inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 ${className}`}
      {...props}
    >
      {/* Overlapping Avatar Stack */}
      <div className="flex items-center -space-x-2.5 overflow-hidden p-0.5">
        {avatars.map((avatar, index) => (
          <img
            key={index}
            src={avatar.src}
            alt={avatar.alt}
            title={avatar.alt}
            className="inline-block h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-white object-cover shadow-2xs transition-transform hover:scale-110 hover:z-10"
          />
        ))}

        {extraCount !== undefined && extraCount > 0 && (
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#e05934] text-[10px] sm:text-xs font-bold text-white ring-2 ring-white shadow-2xs">
            +{extraCount > 999 ? `${(extraCount / 1000).toFixed(1)}k` : extraCount}
          </div>
        )}
      </div>

      {/* Stars & Text Description */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        {stars && (
          <div className="flex items-center gap-1 mb-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
              />
            ))}
            <span className="text-[11px] font-bold text-neutral-800 ml-1">
              {rating.toFixed(1)}/5
            </span>
          </div>
        )}

        <div className="text-xs text-neutral-600 leading-snug">
          {children || (
            <p className="whitespace-nowrap">
              Trusted by <strong className="font-semibold text-neutral-900">2,400+</strong> educators & schools
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialProofAvatars;
