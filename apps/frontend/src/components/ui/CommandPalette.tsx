'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Settings,
  Users,
  BookOpen,
  Calculator,
  CheckSquare,
  Megaphone,
  MessageSquare,
  Cpu,
  Building,
  Network,
  Activity,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleAction = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const actions =
    user?.role === 'ADMIN'
      ? [
          { title: 'SaaS Control Plane', path: '/dashboard/superadmin', category: 'Admin', icon: Building },
          { title: 'White-Label Branding', path: '/admin/branding', category: 'Settings', icon: Settings },
          { title: 'AI Control Center (MCP)', path: '/admin/ai/control-center', category: 'AI', icon: Network },
          { title: 'Multi-Agent Workflow Designer', path: '/admin/ai/workflow-designer', category: 'AI', icon: Network },
          { title: 'AI Swarm Observability', path: '/admin/ai/agent-monitor', category: 'AI', icon: Activity },
          { title: 'Integration Center', path: '/admin/integrations', category: 'System', icon: Settings },
          { title: 'Digital Library & Research', path: '/research', category: 'Academics', icon: BookOpen },
          { title: 'Institutional Research Analytics', path: '/admin/research', category: 'Analytics', icon: Building },
          { title: 'AI Orchestrator Analytics', path: '/admin/ai', category: 'AI', icon: Cpu },
          { title: 'Institution OBE Dashboard', path: '/admin/obe', category: 'Management', icon: Building },
        ]
      : user?.role === 'TEACHER'
      ? [
          { title: 'Digital Library & Research', path: '/research', category: 'Academics', icon: BookOpen },
          { title: 'Research Supervisor Dashboard', path: '/dashboard/supervisor', category: 'Research', icon: Users },
          { title: 'Outcome-Based Education (OBE)', path: '/teacher/obe', category: 'Academics', icon: Calculator },
          { title: 'Create Quiz', path: '/teacher/generate-quiz', category: 'AI Toolkit', icon: FileText },
          { title: 'Assignments Management', path: '/assignments', category: 'Academics', icon: FileText },
          { title: 'Class Insights', path: '/teacher/insights', category: 'Academics', icon: Users },
          { title: 'Record Attendance', path: '/teacher/attendance', category: 'Academics', icon: CheckSquare },
          { title: 'Publish Announcement', path: '/teacher/announcements', category: 'Communication', icon: Megaphone },
        ]
      : [
          { title: 'Dashboard', path: '/student', category: 'Navigation', icon: BookOpen },
          { title: 'Tests & Exams', path: '/student/assessments', category: 'Academics', icon: FileText },
          { title: 'Results & Analytics', path: '/student/results', category: 'Analytics', icon: Activity },
          { title: 'Digital Library & Research', path: '/research', category: 'Academics', icon: BookOpen },
          { title: 'Course Discussions', path: '/student/community/discussions', category: 'Community', icon: MessageSquare },
          { title: 'Ask AI Tutor', path: '/student/tutor', category: 'AI Tools', icon: BookOpen },
          { title: 'Settings', path: '/settings', category: 'Preferences', icon: Settings },
        ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filteredActions.length || 1)) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        handleAction(filteredActions[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 bg-white">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, tools, or actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-mono font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Action Results List */}
        <div className="p-2 max-h-[340px] overflow-y-auto scrollbar-thin divide-y divide-neutral-50 bg-white">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, i) => {
              const Icon = action.icon;
              const isSelected = i === selectedIndex;
              return (
                <div
                  key={action.path + action.title}
                  onClick={() => handleAction(action.path)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-neutral-900 truncate">
                        {action.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 truncate">
                        {action.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-neutral-400 text-xs">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white border border-neutral-200 px-1 py-0.5 rounded text-[10px] text-neutral-600 shadow-2xs mr-1">↑</kbd>
              <kbd className="font-mono bg-white border border-neutral-200 px-1 py-0.5 rounded text-[10px] text-neutral-600 shadow-2xs mr-1">↓</kbd>
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-white border border-neutral-200 px-1 py-0.5 rounded text-[10px] text-neutral-600 shadow-2xs mr-1">↵</kbd>
              Select
            </span>
          </div>
          <span>VidyaAI Quick Search</span>
        </div>
      </div>
    </div>
  );
}
