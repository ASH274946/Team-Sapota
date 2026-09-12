'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Cpu,
  Layers,
  GitBranch,
  Command,
  User,
  Menu,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';

export function Navigation5() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  return (
    <div className="relative w-full py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6">
        {/* Floating Navbar Pill */}
        <div className="flex h-14 sm:h-16 w-full max-w-5xl items-center justify-between gap-2 rounded-full border border-neutral-200 bg-white pr-2.5 sm:pr-3 shadow-xs dark:border-neutral-800 dark:bg-neutral-950">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 pr-4 sm:pr-6 pl-4 group">
            <img
              src="/logo.png"
              alt="VidyaAI Logo"
              className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              VidyaAI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/#features"
              className="rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 hover:bg-neutral-50"
            >
              Features
            </Link>

            <Link
              href="/#developers"
              className="flex items-center gap-2 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 hover:bg-neutral-50"
            >
              Developers
              <Badge
                variant="secondary"
                className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 h-4 rounded-full px-1.5 text-[10px]"
              >
                API
              </Badge>
            </Link>

            {/* Solutions Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                className="flex items-center gap-1.5 rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-all hover:bg-neutral-100/70 hover:text-neutral-900 focus:outline-hidden"
              >
                Solutions
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', solutionsOpen && 'rotate-180')} />
              </button>

              {solutionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSolutionsOpen(false)}
                  />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[760px] rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl z-50 dark:border-neutral-800 dark:bg-neutral-950 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-3 gap-6 divide-x divide-neutral-100 dark:divide-neutral-800">
                      {/* Column 1 */}
                      <div className="flex flex-col pr-4">
                        <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900">
                          <Cpu className="h-4.5 w-4.5 text-neutral-700 dark:text-neutral-300" />
                        </div>
                        <h4 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                          AI Assessment Engine
                        </h4>
                        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                          Generate question papers, rubrics, and automated evaluations in seconds.
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
                            <Layers className="h-3 w-3" />
                            Bloom's Taxonomy
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
                            <GitBranch className="h-3 w-3" />
                            OBE Mappings
                          </span>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="flex flex-col gap-2.5 pl-6">
                        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          Use Cases
                        </h4>
                        <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-950">
                          University Exams
                        </Link>
                        <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-950">
                          Formative Quizzes
                        </Link>
                        <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-950">
                          Outcome Analytics
                        </Link>
                        <Link href="/login" className="text-xs font-medium text-neutral-600 hover:text-neutral-950">
                          AI Classroom Assistant
                        </Link>
                      </div>

                      {/* Column 3 */}
                      <div className="flex flex-col pl-6">
                        <h4 className="mb-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                          Featured
                        </h4>
                        <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100 flex flex-col justify-between flex-1">
                          <div>
                            <Badge variant="outline" className="mb-2 bg-white text-[10px]">
                              Next-Gen OBE
                            </Badge>
                            <h5 className="text-xs font-semibold text-neutral-900">
                              Instant Question Paper Generation
                            </h5>
                            <p className="text-[11px] text-neutral-500 mt-1">
                              Map course outcomes automatically with AI verification.
                            </p>
                          </div>
                          <Link
                            href="/login"
                            className="text-xs font-semibold text-neutral-900 mt-3 flex items-center gap-1 hover:underline"
                          >
                            Try Demo <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              href="/#customers"
              className="rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 hover:bg-neutral-50"
            >
              Institutions
            </Link>

            <Link
              href="/contact"
              className="rounded-full bg-transparent px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50 hover:bg-neutral-50"
            >
              Contact
            </Link>
          </div>

          {/* Action Icons Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-500 bg-neutral-50 border border-neutral-200/90 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
              title="Quick Command (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">Ctrl+K</span>
            </button>

            <Link
              href="/login"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
              title="Account"
            >
              <User className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="hidden md:inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-all"
            >
              Get started
            </Link>

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger className="rounded-full text-neutral-700 dark:text-neutral-300 p-2 hover:bg-neutral-100 transition-colors">
                  <Menu className="w-5 h-5" />
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex w-[300px] flex-col gap-6 p-6 dark:bg-neutral-950 bg-white"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo.png"
                      alt="VidyaAI Logo"
                      className="w-8 h-8 object-contain shrink-0"
                    />
                    <span className="text-base font-bold text-neutral-900">
                      VidyaAI
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link
                      href="/#features"
                      className="text-sm font-medium text-neutral-900 py-1"
                    >
                      Features
                    </Link>
                    <div className="flex items-center justify-between py-1">
                      <Link
                        href="/#developers"
                        className="text-sm font-medium text-neutral-900"
                      >
                        Developers
                      </Link>
                      <Badge
                        variant="secondary"
                        className="bg-neutral-900 text-white text-[10px]"
                      >
                        API
                      </Badge>
                    </div>

                    <div className="border-t border-neutral-100 pt-2">
                      <button
                        onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                        className="flex items-center justify-between w-full text-sm font-medium text-neutral-900 py-1"
                      >
                        Solutions
                        <ChevronDown className={cn('w-4 h-4 transition-transform', mobileSolutionsOpen && 'rotate-180')} />
                      </button>
                      {mobileSolutionsOpen && (
                        <div className="pl-3 border-l border-neutral-200 space-y-2 mt-2">
                          <Link href="/login" className="block text-xs text-neutral-600">
                            AI Assessment Engine
                          </Link>
                          <Link href="/login" className="block text-xs text-neutral-600">
                            University Exams
                          </Link>
                          <Link href="/login" className="block text-xs text-neutral-600">
                            Outcome Analytics
                          </Link>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/#customers"
                      className="text-sm font-medium text-neutral-900 py-1"
                    >
                      Institutions
                    </Link>
                    <Link
                      href="/contact"
                      className="text-sm font-medium text-neutral-900 py-1"
                    >
                      Contact
                    </Link>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-neutral-100">
                    <Link
                      href="/login"
                      className="w-full text-center py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
                    >
                      Get started
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navigation5;
