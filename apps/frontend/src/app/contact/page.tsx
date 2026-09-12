'use client';

import React, { useState } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail as MailIcon, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    portfolio: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', portfolio: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e1e1a] selection:bg-[#e05934]/20 selection:text-[#e05934] overflow-x-hidden">
      <Header />
      
      {/* Hero / Contact Form Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden min-h-[calc(100vh-200px)] flex items-center">
        {/* Background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-gray-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left Column: Copy & Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1.5 px-4 rounded-full bg-orange-50 border border-orange-100 text-[#e05934] text-xs font-bold tracking-widest uppercase mb-6">
                Get in Touch
              </span>
              <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                Let&apos;s build something <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e05934] to-[#f08a5d]">
                  amazing together.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-lg">
                Whether you&apos;re applying for a role, looking to partner with us, or just want to say hello, we&apos;d love to hear from you.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#f3ede4] flex items-center justify-center shadow-sm">
                    <MailIcon className="w-5 h-5 text-[#e05934]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Email Us</h4>
                    <p className="text-gray-500 text-sm">hello@vidyaai.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#f3ede4] flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-[#e05934]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Headquarters</h4>
                    <p className="text-gray-500 text-sm">San Francisco, CA (Remote-First)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: The Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-orange-900/5 border border-gray-100 relative"
            >
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap z-20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message sent successfully! We&apos;ll be in touch.
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#e05934] focus:ring-2 focus:ring-[#e05934]/20 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#e05934] focus:ring-2 focus:ring-[#e05934]/20 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="portfolio" className="block text-sm font-semibold text-gray-900 mb-2">
                    Link to Portfolio <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    id="portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#e05934] focus:ring-2 focus:ring-[#e05934]/20 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                    placeholder="https://github.com/janedoe"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#e05934] focus:ring-2 focus:ring-[#e05934]/20 outline-none transition-all placeholder:text-gray-400 text-gray-900 resize-none"
                    placeholder="Tell us a bit about why you're reaching out..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer 
        onContactClick={() => { window.location.href = '/contact'; }}
        onNavigate={(view) => { window.location.href = view === "home" ? "/" : "/" + view; }}
      />
    </div>
  );
}
