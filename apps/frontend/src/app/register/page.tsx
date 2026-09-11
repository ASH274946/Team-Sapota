'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

// Simple Google SVG Icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const { signup, ssoLogin } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 320,
        damping: 26,
      },
    },
  };

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      const { googleLogin } = useAuthStore.getState();
      const result = await googleLogin({
        token: tokenResponse.access_token,
        role: selectedRole,
        isSignUp: true,
      });
      setIsSubmitting(false);

      if (result.success) {
        toast.success('Successfully registered and logged in with Google!');
        const user = useAuthStore.getState().user;
        const isOnboarded =
          user?.hasCompletedOnboarding === true ||
          !!(user?.organizationId && user?.departmentId);
        const rolePath = user?.role
          ? user.role.toLowerCase().replace('_', '-')
          : 'student';
        router.replace(isOnboarded ? `/dashboard/${rolePath}` : '/onboarding');
      } else {
        toast.error(result.error || 'Google registration failed.');
      }
    },
    onError: () => {
      toast.error('Google registration failed or was cancelled.');
    },
  });

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'SSO_SUCCESS') {
        setIsSubmitting(true);
        const result = await ssoLogin({
          email: event.data.email || 'student@vidyaai.com',
          firstName: event.data.firstName || 'Student',
          lastName: event.data.lastName || 'Member',
          provider: event.data.provider || 'SSO',
          token: event.data.token,
          role: selectedRole,
          isSignUp: true,
        });
        setIsSubmitting(false);

        if (result.success) {
          toast.success(
            `Successfully registered and logged in with ${
              event.data.provider || 'SSO'
            }!`
          );
          const user = useAuthStore.getState().user;
          const isOnboarded =
            user?.hasCompletedOnboarding === true ||
            (user?.organizationId && user?.departmentId);
          const rolePath = user?.role
            ? user.role.toLowerCase().replace('_', '-')
            : 'student';
          router.replace(isOnboarded ? `/dashboard/${rolePath}` : '/onboarding');
        } else {
          toast.error(result.error || 'SSO registration failed.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [ssoLogin, router, selectedRole]);

  const handleSSO = (provider: 'google' | 'x') => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const xClientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;

    let isMock = false;
    if (provider === 'google') {
      isMock =
        !googleClientId ||
        googleClientId.includes('placeholder') ||
        !googleClientId.trim().endsWith('.apps.googleusercontent.com');
    } else {
      isMock = !xClientId || xClientId.includes('placeholder');
    }

    let breakToPopup = false;
    if (!isMock) {
      if (provider === 'google') {
        try {
          handleGoogleSuccess();
        } catch {
          // Fallback to interactive popup
          breakToPopup = true;
        }
      } else {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const state = 'state_123';
        const codeChallenge = 'challenge';
        const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${xClientId?.trim()}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&scope=users.read%20tweet.read&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
        window.location.href = authUrl;
        return;
      }
      if (!breakToPopup) return;
    }

    if (
      provider === 'google' &&
      googleClientId &&
      !googleClientId.trim().endsWith('.apps.googleusercontent.com')
    ) {
      toast(
        'Using simulated SSO login. The NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env appears to be an API Key or invalid (must end with .apps.googleusercontent.com).',
        {
          icon: 'ℹ️',
          duration: 6000,
        }
      );
    } else {
      toast(
        `Using simulated SSO login. Set NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID in .env for real accounts.`,
        {
          icon: 'ℹ️',
          duration: 5000,
        }
      );
    }

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '',
      `sso_login_${provider}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      toast.error('Popup blocked! Please allow popups for this site.');
      return;
    }

    const providerName = provider === 'google' ? 'Google' : 'X';
    const providerColor = provider === 'google' ? '#4285F4' : '#000000';
    const providerLogo =
      provider === 'google'
        ? `<svg viewBox="0 0 24 24" width="24" height="24" style="margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`
        : `<svg viewBox="0 0 24 24" width="24" height="24" fill="white" style="margin-right:8px;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

    popup.document.write(`
      <html>
        <head>
          <title>Sign in with ${providerName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f3f4f6;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              overflow: hidden;
            }
            .card {
              background: white;
              padding: 32px;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
              width: 360px;
              text-align: center;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 20px;
              font-weight: 700;
              font-size: 16px;
            }
            h1 {
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              margin: 0 0 6px 0;
            }
            p {
              font-size: 13px;
              color: #4b5563;
              margin: 0 0 20px 0;
              line-height: 1.4;
            }
            .profile-card {
              display: flex;
              align-items: center;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px 14px;
              margin-bottom: 10px;
              text-align: left;
              cursor: pointer;
              transition: background-color 0.2s, border-color 0.2s;
            }
            .profile-card:hover {
              background: #f3f4f6;
              border-color: #d1d5db;
            }
            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              margin-right: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: bold;
            }
            .profile-info {
              flex: 1;
            }
            .name {
              font-size: 13px;
              font-weight: 600;
              color: #111827;
            }
            .email {
              font-size: 11px;
              color: #6b7280;
            }
            .btn {
              width: 100%;
              padding: 10px;
              border-radius: 8px;
              border: none;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .btn-primary {
              background: ${providerColor};
              color: white;
              margin-bottom: 10px;
            }
            .btn-primary:hover {
              opacity: 0.9;
            }
            .btn-secondary {
              background: transparent;
              color: #4b5563;
              border: 1px solid #d1d5db;
            }
            .btn-secondary:hover {
              background: #f9fafb;
            }
            .loader {
              border: 3px solid #f3f3f3;
              border-top: 3px solid ${providerColor};
              border-radius: 50%;
              width: 20px;
              height: 20px;
              animation: spin 1s linear infinite;
              margin: 0 auto 14px auto;
              display: none;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card" id="card">
            <div class="logo-container">
              ${providerLogo}
              Vidya AI
            </div>
            <h1 id="title">Sign in with ${providerName}</h1>
            <p id="desc">Choose an account to continue to <strong>Vidya AI</strong></p>
            
            <div id="loader" class="loader"></div>
            
            <div id="content">
              <!-- Account List -->
              <div id="account-list">
                <div class="profile-card" onclick="selectAccount('faculty@vidyaai.com', 'Faculty Member')">
                  <div class="avatar" style="background:#E0F2FE;color:#0369A1;">F</div>
                  <div class="profile-info">
                    <div class="name">Faculty Member</div>
                    <div class="email">faculty@vidyaai.com</div>
                  </div>
                </div>

                <div class="profile-card" onclick="selectAccount('student@vidyaai.com', 'Student Member')">
                  <div class="avatar" style="background:#DCFCE7;color:#15803D;">S</div>
                  <div class="profile-info">
                    <div class="name">Student Member</div>
                    <div class="email">student@vidyaai.com</div>
                  </div>
                </div>

                <div class="profile-card" onclick="selectAccount('admin@vidyaai.com', 'Org Administrator')">
                  <div class="avatar" style="background:#FEE2E2;color:#B91C1C;">A</div>
                  <div class="profile-info">
                    <div class="name">Org Administrator</div>
                    <div class="email">admin@vidyaai.com</div>
                  </div>
                </div>
                
                <button class="btn btn-secondary" style="margin-bottom:10px;" onclick="showCustomInput()">Use another account</button>
              </div>

              <!-- Custom Input Form -->
              <div id="custom-input-form" style="display:none; text-align:left;">
                <label style="font-size:12px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Email address</label>
                <input type="email" id="custom-email" placeholder="name@example.com" style="width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; margin-bottom:14px; box-sizing:border-box; outline:none;" />
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <button class="btn btn-primary" onclick="submitCustomAccount()">Continue</button>
                  <button class="btn btn-secondary" onclick="showAccountList()">Back</button>
                </div>
              </div>

              <div style="margin-top:12px;">
                <button class="btn btn-secondary" onclick="window.close()">Cancel</button>
              </div>
            </div>
          </div>

          <script>
            let selectedEmail = '';
            let selectedName = '';

            function selectAccount(email, name) {
              selectedEmail = email;
              selectedName = name;
              proceed();
            }

            function showCustomInput() {
              document.getElementById('account-list').style.display = 'none';
              document.getElementById('custom-input-form').style.display = 'block';
              document.getElementById('title').innerText = 'Use another account';
              document.getElementById('desc').innerText = 'Enter your email to sign in using ${providerName}';
            }

            function showAccountList() {
              document.getElementById('account-list').style.display = 'block';
              document.getElementById('custom-input-form').style.display = 'none';
              document.getElementById('title').innerText = 'Sign in with ${providerName}';
              document.getElementById('desc').innerText = 'Choose an account to continue to Vidya AI';
            }

            function submitCustomAccount() {
              const emailVal = document.getElementById('custom-email').value.trim();
              if (!emailVal || !emailVal.includes('@')) {
                alert('Please enter a valid email address.');
                return;
              }
              selectedEmail = emailVal;
              selectedName = emailVal.split('@')[0];
              proceed();
            }

            function proceed() {
              document.getElementById('content').style.display = 'none';
              document.getElementById('title').innerText = 'Authorizing...';
              document.getElementById('desc').innerText = 'Connecting securely to Vidya AI.';
              document.getElementById('loader').style.display = 'block';
              
              setTimeout(() => {
                const targetOrigin = window.location.origin;
                window.opener.postMessage({ 
                  type: 'SSO_SUCCESS', 
                  email: selectedEmail, 
                  firstName: selectedName, 
                  lastName: 'User', 
                  provider: '${providerName}' 
                }, targetOrigin);
                window.close();
              }, 1200);
            }
          </script>
        </body>
      </html>
    `);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error('All fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please accept the terms and privacy policy.');
      return;
    }

    setIsSubmitting(true);
    const signupResult = await signup({
      email,
      password,
      firstName,
      lastName,
      role: selectedRole as any,
      organizationId: '',
    } as any);

    setIsSubmitting(false);

    if (signupResult.success) {
      toast.success('Account registered successfully!');
      const user = useAuthStore.getState().user;
      const isOnboarded =
        user?.hasCompletedOnboarding === true ||
        (user?.organizationId && user?.departmentId);
      const rolePath = user?.role
        ? user.role.toLowerCase().replace('_', '-')
        : 'student';
      router.replace(isOnboarded ? `/dashboard/${rolePath}` : '/onboarding');
    } else {
      toast.error(
        signupResult.error || 'Registration failed. Email might already be registered.'
      );
    }
  };

  if (showVerification) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 p-4 font-sans text-neutral-900">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white">
            <MailCheck size={24} />
          </div>
          <h1 className="mb-1.5 text-xl font-bold tracking-tight text-neutral-900">
            Check your email
          </h1>
          <p className="mb-5 text-xs text-neutral-500 leading-relaxed">
            We’ve sent a confirmation link to <strong className="text-neutral-900">{email}</strong>. Please click the link to verify your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-full bg-neutral-900 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Proceed to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen lg:h-screen w-full bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white relative overflow-x-hidden lg:overflow-hidden">
      {/* Left Form Section */}
      <div className="flex w-full flex-col justify-between lg:w-1/2 p-4 sm:p-6 lg:p-8 xl:p-10 h-full overflow-y-auto">
        {/* Header Branding */}
        <div className="flex items-center w-full">
          <Link
            href="/"
            className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-neutral-950 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="VidyaAI Logo"
              className="w-7 h-7 object-contain"
            />
            VIDYA AI
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center py-3 sm:py-5 my-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[360px] sm:max-w-[390px]"
          >
            {/* Titles */}
            <motion.div variants={itemVariants} className="mb-3 sm:mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Create your Account
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Join Vidya AI for autonomous grading & OBE tracking
              </p>
            </motion.div>

            {/* Role Switcher */}
            <motion.div variants={itemVariants} className="mb-3">
              <div className="flex rounded-full bg-neutral-100 p-1 border border-neutral-200/70">
                {(['STUDENT', 'TEACHER'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                      selectedRole === r
                        ? 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {r === 'TEACHER' ? 'Faculty' : 'Student'}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Google Signup Button */}
            <motion.div variants={itemVariants} className="mb-3">
              <button
                type="button"
                onClick={() => handleSSO('google')}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
              >
                <GoogleIcon className="text-base sm:text-lg" />
                <span>Sign up with Google</span>
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative my-2.5 sm:my-3 flex items-center"
            >
              <div className="grow border-t border-neutral-200"></div>
              <span className="px-3 text-xs uppercase tracking-wider text-neutral-400">or</span>
              <div className="grow border-t border-neutral-200"></div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="firstName"
                    className="text-xs font-semibold text-neutral-700"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="John"
                    className="w-full rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="lastName"
                    className="text-xs font-semibold text-neutral-700"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="Doe"
                    className="w-full rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-neutral-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-neutral-700"
                >
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="Create a strong password"
                    className="w-full rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 sm:py-2 pr-11 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </motion.div>

              {/* Checkbox */}
              <motion.div
                variants={itemVariants}
                className="flex items-start gap-2 pt-0.5"
              >
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 accent-neutral-900"
                />
                <label htmlFor="terms" className="text-xs text-neutral-600 cursor-pointer select-none leading-tight">
                  I agree to the{' '}
                  <Link href="/terms" className="font-semibold text-neutral-900 hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="font-semibold text-neutral-900 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </motion.div>

              {/* Sign Up Button */}
              <motion.div variants={itemVariants} className="mt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-linear-to-b from-[#3a3a3a] to-[#121212] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-3.5 text-center text-xs sm:text-sm text-neutral-500"
            >
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Log in
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-1.5 pt-2">
          <span>&copy; {new Date().getFullYear()} Vidya AI. All rights reserved.</span>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:text-neutral-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-700 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:w-1/2 p-3 sm:p-4 lg:p-5 h-full">
        <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-inner bg-neutral-900">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Vidya AI Authentication"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent flex flex-col justify-end p-8 xl:p-10 text-white">
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-300 mb-1.5">Empowering Education</span>
            <h2 className="text-2xl xl:text-3xl font-bold mb-2 tracking-tight">Transform Higher Education</h2>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-md">
              Create AI-driven question papers, conduct rubric-based automated evaluations, and elevate institutional learning outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
