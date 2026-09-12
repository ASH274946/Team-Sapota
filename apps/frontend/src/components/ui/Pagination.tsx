'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi2';

export interface PaginationProps {
  totalPages?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (page: number) => void;
}

const digitVariants = {
  initial: (dir: number) => ({
    y: dir > 0 ? 20 : -20,
    opacity: 0,
    scale: 0.5,
    filter: 'blur(2px)',
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    y: dir > 0 ? -20 : 20,
    opacity: 0,
    scale: 0.5,
    filter: 'blur(2px)',
  }),
};

export function Pagination({
  totalPages = 15,
  value,
  defaultValue = 1,
  onChange,
}: PaginationProps) {
  const isControlled = value !== undefined;

  const [internalPage, setInternalPage] = React.useState(defaultValue);
  const [direction, setDirection] = React.useState(0);

  const currentPage = isControlled ? value! : internalPage;

  const digits = currentPage.toString().split('');

  const [prevDigits, setPrevDigits] = React.useState<string[]>([]);
  const [prevTicks, setPrevTicks] = React.useState<number[]>([]);

  const len = digits.length;
  const lenDiff = len - prevDigits.length;

  const nextTicks = digits.map((digit, i) => {
    const prevI = i - lenDiff;
    const prevDigit = prevI >= 0 ? prevDigits[prevI] : undefined;
    const prevTick = prevI >= 0 ? prevTicks[prevI] : 0;

    return digit !== prevDigit ? (prevTick ?? 0) + 1 : (prevTick ?? 0);
  });

  if (prevDigits.join("") !== digits.join("")) {
    setPrevTicks(nextTicks);
    setPrevDigits(digits);
  }

  const paginate = (dir: number) => {
    const next = Math.min(totalPages, Math.max(1, currentPage + dir));

    if (next === currentPage) return;

    setDirection(dir);

    if (!isControlled) {
      setInternalPage(next);
    }

    onChange?.(next);
  };

  return (
    <div className="flex w-full justify-end">
      <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-1 py-0.5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => paginate(-1)}
          disabled={currentPage <= 1}
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-700 shadow-xs transition-colors duration-200 hover:bg-neutral-800 hover:text-white ${currentPage <= 1
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-pointer'
            }`}
        >
          <HiOutlineArrowLeft className="h-3 w-3" />
        </motion.button>

        <div className="flex items-center px-1 text-xs font-semibold text-neutral-600 select-none">
          <div className="flex h-5 items-center justify-center">
            {digits.map((digit, index) => (
              <div
                key={`${index}-${len}`}
                className="relative h-5 overflow-hidden w-[1ch]"
              >
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                  custom={direction}
                >
                  <motion.span
                    key={nextTicks[index]}
                    custom={direction}
                    variants={digitVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 16,
                      mass: 1.2,
                    }}
                    className="absolute inset-0 flex items-center justify-center text-neutral-700 tabular-nums"
                  >
                    {digit}
                  </motion.span>
                </AnimatePresence>
              </div>
            ))}
          </div>

          <span className="ml-1 text-neutral-500">
            of {totalPages}
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => paginate(1)}
          disabled={currentPage >= totalPages}
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-700 shadow-xs transition-colors duration-200 hover:bg-neutral-800 hover:text-white ${currentPage >= totalPages
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-pointer'
            }`}
        >
          <HiOutlineArrowRight className="h-3 w-3" />
        </motion.button>
      </div>
    </div>
  );
}
