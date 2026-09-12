import React, { useState, useEffect, useRef } from "react";
import { X, CalendarDays, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "meeting" | "contact";
}

export default function ContactModal({ isOpen, onClose, initialType = "contact" }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    school: "",
    role: "Teacher",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate server side submit delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleReset = () => {
    setFormData({ name: "", email: "", school: "", role: "Teacher", message: "" });
    setSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Glass background overlay with fade transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1e1e1a]/40 backdrop-blur-sm"
          />

          {/* Modal cardboard frame */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-[#fcfbf9] border border-[#f3ede4] w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl z-20 overflow-hidden font-sans"
          >
            {/* Top Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-orange-50 border border-orange-100 rounded-lg text-[#e05934]">
                    <CalendarDays className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-lg sm:text-xl">
                      {initialType === "meeting" ? "Book an Onboarding Call" : "Connect with VidyaAI"}
                    </h3>
                    <p className="text-xs text-gray-400 leading-none mt-1">Get custom setup quotes for your institution</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Full Name */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-gray-500 block mb-1">Your Name</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e05934] transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-gray-500 block mb-1">Institutional Email</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@dpsvasantkunj.edu.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e05934] transition-all"
                    />
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-gray-500 block mb-1">School / College Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Delhi Public School Vasant Kunj"
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e05934] transition-all"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-gray-500 block mb-1">Your Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Principal", "Teacher", "Administrator"].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({ ...formData, role })}
                          className={`py-2 px-3.5 text-xs text-center rounded-lg border font-semibold transition-all ${
                            formData.role === role
                              ? "bg-black text-white border-transparent"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional details */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wide text-gray-500 block mb-1">Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Describe target syllabus classes, total students, etc."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e05934] transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex space-x-3.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 text-xs font-semibold border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-[#e05934] text-white hover:bg-orange-600 rounded-full font-semibold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    {loading ? (
                      <span className="animate-spin w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600">
                  <Check className="w-7 h-7" />
                </div>
                
                <h4 className="font-display font-bold text-gray-950 text-xl tracking-tight">Request Logged!</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed font-sans">
                  Thank you, <strong className="text-gray-900">{formData.name}</strong>. Our academic executive will contact you at <strong className="text-gray-900">{formData.email}</strong> to set up a personalized evaluation demo for <strong className="text-gray-900">{formData.school}</strong>.
                </p>

                <div className="pt-6 flex justify-center space-x-3">
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-black font-semibold font-mono tracking-wide"
                  >
                    Submit Another Inquiry
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={onClose}
                    className="text-xs text-[#e05934] hover:text-orange-600 font-semibold uppercase tracking-wider"
                  >
                    Dismiss Dialog
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
