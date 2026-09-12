'use client';

import React from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Briefcase, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CareersPage() {
  const openRoles = [
    {
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Remote / San Francisco",
      type: "Full-time",
      description: "Join our core product team to build end-to-end features for our AI-powered grading ecosystem. You'll work with Next.js, Node.js, and our proprietary AI models."
    },
    {
      title: "App Developer",
      department: "Mobile Engineering",
      location: "Remote / San Francisco",
      type: "Full-time",
      description: "Lead the development of the VidyaAI mobile experience, ensuring teachers and students have seamless access to insights on the go."
    },
    {
      title: "Backend Developer",
      department: "Engineering",
      location: "Remote / New York",
      type: "Full-time",
      description: "Scale our infrastructure to handle millions of assessments. Experience with PostgreSQL, microservices, and high-throughput systems is required."
    },
    {
      title: "UI/UX Developer",
      department: "Design & Product",
      location: "Remote",
      type: "Full-time",
      description: "Bridge the gap between design and engineering. You'll create beautiful, accessible, and intuitive interfaces that teachers love to use every day."
    },
    {
      title: "Server Management & DevOps",
      department: "Infrastructure",
      location: "Remote",
      type: "Full-time",
      description: "Ensure 99.99% uptime for our AI endpoints and core databases. You'll manage AWS infrastructure, CI/CD pipelines, and security protocols."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1e1e1a] selection:bg-[#e05934]/20 selection:text-[#e05934] overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-100/40 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-orange-50 border border-orange-100 text-[#e05934] text-xs font-bold tracking-widest uppercase mb-6">
              Join Our Mission
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-gray-900 mb-6">
              Help us redefine <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e05934] to-[#f08a5d]">
                education with AI.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
              We&apos;re a fast-growing team of educators, engineers, and designers building the future of assessment. If you&apos;re passionate about empowering teachers and students, you belong here.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Open Roles Section */}
      <section className="py-20 bg-white border-t border-[#f3ede4]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Open Positions</h2>
              <p className="text-gray-600">Find the role that fits your skills and join our remote-first team.</p>
            </div>
            <div className="shrink-0 text-sm font-medium text-gray-500 bg-gray-50 py-2 px-4 rounded-full border border-gray-100">
              {openRoles.length} Openings Available
            </div>
          </div>

          <div className="space-y-4">
            {openRoles.map((role, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-[#fcfbf9] border border-[#f3ede4] rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:shadow-orange-900/5 hover:border-orange-200 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-[#e05934] uppercase tracking-wider">{role.department}</span>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-3 group-hover:text-[#e05934] transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mb-5">
                      {role.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {role.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {role.type}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Fast-paced
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 lg:pl-6 lg:border-l border-gray-200 flex items-center">
                    <Link 
                      href="/contact"
                      className="inline-flex items-center justify-center w-full lg:w-auto px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors group-hover:shadow-md"
                    >
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Cannot find role */}
          <div className="mt-16 text-center bg-orange-50/50 rounded-2xl p-8 border border-orange-100/50">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Don&apos;t see a fit?</h4>
            <p className="text-gray-600 mb-6 text-sm">We&apos;re always looking for talented individuals. Send us your resume and we&apos;ll keep you in mind for future roles.</p>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white border border-[#f3ede4] text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
            >
              Get in Touch
            </Link>
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
