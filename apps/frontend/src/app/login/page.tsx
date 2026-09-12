'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp, ssoLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
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

  const openSSOPopup = (provider: 'google' | 'x') => {
    const width = 500;
    const height = 620;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      '',
      `sso_login_${provider}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,menubar=no,toolbar=no`
    );

    if (!popup) {
      toast.error('Popup blocked! Please allow popups in your browser.');
      return;
    }

    const providerName = provider === 'google' ? 'Google' : 'X';
    const providerLogo =
      provider === 'google'
        ? `<svg viewBox="0 0 24 24" width="24" height="24" style="margin-right:8px;"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`
        : `<svg viewBox="0 0 24 24" width="24" height="24" fill="white" style="margin-right:8px;"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sign in with ${providerName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .card {
              background: white;
              padding: 28px;
              border-radius: 16px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
              width: 100%;
              max-width: 380px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 16px;
              font-weight: 700;
              font-size: 16px;
              color: #0f172a;
            }
            h1 {
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 6px 0;
            }
            p {
              font-size: 13px;
              color: #64748b;
              margin: 0 0 18px 0;
              line-height: 1.4;
            }
            .profile-card {
              display: flex;
              align-items: center;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 10px 14px;
              margin-bottom: 10px;
              text-align: left;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .profile-card:hover {
              background: #f1f5f9;
              border-color: #cbd5e1;
              transform: translateY(-1px);
            }
            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              margin-right: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: bold;
              color: white;
            }
            .profile-info {
              flex: 1;
            }
            .name {
              font-size: 13px;
              font-weight: 600;
              color: #0f172a;
            }
            .email {
              font-size: 11px;
              color: #64748b;
            }
            .role-badge {
              font-size: 10px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .custom-input {
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              font-size: 13px;
              margin-bottom: 10px;
            }
            .btn {
              width: 100%;
              padding: 10px;
              background: #0f172a;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            }
            .divider {
              margin: 16px 0;
              position: relative;
              text-align: center;
            }
            .divider::before {
              content: "";
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              border-top: 1px solid #e2e8f0;
            }
            .divider span {
              position: relative;
              background: white;
              padding: 0 10px;
              font-size: 11px;
              color: #94a3b8;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-container">
              ${providerLogo}
              <span>${providerName} Single Sign-On</span>
            </div>
            <h1>Choose an Account</h1>
            <p>Select a verified profile to log in to Vidya AI</p>

            <div class="profile-card" onclick="selectUser('student@vidyaai.com', 'Alex', 'Johnson', 'STUDENT')">
              <div class="avatar" style="background: #3b82f6;">AJ</div>
              <div class="profile-info">
                <div class="name">Alex Johnson</div>
                <div class="email">student@vidyaai.com</div>
              </div>
              <span class="role-badge" style="background: #eff6ff; color: #1d4ed8;">Student</span>
            </div>

            <div class="profile-card" onclick="selectUser('faculty@vidyaai.com', 'Dr. Sarah', 'Mitchell', 'TEACHER')">
              <div class="avatar" style="background: #10b981;">SM</div>
              <div class="profile-info">
                <div class="name">Dr. Sarah Mitchell</div>
                <div class="email">faculty@vidyaai.com</div>
              </div>
              <span class="role-badge" style="background: #ecfdf5; color: #047857;">Faculty</span>
            </div>

            <div class="profile-card" onclick="selectUser('admin@vidyaai.com', 'Admin', 'Officer', 'ADMIN')">
              <div class="avatar" style="background: #8b5cf6;">AO</div>
              <div class="profile-info">
                <div class="name">Admin Officer</div>
                <div class="email">admin@vidyaai.com</div>
              </div>
              <span class="role-badge" style="background: #f5f3ff; color: #6d28d9;">Admin</span>
            </div>

            <div class="divider"><span>Or use custom email</span></div>

            <input type="email" id="customEmail" class="custom-input" placeholder="Enter your google email..." value="${email || ''}" />
            <button class="btn" onclick="submitCustom()">Continue with Email</button>
          </div>

          <script>
            function selectUser(userEmail, firstName, lastName, role) {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'SSO_SUCCESS',
                  email: userEmail,
                  firstName: firstName,
                  lastName: lastName,
                  provider: '${providerName}',
                  role: role,
                  token: 'mock_token_' + Date.now()
                }, window.location.origin);
              }
              window.close();
            }

            function submitCustom() {
              var input = document.getElementById('customEmail').value.trim();
              if (!input || !input.includes('@')) {
                alert('Please enter a valid email address.');
                return;
              }
              var namePart = input.split('@')[0];
              var firstName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
              selectUser(input, firstName, 'User', '${selectedRole}');
            }
          </script>
        </body>
      </html>
    `);
  };

  const handleGoogleSuccess = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      const { googleLogin } = useAuthStore.getState();
      const result = await googleLogin({
        token: tokenResponse.access_token,
        role: selectedRole,
        isSignUp: false,
      });
      setIsSubmitting(false);

      if (result.success) {
        toast.success('Successfully logged in with Google!');
        const user = useAuthStore.getState().user;
        const isOnboarded =
          user?.hasCompletedOnboarding === true ||
          !!(user?.organizationId && user?.departmentId);
        let dashboardPath = '/dashboard/student';
        if (user?.role === 'TEACHER' || user?.role === 'FACULTY')
          dashboardPath = '/dashboard/faculty';
        if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')
          dashboardPath = '/dashboard/admin';
        router.replace(isOnboarded ? dashboardPath : '/onboarding');
      } else {
        toast.error(result.error || 'Google login failed.');
      }
    },
    onError: () => {
      openSSOPopup('google');
    },
  });

  const handleGoogleAuth = () => {
    try {
      handleGoogleSuccess();
    } catch {
      openSSOPopup('google');
    }
  };

  // SSO Message listener
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'SSO_SUCCESS') {
        setIsSubmitting(true);
        const result = await ssoLogin({
          email: event.data.email || 'student@vidyaai.com',
          firstName: event.data.firstName || 'User',
          lastName: event.data.lastName || 'Account',
          provider: event.data.provider || 'Google',
          token: event.data.token,
          role: event.data.role || selectedRole,
          isSignUp: false,
        });
        setIsSubmitting(false);

        if (result.success) {
          toast.success(`Successfully logged in with ${event.data.provider || 'Google'}!`);
          const user = useAuthStore.getState().user;
          const isOnboarded =
            user?.hasCompletedOnboarding === true ||
            !!(user?.organizationId && user?.departmentId);
          let dashboardPath = '/student';
          if (user?.role === 'TEACHER' || user?.role === 'FACULTY')
            dashboardPath = '/faculty';
          if (user?.role === 'ADMIN')
            dashboardPath = '/admin';
          if (user?.role === 'SUPER_ADMIN')
            dashboardPath = '/super-admin';
          router.replace(isOnboarded ? dashboardPath : '/onboarding');
        } else {
          toast.error(result.error || 'Authentication failed.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [ssoLogin, router, selectedRole]);

  // Step 1: Send OTP to email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithOtp(trimmedEmail);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Verification code sent to your email!');
      setStep('OTP');
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
    } else {
      setErrorMessage(result.error || 'Failed to send verification code.');
    }
  };

  // Step 2: Handle single OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage(null);
    const digit = value.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await verifyOtp(email.trim().toLowerCase(), code, selectedRole);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Successfully authenticated!');
      const user = useAuthStore.getState().user;
      const isOnboarded =
        user?.hasCompletedOnboarding === true ||
        !!(user?.organizationId && user?.departmentId);
      let dashboardPath = '/student';
      if (user?.role === 'TEACHER' || user?.role === 'FACULTY')
        dashboardPath = '/faculty';
      if (user?.role === 'ADMIN')
        dashboardPath = '/admin';
      if (user?.role === 'SUPER_ADMIN')
        dashboardPath = '/super-admin';
      router.replace(isOnboarded ? dashboardPath : '/onboarding');
    } else {
      setErrorMessage(result.error || 'Invalid or expired verification code. Please try again.');
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await signInWithOtp(email.trim().toLowerCase());
    setIsSubmitting(false);

    if (result.success) {
      toast.success('New 6-digit code sent!');
      setResendCooldown(30);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } else {
      setErrorMessage(result.error || 'Failed to resend code.');
    }
  };

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
        <div className="flex flex-1 items-center justify-center py-4 sm:py-6 my-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[360px] sm:max-w-[390px]"
          >
            {/* Titles */}
            <motion.div variants={itemVariants} className="mb-3.5 sm:mb-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {step === 'EMAIL' ? 'Welcome Back' : 'Enter Verification Code'}
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                {step === 'EMAIL'
                  ? 'Sign in to access your assessment workspace'
                  : `Enter the 6-digit code sent to ${email}`}
              </p>
            </motion.div>

            {/* Role Switcher */}
            {step === 'EMAIL' && (
              <motion.div variants={itemVariants} className="mb-3.5 sm:mb-4">
                <div className="flex rounded-full bg-neutral-100 p-1 border border-neutral-200/70">
                  {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((r) => (
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
                      {r === 'TEACHER' ? 'Faculty' : r === 'ADMIN' ? 'Admin' : 'Student'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Google Login Button */}
            {step === 'EMAIL' && (
              <motion.div variants={itemVariants} className="mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 shadow-sm"
                >
                  <GoogleIcon className="text-base sm:text-lg" />
                  <span>Login with Google</span>
                </button>
              </motion.div>
            )}

            {/* Divider */}
            {step === 'EMAIL' && (
              <motion.div
                variants={itemVariants}
                className="relative my-3 sm:my-4 flex items-center"
              >
                <div className="grow border-t border-neutral-200"></div>
                <span className="px-3 text-xs uppercase tracking-wider text-neutral-400 font-medium">or email code</span>
                <div className="grow border-t border-neutral-200"></div>
              </motion.div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}

            {/* STEP 1: EMAIL INPUT */}
            {step === 'EMAIL' && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-3">
                <motion.div variants={itemVariants} className="flex flex-col gap-1">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-neutral-700 tracking-wide"
                  >
                    Work or Student Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="name@university.edu or gmail.com"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 transition-all focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 pl-10"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Code</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            )}

            {/* STEP 2: 6-DIGIT OTP INPUT */}
            {step === 'OTP' && (
              <motion.div variants={itemVariants} className="flex flex-col gap-4">
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpInputsRef.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={isSubmitting}
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold rounded-xl border bg-neutral-50/50 text-neutral-900 transition-all focus:bg-white focus:outline-none ${
                        digit
                          ? 'border-neutral-900 bg-white ring-1 ring-neutral-900'
                          : 'border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isSubmitting || otp.some((d) => !d)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setErrorMessage(null);
                    }}
                    className="text-neutral-600 hover:text-neutral-900 underline transition-colors"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="font-medium text-neutral-900 hover:underline disabled:text-neutral-400 disabled:no-underline transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Bottom Footer Link */}
            <motion.div variants={itemVariants} className="mt-6 text-center">
              <p className="text-xs text-neutral-500">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Legal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2 border-t border-neutral-100 pt-3">
          <span>&copy; {new Date().getFullYear()} Vidya AI. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-neutral-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-600 transition-colors">
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
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-300 mb-1.5">
              Empowering Education
            </span>
            <h2 className="text-2xl xl:text-3xl font-bold mb-2 tracking-tight">
              Transform Higher Education
            </h2>
            <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed max-w-md">
              Create AI-driven question papers, conduct rubric-based automated evaluations, and elevate institutional learning outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
