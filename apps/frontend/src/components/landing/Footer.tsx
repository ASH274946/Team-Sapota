import React from "react";
import { motion } from "framer-motion";
import { WaitlistButton } from "@/components/ui/WaitlistButton";

interface FooterProps {
  onContactClick: () => void;
  onNavigate: (view: "home" | "privacy" | "terms") => void;
}

export default function Footer({ onContactClick, onNavigate }: FooterProps) {
  const footerLinks = [
    { name: "Home", href: "#home" },
    { name: "Solutions", href: "#solutions" },
    { name: "About Us", href: "#about" },
    { name: "Careers", href: "/careers" },
    { name: "FAQs", href: "#faqs" },
    { name: "For Teachers", href: "#teachers" },
  ];

  const handleLinkClick = (e: React.MouseEvent, name: string, href: string) => {
    if (name === "Home") {
      e.preventDefault();
      onNavigate("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    onNavigate("home");
    if (href.startsWith("#")) {
      const elementId = href.substring(1);
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <footer className="bg-[#fdfcfb] border-t border-[#f3ede4] py-16" id="careers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified Layer 1: Call to Action */}
        <div className="text-center relative overflow-hidden pb-16 border-b border-[#f3ede4]/40">
          {/* Subtle background spotlight */}
          <div className="absolute w-[240px] h-[240px] bg-orange-100/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Logo crown badge */}
            <div className="w-16 h-16 bg-white border border-[#f3ede4] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xs relative group hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="VidyaAI Logo" className="w-11 h-11 object-contain" />
              <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-400 rounded-lg text-white shadow-xs">
                <span className="text-[9px] block">👑</span>
              </div>
            </div>

            <h3 className="font-display font-medium text-2xl sm:text-3xl md:text-3.5xl text-gray-950 tracking-tight leading-tight">
              See How VidyaAI Works for Your School
            </h3>
            
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-3 leading-relaxed font-sans">
              Experience how VidyaAI can improve results, strengthen parent confidence, and deliver measurable academic impact.
            </p>

            <div className="mt-8">
              <WaitlistButton
                label="Join Waitlist & Request Access"
                tooltipTitle="2,400+ institutions joined"
                onClick={onContactClick}
              />
            </div>
          </div>
        </div>

        {/* Unified Layer 2: Main Navigation & Links */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 pb-12">
          
          {/* Get in touch (4 cols) */}
          <div className="md:col-span-4 space-y-4 pr-4">
            <h4 className="font-display font-extrabold text-xl text-gray-900">
              Get in touch
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans max-w-sm">
              Sales, support, partnerships, or press. Reach out and we'll reply within one business day.
            </p>
            <a href="mailto:info.vidhyaai@gmail.com" className="inline-flex items-center px-4 py-2 mt-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:border-[#e05934] hover:text-[#e05934] transition-colors shadow-sm group">
              <svg className="w-4 h-4 mr-2 text-gray-400 group-hover:text-[#e05934]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              info.vidhyaai@gmail.com
            </a>
          </div>

          {/* Page Links (2 cols) */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-gray-900 uppercase">
              Page Links
            </h5>
            <ul className="flex flex-col gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.name, link.href)}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company (2 cols) */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-gray-900 uppercase">
              Company
            </h5>
            <ul className="flex flex-col gap-y-3">
              <li><a href="/careers" className="text-xs text-gray-500 hover:text-black transition-colors">Careers</a></li>
              <li><a href="#" className="text-xs text-gray-500 hover:text-black transition-colors">Login</a></li>
              <li><a href="/contact" className="text-xs text-gray-500 hover:text-black transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal (2 cols) */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-gray-900 uppercase">
              Legal
            </h5>
            <ul className="flex flex-col gap-y-3">
              <li><a href="/privacy" className="text-xs text-gray-500 hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-xs text-gray-500 hover:text-black transition-colors">Terms of Service</a></li>
              <li><a href="/cookie-policy" className="text-xs text-gray-500 hover:text-black transition-colors">Cookie Policy</a></li>
              <li><a href="/acceptable-use" className="text-xs text-gray-500 hover:text-black transition-colors">Acceptable Use</a></li>
            </ul>
          </div>

          {/* Social Channels (2 cols) */}
          <div className="md:col-span-2 space-y-3.5">
            <h5 className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-gray-900 uppercase">
              Social
            </h5>
            <div className="flex items-center space-x-2">
              <a href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-500 hover:text-black hover:border-gray-300 transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-500 hover:text-black hover:border-gray-300 transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-500 hover:text-black hover:border-gray-300 transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
            </div>
          </div>

        </div>

        {/* Massive VidyaAI letter backdrop */}
        <div className="relative w-full overflow-hidden h-24 sm:h-36 md:h-44 select-none flex items-end justify-center cursor-default">
          <div className="absolute inset-x-0 bottom-0 text-center font-display font-extrabold text-[80px] sm:text-[140px] md:text-[190px] xl:text-[230px] leading-none text-[#1e1e1a]/[0.04] tracking-wider flex justify-center items-end select-none" aria-hidden="true">
            {"VidyaAI".split("").map((char, index) => (
              <motion.span
                key={index}
                className="inline-block origin-bottom cursor-pointer select-none transition-colors duration-300"
                whileHover={{
                  y: -18,
                  scale: 1.05,
                  rotate: index % 2 === 0 ? 3 : -3,
                  color: "#1e1e1a"
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 12
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Legalese baseline */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-gray-400 font-sans gap-4 border-t border-gray-100">
          <p>© 2026 VidyaAI Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center space-x-5">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate("privacy"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
              className="hover:text-black transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate("terms"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
              className="hover:text-black transition-colors"
            >
              Terms & Conditions
            </a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-black transition-colors">Sustainability Commitment</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
