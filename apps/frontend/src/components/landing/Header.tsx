import React from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import VidyaAiLogoIcon from "./VidyaAiLogoIcon";

interface HeaderProps {
  onContactClick?: () => void;
  onNavigate?: (view: "home" | "privacy" | "terms") => void;
  currentView?: "home" | "privacy" | "terms";
}

export default function Header({ onContactClick, onNavigate, currentView = "home" }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: "Home", href: "/" },
    { name: "Solutions", href: "/#solutions" },
    { name: "Teachers", href: "/#teachers" },
    { name: "About Us", href: "/#about" },
    { name: "Careers", href: "/careers" },
    { name: "FAQs", href: "/#faqs" },
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      if (onNavigate) onNavigate("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLinkClick = (e: React.MouseEvent, name: string, href: string) => {
    if (href === "/" || href === "/careers" || href === "/contact") {
      return; // Let <Link> handle it
    }

    if (pathname !== "/") {
      return; // Let <Link> handle navigating to /#hash
    }

    // We are on home page, handle smooth scroll
    e.preventDefault();
    if (currentView !== "home" && onNavigate) {
      onNavigate("home");
      
      const elementId = href.replace("/#", "");
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const elementId = href.replace("/#", "");
      const el = document.getElementById(elementId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fcfbf9]/85 backdrop-blur-md border-b border-[#f3ede4] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center space-x-2.5 group">
            <div className="relative w-9.5 h-9.5 transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <VidyaAiLogoIcon className="w-full h-full drop-shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl tracking-tight text-gray-900 group-hover:text-black transition-colors">
                Vidya<span className="text-[#e05934]">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.name, link.href)}
                className={`text-xs font-medium tracking-wide transition-colors relative py-1 group ${pathname === link.href ? 'text-black' : 'text-gray-600 hover:text-black'}`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-[#e05934] transition-all duration-200 ${pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="px-5 py-2.5 text-xs font-semibold tracking-wide text-gray-800 bg-[#f3ede4]/50 border border-[#f3ede4] rounded-full hover:bg-[#f3ede4] transition-all duration-200 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
            <Link
              href="/contact"
              onClick={(e) => {
                if (onContactClick && pathname === "/") {
                  e.preventDefault();
                  onContactClick();
                }
              }}
              className="px-5 py-2.5 text-xs font-semibold tracking-wide text-white bg-black rounded-full hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 focus:outline-none transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-[#f3ede4] bg-[#fcfbf9]/95 backdrop-blur-md"
          >
            <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    handleLinkClick(e, link.name, link.href);
                  }}
                  className={`block px-3 py-3 rounded-md text-sm font-medium ${pathname === link.href ? 'text-black bg-[#f3ede4]/40' : 'text-gray-700 hover:text-black hover:bg-[#f3ede4]/40'}`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 px-3 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-gray-800 bg-[#f3ede4]/50 border border-[#f3ede4] rounded-full hover:bg-[#f3ede4] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/contact"
                  onClick={(e) => {
                    setIsOpen(false);
                    if (onContactClick && pathname === "/") {
                      e.preventDefault();
                      onContactClick();
                    }
                  }}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
