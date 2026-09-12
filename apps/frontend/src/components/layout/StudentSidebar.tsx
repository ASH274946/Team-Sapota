'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import {
  LayoutGrid,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  User,
  X,
  Users,
  MessageSquare,
  Volume2,
  Video,
  MessageCircle,
  Compass,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  Calendar,
  Award,
  Zap,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  exact?: boolean;
  badge?: {
    text: string;
    variant: 'neutral' | 'amber';
  };
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export function StudentSidebar() {
  const pathname = usePathname();
  const { isOpen, close, isCollapsed, toggleCollapsed } = useSidebarStore();
  const { user } = useAuthStore();
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [communityExpanded, setCommunityExpanded] = useState(() => pathname.startsWith('/student/community'));
  const [assessmentCount, setAssessmentCount] = useState<number | null>(null);

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  useEffect(() => {
    if (user) {
      api
        .get('/student/assessments')
        .then((res: any) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setAssessmentCount(res.data.data.length);
          } else {
            setAssessmentCount(0);
          }
        })
        .catch(() => setAssessmentCount(0));
    }
  }, [user]);

  const navSections: NavSectionConfig[] = [
    {
      title: 'GENERAL',
      items: [
        { href: '/student', label: 'Dashboard', icon: LayoutGrid, exact: true },
        {
          href: '/student/assessments',
          label: 'Tests & Exams',
          icon: ClipboardCheck,
          badge:
            assessmentCount !== null && assessmentCount > 0
              ? { text: String(assessmentCount).padStart(2, '0'), variant: 'amber' }
              : undefined,
        },
        { href: '/student/results', label: 'Results & Analytics', icon: TrendingUp },
      ],
    },
    {
      title: 'LEARNING & MASTERY',
      items: [
        { href: '/student/lessons', label: 'Learning Modules', icon: BookOpen },
        { href: '/student/study-plan', label: 'AI Study Plan', icon: Calendar },
        { href: '/student/mastery', label: 'Concept Mastery', icon: Award },
        { href: '/student/practice', label: 'Practice Quiz', icon: Zap },
        {
          href: '/student/tutor',
          label: 'AI Tutor',
          icon: MessageSquare,
          badge: { text: 'AI', variant: 'neutral' },
        },
        { href: '/student/attendance', label: 'Attendance', icon: User },
      ],
    },
  ];

  const communitySubItems = [
    { href: '/student/community/discussions', label: 'Discussions', icon: MessageSquare },
    { href: '/student/community/groups', label: 'Groups', icon: Users },
    { href: '/student/community/voice', label: 'Voice Rooms', icon: Volume2 },
    { href: '/student/community/meetings', label: 'Meetings', icon: Video },
    { href: '/student/community/messages', label: 'Direct Messages', icon: MessageCircle },
    { href: '/student/community/discover', label: 'Discover', icon: Compass },
  ];

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Student Member';
  const displayEmail = user?.email || 'student@vidyaai.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-39 lg:hidden transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        role="navigation"
        aria-label="Student Navigation"
        className={`fixed top-0 left-0 bottom-0 h-screen bg-white text-neutral-900 border-r border-neutral-200/90 flex flex-col z-40 transition-[width,transform] duration-300 ease-in-out shadow-xs ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div
          className={`flex items-center pt-4 pb-2 transition-all duration-300 ${
            isCollapsed
              ? 'flex-row justify-between px-4 lg:flex-col lg:items-center lg:justify-center lg:gap-y-3 lg:px-2'
              : 'flex-row items-center justify-between px-4'
          }`}
        >
          <Link href="/student" className="flex items-center gap-2.5 group min-w-0" title="VidyaAI Student">
            <img
              src="/logo.png"
              alt="VidyaAI Logo"
              className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[15px] tracking-tight text-neutral-900 truncate">
                      VidyaAI
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                      Student
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Desktop Collapse / Expand Button & Mobile Close */}
          <div className="flex items-center">
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 hidden lg:flex transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`py-2 transition-all duration-300 ${isCollapsed ? 'px-2 flex justify-center' : 'px-3'}`}>
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.button
                key="search-collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={handleOpenSearch}
                className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/90 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Search (Ctrl+D)"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.div
                key="search-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleOpenSearch}
                className="relative flex items-center w-full bg-neutral-50 border border-neutral-200/90 rounded-xl px-3 py-1.5 cursor-pointer hover:border-neutral-300 hover:bg-neutral-100/60 transition-all group"
              >
                <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 mr-2" />
                <span className="text-xs text-neutral-400 flex-1 truncate">
                  Search
                </span>
                <kbd className="text-[10px] font-mono text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200 shadow-2xs shrink-0">
                  Ctrl+D
                </kbd>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Sections */}
        <nav className={`flex-1 overflow-y-auto space-y-4 scrollbar-thin transition-all duration-300 ${isCollapsed ? 'px-2 py-1.5' : 'px-2.5 py-1.5'}`}>
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <AnimatePresence mode="wait" initial={false}>
                {!isCollapsed ? (
                  <motion.div
                    key={`sec-title-${section.title}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase truncate whitespace-nowrap"
                  >
                    {section.title}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`sec-div-${section.title}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="my-1.5 border-t border-neutral-100"
                  />
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon, exact, badge }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={close}
                      title={isCollapsed ? label : undefined}
                      className={`flex items-center rounded-xl text-xs font-medium transition-all group ${
                        isCollapsed
                          ? 'w-10 h-10 mx-auto justify-center p-0'
                          : 'justify-between px-2.5 py-2'
                      } ${
                        active
                          ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-2xs'
                          : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? 'text-neutral-900'
                              : 'text-neutral-400 group-hover:text-neutral-700'
                          }`}
                        />
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="truncate overflow-hidden whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <AnimatePresence initial={false}>
                        {!isCollapsed && badge && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-tight ${
                              badge.variant === 'amber'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {badge.text}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* MY SPACES / COMMUNITY Section */}
          <div className="space-y-0.5">
            <AnimatePresence mode="wait" initial={false}>
              {!isCollapsed ? (
                <motion.div
                  key="sec-title-myspaces"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-400 uppercase truncate whitespace-nowrap"
                >
                  MY SPACES
                </motion.div>
              ) : (
                <motion.div
                  key="sec-div-myspaces"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="my-1.5 border-t border-neutral-100"
                />
              )}
            </AnimatePresence>

            <div className="space-y-0.5">
              <div
                onClick={() => setCommunityExpanded(!communityExpanded)}
                title={isCollapsed ? 'Community Spaces' : undefined}
                className={`flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer group ${
                  isCollapsed
                    ? 'w-10 h-10 mx-auto justify-center p-0'
                    : 'justify-between px-2.5 py-2'
                } ${
                  pathname.startsWith('/student/community')
                    ? 'bg-neutral-100 text-neutral-950 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      pathname.startsWith('/student/community')
                        ? 'text-neutral-900'
                        : 'text-neutral-400 group-hover:text-neutral-700'
                    }`}
                  />
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="truncate overflow-hidden whitespace-nowrap"
                      >
                        Community Spaces
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {!isCollapsed && (
                  communityExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  )
                )}
              </div>

              {!isCollapsed && communityExpanded && (
                <div className="pl-3 ml-3 border-l border-neutral-200/90 space-y-0.5 mt-0.5">
                  {communitySubItems.map((sub) => {
                    const subActive = isActive(sub.href);
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={close}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          subActive
                            ? 'bg-neutral-100 text-neutral-950 font-semibold'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile Card */}
        <div className={`p-3 border-t border-neutral-100 transition-all duration-300 ${isCollapsed ? 'px-2 flex justify-center' : ''}`}>
          <div
            className={`flex items-center rounded-xl bg-neutral-50 border border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-100/90 transition-all ${
              isCollapsed ? 'p-1.5 justify-center' : 'p-2'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden">
                  {user?.avatar || (user as any)?.avatarUrl ? (
                    <img
                      src={user?.avatar || (user as any)?.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initials || 'ST'
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col min-w-0 flex-1 overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-xs font-semibold text-neutral-900 truncate">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-neutral-400 truncate">
                      {displayEmail}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
