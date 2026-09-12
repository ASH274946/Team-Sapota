import React from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import DashboardMockup from "./DashboardMockup";
import { WaitlistButton } from "@/components/ui/WaitlistButton";

interface HeroProps {
  onBookMeeting: () => void;
}

export default function Hero({ onBookMeeting }: HeroProps) {
  return (
    <section className="relative pt-10 pb-20 overflow-hidden" id="home">
      {/* Background ambient lighting blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[300px] bg-orange-100/20 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Top Space Accent */}
        <div className="h-6" />

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-gray-950 tracking-tight leading-tight max-w-4xl mx-auto pl-1 pr-1"
        >
          AI Academic Assessment & <br />
          <span className="font-serif italic text-[#e05934] relative">
            Intelligence System
            {/* Fine brush underline aesthetic vector */}
            <svg 
              aria-hidden="true"
              className="absolute left-0 right-0 -bottom-2 w-full h-2 text-[#e05934]/30 pointer-events-none" 
              viewBox="0 0 100 10" 
              preserveAspectRatio="none"
            >
              <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="3" fill="transparent" />
            </svg>
          </span>
        </motion.h1>

        {/* Subtitle description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto mt-6 leading-relaxed font-sans"
        >
          An AI academic system for assessment, teaching, and personalised learning - designed to improve academic outcomes, reduce cost & time, and strengthen institutional credibility.
        </motion.p>

        {/* Call to action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <WaitlistButton
            label="Join Waitlist"
            tooltipTitle="15k+ educators & schools enrolled"
            onClick={onBookMeeting}
          />
          
          <a
            href="#teachers"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-white text-stone-800 hover:text-black border border-[#f3ede4] hover:border-orange-200 font-semibold text-xs sm:text-sm tracking-wide shadow-xs active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <span>Explore Interfaces</span>
            <ArrowUpRight className="w-4 h-4 text-[#e05934]" />
          </a>
        </motion.div>

        {/* Major Showcase center mockup board */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          className="mt-16 max-w-5xl mx-auto px-2 sm:px-4"
        >
          <DashboardMockup />
        </motion.div>

      </div>
    </section>
  );
}
