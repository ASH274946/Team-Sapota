'use client';

import { useState, useEffect } from 'react';
import { Menu, ShieldAlert, ArrowLeft, ChevronDown, LogOut, Settings, Building2 } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export function AdminTopbar() {
  const { toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { isImpersonating, exitImpersonation, availableOrganizations, activeOrganizationId, fetchAvailableOrganizations } = useAdminAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchOrg = async (orgId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    const success = await useAdminAuthStore.getState().switchOrganization(orgId);
    setIsSwitching(false);
    setIsOrgSwitcherOpen(false);
    if (success) {
      const state = useAuthStore.getState();
      if (state.user?.role === 'SUPER_ADMIN') {
        window.location.assign('/super-admin');
      } else {
        window.location.assign('/dashboard');
      }
    }
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchAvailableOrganizations();
    }
  }, [user?.role, fetchAvailableOrganizations]);

  useEffect(() => {
    if (!isDropdownOpen && !isOrgSwitcherOpen) return;
    const handleClose = () => {
      setIsDropdownOpen(false);
      setIsOrgSwitcherOpen(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isDropdownOpen, isOrgSwitcherOpen]);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          // When near the top, always show navbar
          if (currentY <= 20) {
            setIsVisible(true);
          } else if (currentY > lastY + 8 && currentY > 60) {
            // Scrolling down -> hide navbar smoothly
            setIsVisible(false);
            setIsDropdownOpen(false);
            setIsOrgSwitcherOpen(false);
          } else if (currentY < lastY - 8) {
            // Scrolling up -> show navbar smoothly
            setIsVisible(true);
          }
          lastY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'Admin Account';
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={`sticky top-0 z-30 w-full px-3 sm:px-6 py-2.5 sm:py-3 bg-transparent transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Impersonation Banner Alert */}
      {isImpersonating && (
        <div className="w-full bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-2 rounded-full mb-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert size={15} />
            <span>
              Impersonation Active: Viewing as <strong>{user?.email}</strong> ({user?.role})
            </span>
          </div>
          <button
            onClick={() => exitImpersonation()}
            className="bg-white text-amber-800 hover:bg-amber-100 px-3 py-0.5 rounded-full font-bold transition-all text-xs flex items-center gap-1 shadow-2xs"
          >
            <ArrowLeft size={12} />
            Exit
          </button>
        </div>
      )}

      {/* Floating Pill Topbar */}
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-3 rounded-full border border-neutral-200/90 bg-white px-3.5 sm:px-5 shadow-xs">
        
        {/* Left Section: Mobile Menu Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={toggle}
            className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Right Section: Actions & Profile Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Super Admin Org Switcher Pill */}
          {isSuperAdmin && availableOrganizations.length > 0 && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOrgSwitcherOpen(!isOrgSwitcherOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors border border-neutral-200/60"
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {availableOrganizations.find((o) => o.id === activeOrganizationId)?.name || 'Select Org'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {isOrgSwitcherOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {availableOrganizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => handleSwitchOrg(org.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                          org.id === activeOrganizationId
                            ? 'bg-neutral-900 text-white'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        <span className="truncate">{org.name}</span>
                        {org.id === activeOrganizationId && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Icon Button & Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="relative p-0.5 rounded-full border border-neutral-200/80 hover:border-neutral-300 hover:ring-2 hover:ring-neutral-200/60 transition-all cursor-pointer group"
              aria-label="User Profile Menu"
              title={displayName}
            >
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
                    userInitials || 'AD'
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200/90 p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <p className="text-xs font-bold text-neutral-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {user?.email || 'admin@vidyaai.com'}
                  </p>
                  {user?.role && (
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {user.role}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-400" />
                    Account Settings
                  </Link>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
