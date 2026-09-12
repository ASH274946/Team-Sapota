'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { createClient } from '@/lib/supabase/client';

function CallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const provider = searchParams.get('provider') || 'google';

      // 1. Check Supabase OAuth Session
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await useAuthStore.getState().initialize();
          const user = useAuthStore.getState().user;
          const isOnboarded =
            user?.hasCompletedOnboarding === true ||
            !!(user?.organizationId && user?.departmentId);
          let dashboardPath = '/dashboard/student';
          if (user?.role === 'TEACHER' || user?.role === 'FACULTY')
            dashboardPath = '/dashboard/faculty';
          if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
            dashboardPath = '/dashboard/admin';
          window.location.href = isOnboarded ? dashboardPath : '/onboarding';
          return;
        }
      } catch (e) {
        console.warn('Supabase callback session check:', e);
      }

      let email = '';
      let firstName = '';
      let lastName = '';
      let token = '';

      try {
        if (provider === 'google') {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');

          if (accessToken) {
            token = accessToken;
            const res = await fetch(
              `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
            );
            const data = await res.json();
            if (data && data.email) {
              email = data.email;
              firstName = data.given_name || 'Google';
              lastName = data.family_name || 'User';
            }
          }
        } else if (provider === 'x') {
          const code = searchParams.get('code');
          if (code) {
            token = code;
            email = 'x-user@vidyaai.com';
            firstName = 'X';
            lastName = 'User';
          }
        }
      } catch (err) {
        console.error('Error in SSO callback processing:', err);
      }

      if (email) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'SSO_SUCCESS',
              email,
              firstName,
              lastName,
              provider,
              token,
            },
            window.location.origin
          );
          window.close();
        } else {
          // Direct redirect in the main window
          try {
            const { ssoLogin } = useAuthStore.getState();
            const result = await ssoLogin({
              email,
              firstName,
              lastName,
              provider,
              token,
            });
            if (result.success) {
              const user = useAuthStore.getState().user;
              const isOnboarded =
                user?.hasCompletedOnboarding === true ||
                !!(user?.organizationId && user?.departmentId);
              let dashboardPath = '/dashboard/student';
              if (user?.role === 'TEACHER' || user?.role === 'FACULTY')
                dashboardPath = '/dashboard/faculty';
              if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
                dashboardPath = '/dashboard/admin';
              window.location.href = isOnboarded ? dashboardPath : '/onboarding';
            } else {
              window.location.href = '/login?error=sso_failed';
            }
          } catch (loginErr) {
            console.error('SSO login error:', loginErr);
            window.location.href = '/login?error=sso_failed';
          }
        }
      } else {
        // Fallback if email not retrieved
        if (!window.opener) {
          window.location.href = '/login?error=no_email';
        } else {
          window.close();
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#f8fafc',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '28px 44px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: 600 }}>
          Completing Authorization
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Please wait while we securely sign you in...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '28px 44px',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: 600 }}>
              Loading Authorization...
            </h2>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
