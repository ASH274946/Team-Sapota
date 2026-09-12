'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface DotMatrixLoadingProps {
  size?: number; // overall dimension in px
  gridSize?: 3 | 5;
  className?: string;
  dotColor?: string;
}

export function DotMatrixLoading({
  size = 36,
  gridSize = 5,
  className = '',
  dotColor = '#e05934',
}: DotMatrixLoadingProps) {
  const dots = Array.from({ length: gridSize * gridSize });
  const dotSize = Math.max(2.5, Math.floor(size / (gridSize * 1.8)));

  return (
    <div
      className={`inline-flex items-center justify-center p-1.5 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading dot matrix"
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {dots.map((_, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          const distFromCenter = Math.hypot(
            row - (gridSize - 1) / 2,
            col - (gridSize - 1) / 2
          );

          return (
            <motion.div
              key={i}
              animate={{
                scale: [0.4, 1.1, 0.4],
                opacity: [0.15, 1, 0.15],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: distFromCenter * 0.15,
              }}
              style={{
                width: dotSize,
                height: dotSize,
                backgroundColor: dotColor,
                borderRadius: 1.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
