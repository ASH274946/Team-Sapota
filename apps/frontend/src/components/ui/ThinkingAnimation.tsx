'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ThinkingAnimationProps {
  variant?: 'dots' | 'pulse' | 'brain' | 'wave';
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ variant = 'wave' }) => {
  if (variant === 'dots') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 4px' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: ['0%', '-50%', '0%'],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
            style={{
              width: 6,
              height: 6,
              backgroundColor: 'var(--primary)',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'currentColor' }}
        />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Thinking...</span>
      </div>
    );
  }

  if (variant === 'brain') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}
        >
          Analyzing...
        </motion.span>
      </div>
    );
  }

  // default 'wave'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, color: 'var(--primary)' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{
            height: ['8px', '20px', '8px'],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
          style={{
            width: 4,
            backgroundColor: 'currentColor',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};
