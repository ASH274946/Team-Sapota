'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';

// Simple Google SVG Icon
export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

export default function Auth7() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
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

  return (
    <div className="flex min-h-screen lg:h-screen w-full bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white relative overflow-x-hidden lg:overflow-hidden">
      {/* Left Form Section */}
      <div className="flex w-full flex-col justify-between lg:w-1/2 p-4 sm:p-6 lg:p-8 xl:p-10 h-full overflow-y-auto">
        {/* Header Branding */}
        <div className="flex items-center justify-between w-full">
          <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">
            WATERMELON
          </span>
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
            <motion.div variants={itemVariants} className="mb-4 sm:mb-5 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                Create your Account
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Let&apos;s get started with your 30 days free trial
              </p>
            </motion.div>

            {/* Google Login Button */}
            <motion.div variants={itemVariants} className="mb-3 sm:mb-4">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
              >
                <GoogleIcon className="text-base sm:text-lg" />
                Login with Google
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative my-3 sm:my-4 flex items-center"
            >
              <div className="grow border-t border-neutral-200"></div>
              <span className="px-3 text-xs uppercase tracking-wider text-neutral-400">or</span>
              <div className="grow border-t border-neutral-200"></div>
            </motion.div>

            {/* Form */}
            <form className="flex flex-col gap-2.5 sm:gap-3">
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-1"
              >
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-neutral-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-1"
              >
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-neutral-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-1"
              >
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-neutral-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              {/* Checkbox */}
              <motion.div
                variants={itemVariants}
                className="flex items-start gap-2 pt-0.5"
              >
                <div className="flex h-4 items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 accent-neutral-900"
                  />
                </div>
                <label htmlFor="terms" className="text-xs text-neutral-600 cursor-pointer select-none">
                  I agree to all Terms, Privacy Policy and Fees
                </label>
              </motion.div>

              {/* Sign Up Button */}
              <motion.div variants={itemVariants} className="mt-1">
                <button
                  type="submit"
                  className="w-full rounded-full bg-linear-to-b from-[#3a3a3a] to-[#121212] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Sign Up
                </button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-4 text-center text-xs sm:text-sm text-neutral-500"
            >
              Already have an account?{' '}
              <a
                href="#"
                className="font-semibold text-neutral-900 hover:underline"
              >
                Log in
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom spacer / footer */}
        <div className="text-center text-xs text-neutral-400 pt-2">
          <span>&copy; {new Date().getFullYear()} Watermelon</span>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:w-1/2 p-3 sm:p-4 lg:p-5 h-full">
        <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] shadow-inner bg-neutral-900">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Cloudscape background"
            className="h-full w-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}
