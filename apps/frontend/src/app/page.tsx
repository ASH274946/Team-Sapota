'use client';

import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TrustBadges from "@/components/landing/TrustBadges";
import PhoneMockupSection from "@/components/landing/PhoneMockupSection";
import WhatVidyaEnables from "@/components/landing/WhatVidyaEnables";
import AssessmentGrader from "@/components/landing/AssessmentGrader";
import StandsOut from "@/components/landing/StandsOut";
import SecurityPrivacy from "@/components/landing/SecurityPrivacy";
import LeadersGain from "@/components/landing/LeadersGain";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import ContactModal from "@/components/landing/ContactModal";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"meeting" | "contact">("contact");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 1200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const openInquiryModal = (type: "meeting" | "contact") => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e1e1a] selection:bg-[#e05934]/20 selection:text-[#e05934] overflow-x-hidden" id="home-view" suppressHydrationWarning>
      {/* Scroll indicator bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-[#e05934] origin-[0%] z-40"
      />

      {/* 1. Global Header Navigation */}
      <Header 
        onContactClick={() => openInquiryModal("contact")} 
      />

      {/* 2. Primary Showcase Hero Banner with Dashboard center board */}
      <Hero onBookMeeting={() => openInquiryModal("meeting")} />

      {/* 3. Trusted row / continuous ticker carousel */}
      <TrustBadges />

      {/* 4. Value Proposal section comprising phone metrics and Principal quote */}
      <PhoneMockupSection />

      {/* 5. What Vidya Enables card matrix */}
      <WhatVidyaEnables />

      {/* 6. Active evaluation desk and subjective grader mock playground */}
      <AssessmentGrader />

      {/* 7. Stands out / 6 columns feature layout */}
      <StandsOut />

      {/* 8. Safety, Encryption protocols and Compliance standards badges */}
      <SecurityPrivacy />

      {/* 9. Administrator profits panel with orbiting graphical metrics */}
      <LeadersGain />

      {/* 11. Frequently Asked Questions block accordions */}
      <FAQ />

      {/* 12. Bottom Conversion header & massive branding Footer backdrop */}
      <Footer 
        onContactClick={() => openInquiryModal("contact")} 
        onNavigate={(view) => { window.location.href = view === "home" ? "/" : "/" + view; }}
      />

      {/* 13. Dynamic onboarding meeting booking modal popup */}
      <ContactModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={modalType}
      />

      {/* 14. Polished Floating back-to-top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="back-to-top-btn"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[#1e1e1a] text-white border border-[#f3ede4] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#e05934] flex items-center justify-center cursor-pointer transition-shadow"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5 text-[#e05934]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
