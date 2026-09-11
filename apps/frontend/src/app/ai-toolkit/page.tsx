'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, FileSignature, CheckSquare, BookOpen, ChevronRight, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const TOOLKIT_OPTIONS = [
  {
    id: 'quiz',
    title: 'Quiz Generator',
    description: 'Instantly generate engaging quizzes from any topic, document, or YouTube video using AI.',
    icon: BrainCircuit,
    href: '/generate',
    color: 'from-orange-500 to-red-500',
    bgLight: '#FFF7ED',
    iconColor: '#F97316',
    available: true
  },
  {
    id: 'grading',
    title: 'Automated Grading',
    description: 'Save hours by letting AI grade subjective answers, essays, and assignments with detailed rubrics.',
    icon: FileSignature,
    href: '/grader',
    color: 'from-blue-500 to-indigo-500',
    bgLight: '#EFF6FF',
    iconColor: '#3B82F6',
    available: true
  },
  {
    id: 'tests',
    title: 'Tests Generation',
    description: 'Create comprehensive term exams and standardized tests perfectly aligned with your curriculum.',
    icon: CheckSquare,
    href: '/ai-toolkit/tests',
    color: 'from-emerald-500 to-teal-500',
    bgLight: '#ECFDF5',
    iconColor: '#10B981',
    available: true
  },
  {
    id: 'lesson-planner',
    title: 'Lesson Planner',
    description: 'Design structured, interactive, and personalized lesson plans tailored to your students\' needs.',
    icon: BookOpen,
    href: '/teacher/copilot',
    color: 'from-purple-500 to-fuchsia-500',
    bgLight: '#FAF5FF',
    iconColor: '#A855F7',
    available: true
  }
];

export default function AIToolkitPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="page-container" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ padding: '8px', background: '#FFF7ED', borderRadius: '12px' }}>
            <Sparkles size={24} color="#F97316" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0 }}>AI Teacher's Toolkit</h1>
        </div>
        <p style={{ fontSize: '16px', color: '#6B7280', margin: 0, maxWidth: '600px' }}>
          Supercharge your teaching with VedaAI's suite of intelligent tools designed to save time and enhance student outcomes.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {TOOLKIT_OPTIONS.map((option, idx) => (
          <motion.div 
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            {option.available ? (
              <Link href={option.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = option.iconColor;
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: option.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <option.icon size={24} color={option.iconColor} />
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={16} color="#6B7280" />
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>{option.title}</h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                    {option.description}
                  </p>
                </div>
              </Link>
            ) : (
              <div style={{
                background: '#F9FAFB',
                border: '1px dashed #D1D5DB',
                borderRadius: '16px',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <option.icon size={24} color="#9CA3AF" />
                  </div>
                  <div style={{ background: '#F3F4F6', padding: '4px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} color="#6B7280" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Coming Soon</span>
                  </div>
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#9CA3AF', margin: '0 0 8px 0' }}>{option.title}</h3>
                <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                  {option.description}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
