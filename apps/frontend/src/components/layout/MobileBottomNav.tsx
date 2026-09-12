'use client';

import { LayoutGrid, FileText, Sparkles, Plus, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const FACULTY_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/papers', label: 'Papers', icon: FileText },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/generate', label: 'Quiz Room', icon: Sparkles },
];

const STUDENT_NAV = [
  { href: '/student', label: 'Home', icon: LayoutGrid, exact: true },
  { href: '/student/assessments', label: 'Tests', icon: ClipboardList },
  { href: '/student/tutor', label: 'Tutor', icon: Sparkles },
  { href: '/student/results', label: 'Results', icon: FileText },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role?.toUpperCase() || '');
  const isStudent = role === 'STUDENT';
  const navItems = isStudent ? STUDENT_NAV : FACULTY_NAV;

  const firstTwo = navItems.slice(0, 2);
  const lastTwo = navItems.slice(2, 4);

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      {firstTwo.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`mobile-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}

      {!isStudent && (
        <Link href="/assignments/create" className="mobile-nav-fab" aria-label="Create Assignment">
          <Plus size={22} aria-hidden="true" />
        </Link>
      )}

      {lastTwo.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`mobile-nav-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span className="mobile-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
