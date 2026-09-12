'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bell, Info, Paperclip, Phone, Search, Send, UserRound, Video, X, Sparkles, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Conversation = {
  id: string;
  name: string;
  isDM: boolean;
  recipientId?: string;
  role?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
};

type OrgUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: { id: string; firstName: string; lastName: string; role: string };
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'AC';
}

function formatTime(value?: string) {
  if (!value) return 'Now';
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function msgTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildDmId(a: string, b: string) {
  return `dm_${[a, b].sort().join('_')}`;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState(''); // Kept state just in case, but hidden in UI
  const [composeQuery, setComposeQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const uid = user?.id || '';

  const fetchConvos = async (silent = false) => {
    try {
      if (!silent) setLoadingConvos(true);
      const res = await api.get('/chat/conversations');
      if (res.data?.status === 'success') setConversations(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load conversations'); }
    finally { if (!silent) setLoadingConvos(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/chat/users');
      if (res.data?.status === 'success') setOrgUsers(res.data.data || []);
    } catch { toast.error('Could not load people'); }
  };

  const fetchMsgs = async (id: string, silent = false) => {
    try {
      if (!silent) setLoadingMsgs(true);
      const res = await api.get(`/chat/messages/${id}`);
      if (res.data?.status === 'success') setMessages(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load messages'); }
    finally { if (!silent) setLoadingMsgs(false); }
  };

  useEffect(() => {
    if (!user) return;
    fetchConvos();
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    fetchMsgs(activeId);
  }, [activeId]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      fetchConvos(true);
      if (activeId) fetchMsgs(activeId, true);
    }, 3000);
    return () => clearInterval(t);
  }, [user, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const activeConvo = useMemo(() => {
    if (!activeId) return null;
    const existing = conversations.find((c) => c.id === activeId);
    if (existing) return existing;
    const rid = activeId.replace('dm_', '').split('_').find((x) => x !== uid);
    const r = orgUsers.find((u) => u.id === rid);
    if (!r) return null;
    return { id: activeId, name: `${r.firstName} ${r.lastName}`, isDM: true, recipientId: r.id, role: r.role, lastMessage: '' };
  }, [activeId, conversations, uid, orgUsers]);

  const filteredConvos = conversations.filter((c) => c.isDM && c.name.toLowerCase().includes(query.toLowerCase()));
  const filteredUsers = orgUsers.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(composeQuery.toLowerCase()));

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    const msg = draft.trim();
    setDraft('');
    try {
      const res = await api.post('/chat/messages', { conversationId: activeId, message: msg });
      if (res.data?.status === 'success') {
        setMessages((prev) => [...prev, res.data.data]);
        fetchConvos(true);
      }
    } catch { setDraft(msg); toast.error('Message was not sent'); }
  };

  const startConvo = (r: OrgUser) => {
    const existing = conversations.find((c) => c.isDM && c.recipientId === r.id);
    setActiveId(existing?.id || buildDmId(uid, r.id));
    setComposeOpen(false);
    setComposeQuery('');
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#f8fafc', color: '#0b1020', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%', 
        background: '#fff', 
        borderRadius: 24, 
        boxShadow: '0 4px 40px rgba(0,0,0,0.04)', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden' 
      }}>
        {/* ── Conversations sidebar ── */}
        <aside style={{
          display: 'flex',
          flexDirection: 'column',
          width: 340, minWidth: 340, height: '100%', borderRight: '1px solid #e8eaf0',
          background: '#fff',
        }}
          className={`${activeId ? 'hidden md:flex' : 'flex'}`}
          aria-label="Conversations list"
        >
          {/* Header matching screenshot */}
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e8eaf0' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Community</h1>
            <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, margin: 0 }}>Active Conversations</p>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
            {loadingConvos ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading…</div>
            ) : filteredConvos.length === 0 ? (
              <div style={{ margin: '16px 24px', borderRadius: 16, border: '1.5px dashed #dde3f5', background: 'rgba(255,255,255,0.7)', padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>No conversations yet</p>
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Start a message with someone in your org.</p>
              </div>
            ) : filteredConvos.map((c) => {
              const active = c.id === activeId;
              return (
                <button key={c.id} onClick={() => setActiveId(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 24px', border: 'none', cursor: 'pointer',
                  background: active ? '#f8f9fb' : 'transparent', textAlign: 'left',
                  borderLeft: active ? '3px solid #0f172a' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8f9fb'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, borderRadius: '50%', background: active ? '#2563eb' : '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
                    {initials(c.name)}
                    <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>{formatTime(c.lastMessageTime)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: active ? '#0f172a' : '#64748b', fontWeight: active ? 600 : 500, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* New Conversation Button at bottom */}
          <div style={{ padding: '20px 24px' }}>
            <button
              onClick={() => setComposeOpen(true)}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px dashed #cbd5e1', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Plus size={16} /> New Conversation
            </button>
          </div>

        </aside>

        {/* ── Chat panel ── */}
        <main style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0, background: '#fff' }}
          className={`${activeId ? 'flex' : 'hidden md:flex'}`}
          aria-label="Chat window"
        >
        {!activeId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <UserRound style={{ width: 32, height: 32, color: '#2563eb' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Select a conversation</h2>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 320, lineHeight: 1.6, margin: 0 }}>Choose from the list or start a new direct message.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header style={{ height: 72, flexShrink: 0, borderBottom: '1px solid #e8eaf0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <button onClick={() => setActiveId(null)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} aria-label="Back" className="md:hidden">
                  <ArrowLeft style={{ width: 20, height: 20 }} />
                </button>
                <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {initials(activeConvo?.name || 'AC')}
                  <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{activeConvo?.name || 'Conversation'}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Online
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ icon: Video, label: 'Video call' }, { icon: Phone, label: 'Voice call' }, { icon: Info, label: 'Info' }, { icon: Bell, label: 'Notifications' }].map(({ icon: Icon, label }) => (
                  <button key={label} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    aria-label={label}
                  >
                    <Icon style={{ width: 19, height: 19 }} />
                  </button>
                ))}
              </div>
            </header>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, alignItems: 'center', gap: 16 }}>
                 <div style={{ height: 1, background: '#e2e8f0', flex: 1 }} />
                 <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Today</span>
                 <div style={{ height: 1, background: '#e2e8f0', flex: 1 }} />
              </div>
              {loadingMsgs ? (
                <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading messages…</div>
              ) : messages.length === 0 ? (
                <div style={{ maxWidth: 360, margin: '0 auto', borderRadius: 20, border: '1.5px dashed #dde3f5', background: 'rgba(255,255,255,0.8)', padding: '40px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', margin: 0 }}>No messages yet</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Send the first message to start the conversation.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((msg) => {
                    const mine = msg.senderId === uid;
                    const name = msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : activeConvo?.name || 'Member';
                    return (
                      <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, maxWidth: '72%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
                        {!mine && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, marginBottom: 18 }}>
                            {initials(name)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            padding: '16px', borderRadius: 16,
                            background: mine ? '#000000' : '#f8f9fb',
                            color: mine ? '#fff' : '#0f172a',
                            fontSize: 14, fontWeight: 500, lineHeight: 1.55,
                            border: mine ? 'none' : '1px solid #f1f5f9'
                          }}>
                            {msg.message}
                          </div>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 6 }}>
                            {msgTime(msg.createdAt)}{mine ? ' • Read' : ''}
                          </span>
                        </div>
                        {mine && (
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0, marginBottom: 18 }}>
                            {initials(user?.firstName + ' ' + user?.lastName)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Decorative VedaAI Suggestion block, purely visual for demonstration as requested */}
                  {messages.length > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                       <button 
                         onClick={() => setDraft('Exactly. A few concrete examples of how the stack grows would make it perfect.')}
                         style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 24, border: '1px solid #f97316', background: '#fffaf5', color: '#ea580c', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                       >
                         <Sparkles size={16} /> VedaAI suggest: Prof. Hamilton often values practical examples for space complexity.
                       </button>
                     </div>
                  )}

                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <form onSubmit={sendMessage} style={{ flexShrink: 0, borderTop: '1px solid #e8eaf0', background: '#fff', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8f9fb', borderRadius: 16, padding: '6px 6px 6px 16px', border: '1px solid #f1f5f9' }}>
                <button type="button" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  <Paperclip style={{ width: 18, height: 18 }} />
                </button>
                <input
                  value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..."
                  style={{ flex: 1, height: 40, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: '#0f172a', outline: 'none' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as any); } }}
                />
                <button type="button" onClick={() => setDraft('Thank you, Professor! I was a bit worried about the space complexity section.')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#d97706', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <Sparkles style={{ width: 18, height: 18 }} />
                </button>
                <button type="submit" disabled={!draft.trim()} style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed',
                  background: '#000000', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  opacity: draft.trim() ? 1 : 0.5
                }} aria-label="Send">
                  <Send style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
      </div>

      {/* ── Compose modal ── */}
      {composeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setComposeOpen(false); }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '82vh', background: '#fff', borderRadius: 24, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8eaf0', padding: '18px 20px' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>New Message</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>People in your organization</p>
              </div>
              <button onClick={() => setComposeOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }} aria-label="Close">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaf0' }}>
              <label style={{ position: 'relative', display: 'block' }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
                <input value={composeQuery} onChange={(e) => setComposeQuery(e.target.value)} placeholder="Search students or staff..." style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: '#f1f3f9', paddingLeft: 40, paddingRight: 16, fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box' }} />
              </label>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>No people found</div>
              ) : filteredUsers.map((p) => (
                <button key={p.id} onClick={() => startConvo(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5ff'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {initials(`${p.firstName} ${p.lastName}`)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{p.firstName} {p.lastName}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
