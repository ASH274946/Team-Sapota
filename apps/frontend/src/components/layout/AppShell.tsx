'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ClientOnly } from '@/components/ui/ClientOnly';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { getDashboardRoute, validateRouteAccess } from '@/utils/navigation';
import { OrgAdminSidebar } from './OrgAdminSidebar';
import { FacultySidebar } from './FacultySidebar';
import { StudentSidebar } from './StudentSidebar';
import { TeacherSidebar } from './TeacherSidebar';
import { Topbar } from './TopBar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { MobileBottomNav } from './MobileBottomNav';
import { canAccessRoute } from '@/config/route-permissions';
import { useSystemStore } from '@/store/system.store';
import { AlertTriangle } from 'lucide-react';

const loaderMessages = [
  "Securing workspace...",
  "Loading your account details...",
  "Preparing your environment...",
  "Fetching necessary resources..."
];

function FullScreenLoader({ isLoading }: { isLoading: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loaderMessages.length);
    }, 2500);

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      clearInterval(interval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="global-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#F8F7F4',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div 
            style={{ 
              width: 50, 
              height: 50, 
              border: '4px solid rgba(232, 83, 29, 0.15)', 
              borderTopColor: '#E8531D', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} 
          />
          
          <div style={{ marginTop: 24, height: 24, position: 'relative', width: '100%', textAlign: 'center' }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#4B5563'
                }}
              >
                {loaderMessages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initializeFromStorage, activeOrganizationId } = useAdminAuthStore();
  const { settings, fetchSettings, initialized } = useSystemStore();
  const { isCollapsed } = useSidebarStore();

  useEffect(() => {
    initialize();
    initializeFromStorage();
  }, [initialize, initializeFromStorage]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, activeOrganizationId, user?.role]);

  useEffect(() => {
    if (isLoading) return;

    const publicPages = ['/', '/careers', '/contact', '/privacy', '/terms', '/cookie-policy', '/acceptable-use'];
    if (publicPages.includes(pathname)) return; // Never redirect from landing and public pages
    const isPublicPath = pathname === '/login' || pathname === '/register';
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isOnboardingPage = pathname === '/onboarding';

    if (!isAuthenticated) {
      if (!isPublicPath && !isOnboardingPage) {
        router.push('/login');
      }
    } else {
      const userRole = user?.role?.toUpperCase() || '';
      const isSuperAdminOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
      const isOnboarded = isSuperAdminOrAdmin || user?.hasCompletedOnboarding === true || (user?.organizationId && user?.departmentId);
      
      if (isOnboarded) {
        const dashboardRoute = getDashboardRoute(userRole);
        if (isAuthPage) {
          router.push(dashboardRoute);
        } else {
          const hasAccess = canAccessRoute(userRole, pathname);

          if (!hasAccess) {
            router.push(dashboardRoute);
          } else {
            validateRouteAccess(userRole, pathname);
          }
        }
      } else {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  const publicPagesList = ['/', '/login', '/register', '/forgot-password', '/careers', '/contact', '/privacy', '/terms', '/cookie-policy', '/acceptable-use'];
  const isPublicPage = publicPagesList.includes(pathname);
  const isRedirectingToLogin = !isLoading && !isAuthenticated && !isPublicPage && pathname !== '/onboarding';

  if ((isLoading || isRedirectingToLogin) && !isPublicPage) {
    // Return null or a subtle loader to prevent unmounting the layout
    // But since the user wants the sidebar and navigation bar to stay in place,
    // we should NOT return early here. We will handle the loading state inside the main content area.
    // So we just let the code fall through.
  }

  const chromeExcludedPages = [
    '/',
    '/login',
    '/register',
    '/onboarding',
    '/careers',
    '/contact',
    '/privacy',
    '/terms',
    '/cookie-policy',
    '/acceptable-use'
  ];
  const isChromeExcluded = chromeExcludedPages.includes(pathname);

  if (isChromeExcluded) {
    return (
      <>
        {children}
        <ClientOnly>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1F2937',
                color: '#F9FAFB',
                border: '1px solid #374151',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'ui-sans-serif, system-ui',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </ClientOnly>
      </>
    );
  }

  const role = user?.role?.toUpperCase() || '';

  let SidebarComponent = <FacultySidebar />;
  let TopbarComponent = <Topbar />;
  
  if (role === 'SUPER_ADMIN') {
    SidebarComponent = <SuperAdminSidebar />;
    TopbarComponent = <AdminTopbar />;
  } else if (role === 'ADMIN' || role === 'ORG_ADMIN') {
    SidebarComponent = <OrgAdminSidebar />;
    TopbarComponent = <AdminTopbar />;
  } else if (role === 'TEACHER') {
    SidebarComponent = <TeacherSidebar />;
  } else if (role === 'FACULTY') {
    SidebarComponent = <FacultySidebar />;
  } else if (role === 'STUDENT') {
    SidebarComponent = <StudentSidebar />;
  }

  // Maintenance mode check
  if (initialized && settings?.maintenanceMode && role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'ORG_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Under Maintenance</h1>
        <p className="text-gray-600 max-w-md">
          We are currently performing scheduled maintenance to improve our services. 
          Please check back later. We apologize for the inconvenience.
        </p>
      </div>
    );
  }

  return (
    <>
      <FullScreenLoader isLoading={(isLoading || isRedirectingToLogin) && !isPublicPage} />
      <div suppressHydrationWarning className="flex min-h-screen w-full bg-white relative overflow-x-hidden">
        {SidebarComponent}
        <div
          suppressHydrationWarning
          className={`flex-1 flex flex-col min-h-screen w-full transition-[margin,width] duration-300 ease-in-out ${
            isCollapsed
              ? 'ml-0 lg:ml-[72px] lg:w-[calc(100%-72px)]'
              : 'ml-0 lg:ml-[260px] lg:w-[calc(100%-260px)]'
          }`}
        >
          {TopbarComponent}
          <main suppressHydrationWarning className="flex-1 p-4 sm:p-6 max-w-[1600px] mx-auto w-full overflow-x-hidden">
            <ClientOnly fallback={<div className="page-content-placeholder" aria-hidden="true" />}>
              <div key={user?.activeOrganizationId || 'default'}>
                {children}
              </div>
            </ClientOnly>
          </main>
        </div>
        <MobileBottomNav />
        <ClientOnly>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </ClientOnly>
      </div>
    </>
  );
}
