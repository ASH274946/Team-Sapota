'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Clock, ArrowRight, RotateCcw, Lightbulb, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { LoadingState } from '@/design-system/LoadingState';
import { ErrorState } from '@/design-system/ErrorState';
import { Button } from '@/design-system/Button';
import { Input } from '@/design-system/Input';
import { Dialog } from '@/design-system/Dialog';
import { FlashcardModal } from '@/components/ui/FlashcardModal';
import type { TutorSession } from '@/types/tutor.types';
import { createSession, restartSession, generateFlashcards, renameSession, deleteSession } from '@/services/tutor.service';

export default function TutorSessionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashcardSessionId, setFlashcardSessionId] = useState<string | null>(null);

  // For Rename/Delete
  const [editingSession, setEditingSession] = useState<{ id: string; title: string } | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: TutorSession[] }>(`/tutor/sessions?studentId=${user.id}`);
      setSessions(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tutor sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error('Please enter a subject/topic');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await createSession({ subject: newSubject, tutorMode: 'SOCRATIC' });
      toast.success('Session created successfully');
      router.push(`/student/tutor/${session.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestartSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await restartSession(sessionId);
      toast.success('Session restarted successfully');
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restart session');
    }
  };

  const openFlashcards = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setFlashcardSessionId(sessionId);
  };

  const handleRenameSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !editingSession.title.trim()) return;
    setIsSubmitting(true);
    try {
      await renameSession(editingSession.id, editingSession.title);
      toast.success('Session renamed');
      setEditingSession(null);
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to rename');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSessionId) return;
    setIsSubmitting(true);
    try {
      await deleteSession(deletingSessionId);
      toast.success('Session deleted');
      setDeletingSessionId(null);
      fetchSessions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState lines={5} />;
  if (error) return <ErrorState message={error} onRetry={fetchSessions} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="AI Tutor"
          subtitle="Your personalized Socratic learning companion."
        />
        <Button onClick={() => setIsModalOpen(true)} variant="primary" style={{ gap: 8 }}>
          <Plus size={16} /> New Session
        </Button>
      </div>

      <Dialog 
        open={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Start a new Tutor Session"
      >
        <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="What would you like to learn about?"
            placeholder="e.g. Newton's Laws of Motion, Quantum Physics, Data Structures..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            disabled={isSubmitting}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Start Session
            </Button>
          </div>
        </form>
      </Dialog>

      {sessions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>No active sessions</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Start a new session to get help with your studies.</p>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">Start a Session</Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {sessions.map((session) => (
            <div 
              key={session.id} 
              onClick={() => router.push(`/student/tutor/${session.id}`)}
              style={{ textDecoration: 'none', display: 'block' }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <Card 
                padding="20px" 
                style={{ 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12,
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {(session as any).title || session.subject}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {session.subject}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setEditingSession({ id: session.id, title: (session as any).title || session.subject }); }}
                        style={{ padding: 4, height: 'auto', minWidth: 'auto', color: 'var(--text-muted)' }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); setDeletingSessionId(session.id); }}
                        style={{ padding: 4, height: 'auto', minWidth: 'auto', color: '#EF4444' }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div style={{ 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      fontSize: '11px', 
                      fontWeight: 600,
                      background: session.status === 'ACTIVE' ? '#D1FAE5' : '#F3F4F6',
                      color: session.status === 'ACTIVE' ? '#065F46' : '#4B5563',
                    }}>
                      {session.status}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 'auto' }}>
                  <Clock size={14} />
                  <span>{new Date(session.updatedAt || session.createdAt).toLocaleDateString()}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand)', fontWeight: 500 }}>
                    {session.status === 'ACTIVE' ? 'Resume' : 'View'} <ArrowRight size={14} />
                  </span>
                </div>

                {session.status === 'CLOSED' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => handleRestartSession(e, session.id)}
                      style={{ flex: 1, fontSize: 12 }}
                    >
                      <RotateCcw size={14} style={{ marginRight: 6 }} /> Restart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => openFlashcards(e, session.id)}
                      style={{ flex: 1, fontSize: 12, color: '#F97316', borderColor: '#F97316' }}
                    >
                      <Lightbulb size={14} style={{ marginRight: 6 }} /> Flashcards
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}

      {flashcardSessionId && (
        <FlashcardModal
          open={!!flashcardSessionId}
          onClose={() => setFlashcardSessionId(null)}
          fetchFlashcards={() => generateFlashcards(flashcardSessionId)}
        />
      )}

      {/* Rename Modal */}
      <Dialog 
        open={!!editingSession} 
        onClose={() => !isSubmitting && setEditingSession(null)}
        title="Rename Session"
      >
        <form onSubmit={handleRenameSession} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Title"
            value={editingSession?.title || ''}
            onChange={(e) => setEditingSession(prev => prev ? { ...prev, title: e.target.value } : null)}
            disabled={isSubmitting}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setEditingSession(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={!!deletingSessionId} 
        onClose={() => !isSubmitting && setDeletingSessionId(null)}
        title="Delete Session"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this AI Tutor session? This action cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setDeletingSessionId(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" style={{ background: '#EF4444' }} onClick={handleDeleteSession} loading={isSubmitting}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
