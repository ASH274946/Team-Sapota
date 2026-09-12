'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/design-system/Dialog';
import { Button } from '@/design-system/Button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardModalProps {
  open: boolean;
  onClose: () => void;
  fetchFlashcards: () => Promise<Flashcard[]>;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ open, onClose, fetchFlashcards }) => {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const loadFlashcards = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cards = await fetchFlashcards();
      setFlashcards(cards);
    } catch (err: any) {
      setError(err.message || 'Failed to generate flashcards.');
    } finally {
      setLoading(false);
    }
  }, [fetchFlashcards]);

  useEffect(() => {
    if (open) {
      loadFlashcards();
    } else {
      // Reset state when closed
      setTimeout(() => {
        setFlashcards([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setError(null);
      }, 300);
    }
  }, [open, loadFlashcards]);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, flashcards.length - 1));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, 150);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Smart Flashcards">
      <div style={{ minHeight: 450, display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            >
              <RotateCcw size={40} style={{ color: 'var(--brand)', opacity: 0.8 }} />
            </motion.div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500 }}>Extracting key concepts from your session...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
            <div style={{ padding: 16, background: 'var(--error-light)', color: 'var(--error)', borderRadius: 'var(--radius-md)' }}>
              {error}
            </div>
            <Button onClick={loadFlashcards} variant="primary">Try Again</Button>
          </div>
        )}

        {!loading && !error && flashcards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
            {/* Header / Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 8px' }}>
              <div style={{ display: 'flex', gap: 4, flex: 1, maxWidth: 200 }}>
                {flashcards.map((_, idx) => (
                  <div 
                    key={idx}
                    style={{
                      height: 4,
                      flex: 1,
                      borderRadius: 2,
                      background: idx === currentIndex ? 'var(--brand)' : idx < currentIndex ? 'var(--brand-light)' : 'var(--border-subtle)',
                      transition: 'background 0.3s'
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {currentIndex + 1} / {flashcards.length}
                </span>
                <button 
                  onClick={() => setIsFlipped(!isFlipped)} 
                  style={{ 
                    background: 'var(--bg-hover)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 20,
                    padding: '4px 12px',
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <RotateCcw size={12} /> {isFlipped ? 'Show Question' : 'Show Answer'}
                </button>
              </div>
            </div>

            {/* Flashcard 3D Container */}
            <div 
              style={{ 
                flex: 1, 
                perspective: 1500, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '0 24px',
              }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
                style={{
                  width: '100%',
                  height: 300, // Fixed large height for immersive feel
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Front (Question) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                  border: '1px solid var(--border-base)',
                  borderRadius: 24,
                  padding: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
                }}>
                  <h2 style={{ 
                    fontSize: 'clamp(20px, 4vw, 28px)', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    margin: 0
                  }}>
                    {flashcards[currentIndex].front}
                  </h2>
                </div>

                {/* Back (Answer) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: 'var(--brand)',
                  borderRadius: 24,
                  padding: 40,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transform: 'rotateY(180deg)',
                  boxShadow: '0 20px 40px -10px rgba(var(--brand-rgb), 0.3)',
                  color: 'white'
                }}>
                  <div style={{
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    fontWeight: 700,
                    marginBottom: 16,
                    opacity: 0.8
                  }}>Answer</div>
                  <p style={{ 
                    fontSize: 'clamp(16px, 3vw, 20px)', 
                    fontWeight: 500, 
                    lineHeight: 1.5,
                    margin: 0,
                    opacity: 0.95
                  }}>
                    {flashcards[currentIndex].back}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 40 }}>
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0} 
                style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentIndex === 0 ? 'var(--bg-hover)' : 'white',
                  border: '1px solid var(--border-subtle)',
                  color: currentIndex === 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: currentIndex === 0 ? 'none' : 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronLeft size={24} />
              </button>
              
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Use arrows to navigate
              </div>

              <button 
                onClick={handleNext} 
                disabled={currentIndex === flashcards.length - 1} 
                style={{ 
                  width: 48, height: 48, borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: currentIndex === flashcards.length - 1 ? 'var(--bg-hover)' : 'white',
                  border: '1px solid var(--border-subtle)',
                  color: currentIndex === flashcards.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                  cursor: currentIndex === flashcards.length - 1 ? 'not-allowed' : 'pointer',
                  boxShadow: currentIndex === flashcards.length - 1 ? 'none' : 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
