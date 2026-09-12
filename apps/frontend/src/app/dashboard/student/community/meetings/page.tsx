'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, List, Mic, MicOff, MonitorUp, PhoneOff, PlayCircle, Plus, Settings, Users, Video, VideoOff, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type Meeting = {
  id: string;
  title: string;
  scheduledAt: string;
  meetingLink?: string | null;
  host?: { id: string; firstName: string; lastName: string; role: string };
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'AC';
}
function isLive(v: string) { const s = new Date(v).getTime(), n = Date.now(); return s <= n && n - s < 90 * 60 * 1000; }
function isTomorrow(v: string) { const d = new Date(v), tm = new Date(); tm.setDate(tm.getDate() + 1); return d.toDateString() === tm.toDateString(); }
function meetingDate(v: string) {
  const d = new Date(v);
  return { day: d.toLocaleDateString([], { day: '2-digit' }), month: d.toLocaleDateString([], { month: 'short' }).toUpperCase(), time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
}
const MEETING_TYPES = ['SEMINAR', 'WORKSHOP', 'LAB'];
function meetingType(idx: number) { return MEETING_TYPES[idx % MEETING_TYPES.length]; }

function InMeetingView({ meeting, user, onLeave }: { meeting: Meeting; user: any; onLeave: () => void }) {
  const [micMuted, setMicMuted] = useState(true);
  const [videoOff, setVideoOff] = useState(false);
  const hostName = meeting.host ? `${meeting.host.firstName} ${meeting.host.lastName}` : user ? `${user.firstName} ${user.lastName}` : 'Host';
  const selfName = user ? `${user.firstName} ${user.lastName}` : 'You';
  const camBtn = (active: boolean): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#fee2e2' : '#fff', color: active ? '#dc2626' : '#0f172a', transition: 'all .15s' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', background: '#0b1020', color: '#fff', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{meeting.title}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Hosted by {hostName}</p>
        </div>
        <button onClick={onLeave} style={{ background: '#dc2626', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Leave</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 280 }}>
        <div style={{ background: '#1e293b', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>{initials(selfName)}</div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {micMuted && <MicOff size={12} style={{ color: '#fca5a5' }} />}{selfName} (You)
          </div>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{initials(hostName)}</div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>{hostName}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 16 }}>
        <button onClick={() => setMicMuted(v => !v)} style={camBtn(micMuted)}>{micMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
        <button onClick={() => setVideoOff(v => !v)} style={camBtn(videoOff)}>{videoOff ? <VideoOff size={20} /> : <Video size={20} />}</button>
        <button style={camBtn(false)}><MonitorUp size={20} /></button>
        <button style={camBtn(false)}><Settings size={20} /></button>
        <button onClick={onLeave} style={{ ...camBtn(false), background: '#dc2626', color: '#fff' }}><PhoneOff size={20} /></button>
      </div>
    </div>
  );
}

function ScheduleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [scheduledAt, setAt] = useState('');
  const [meetingLink, setLink] = useState('');
  const [creating, setCreating] = useState(false);
  const inp: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
  const lt: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;
    setCreating(true);
    try {
      await api.post('/meetings', { title: title.trim(), scheduledAt: new Date(scheduledAt).toISOString(), meetingLink: meetingLink.trim() });
      toast.success('Meeting scheduled');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not schedule meeting');
    } finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Schedule Meeting</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={lbl}><span style={lt}>Title</span><input value={title} onChange={e => setTitle(e.target.value)} style={inp} placeholder="Advanced Algorithm Models" required /></label>
          <label style={lbl}><span style={lt}>Date and Time</span><input type="datetime-local" value={scheduledAt} onChange={e => setAt(e.target.value)} style={inp} required /></label>
          <label style={lbl}><span style={lt}>Meeting Link</span><input value={meetingLink} onChange={e => setLink(e.target.value)} style={inp} placeholder="https://meet.example.com/…" /></label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose} style={{ height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px' }}>Cancel</button>
          <button type="submit" disabled={creating || !title.trim() || !scheduledAt} style={{ height: 40, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', opacity: (creating || !title.trim() || !scheduledAt) ? 0.5 : 1 }}>{creating ? 'Scheduling…' : 'Schedule'}</button>
        </div>
      </form>
    </div>
  );
}

function MiniCalendar({ highlightedDays }: { highlightedDays: number[] }) {
  const [offset, setOffset] = useState(0);
  const base = new Date(); base.setMonth(base.getMonth() + offset);
  const month = base.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const today = new Date().getDate();
  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{month}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setOffset(o => o - 1)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><ChevronLeft size={14} /></button>
          <button onClick={() => setOffset(o => o + 1)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' as const }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', paddingBottom: 6 }}>{d}</span>)}
        {Array.from({ length: 35 }, (_, i) => {
          const day = i + 1;
          const isToday = offset === 0 && day === today;
          const hasEvent = highlightedDays.includes(day);
          return (
            <span key={day} style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: isToday || hasEvent ? 800 : 600, background: isToday ? '#2563eb' : hasEvent ? '#eff6ff' : 'transparent', color: isToday ? '#fff' : hasEvent ? '#2563eb' : '#475569' }}>{day}</span>
          );
        })}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const fetchMeetings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/meetings');
      if (res.data?.status === 'success') setMeetings(res.data.data || []);
    } catch { if (!silent) toast.error('Could not load meetings'); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchMeetings(), 0);
    const i = window.setInterval(() => fetchMeetings(true), 5000);
    return () => { window.clearTimeout(t); window.clearInterval(i); };
  }, []);

  if (activeMeeting) return <InMeetingView meeting={activeMeeting} user={user} onLeave={() => setActiveMeeting(null)} />;

  const scheduledCount = meetings.length;
  const totalHours = Math.max(0, Math.round(meetings.length * 1.25 * 10) / 10);
  const calendarDays = meetings.map(m => new Date(m.scheduledAt).getDate());

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit', overflowY: 'auto', width: '100%' }}>
      <div style={{ width: '100%', padding: '40px 32px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap' as const, gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Upcoming Meetings</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Manage your virtual learning schedule and collaborative sessions.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: 3, gap: 2 }}>
              {(['list', 'calendar'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: view === v ? '#fff' : 'transparent', color: view === v ? '#2563eb' : '#64748b', boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  {v === 'list' ? <><List size={13} /> List View</> : <><CalendarDays size={13} /> Calendar</>}
                </button>
              ))}
            </div>
            <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', whiteSpace: 'nowrap' as const }}>
              <Plus size={15} /> Schedule Meeting
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14 }}>Loading meetings…</div>
            ) : meetings.length === 0 ? (
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 20, padding: 64, textAlign: 'center', background: '#fff' }}>
                <CalendarDays size={40} style={{ color: '#2563eb', marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>No meetings scheduled</p>
                <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0' }}>Schedule a meeting and it will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {meetings.map((meeting, idx) => {
                  const date = meetingDate(meeting.scheduledAt);
                  const live = isLive(meeting.scheduledAt);
                  const tmrw = !live && isTomorrow(meeting.scheduledAt);
                  const mtype = meetingType(idx);
                  const host = meeting.host ? `${meeting.host.firstName} ${meeting.host.lastName}` : 'Academic Clarity';
                  return (
                    <article key={meeting.id} style={{ background: '#fff', borderRadius: 20, border: `1px solid ${live ? '#bfdbfe' : '#e2e8f0'}`, padding: '20px 24px', boxShadow: live ? '0 4px 16px rgba(37,99,235,0.10)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 20, alignItems: 'center' }}>
                      {live && <div style={{ position: 'absolute', top: 0, right: 0, background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800, padding: '6px 14px', borderBottomLeftRadius: 12, letterSpacing: '0.06em' }}>LIVE NOW</div>}
                      <div style={{ width: 64, height: 72, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{date.day}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{date.month}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{mtype}</span>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{date.time}</span>
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{meeting.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                          <span>{host}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} style={{ color: '#94a3b8' }} /> Host and attendees</span>
                        </div>
                      </div>
                      <button onClick={() => setActiveMeeting(meeting)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', padding: '0 18px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' as const, background: live ? '#2563eb' : '#f1f5f9', color: live ? '#fff' : '#0f172a', boxShadow: live ? '0 2px 8px rgba(37,99,235,0.25)' : 'none', transition: 'all .15s' }}>
                        {live ? <PlayCircle size={15} /> : <Clock size={15} />}
                        {live ? 'Join Meeting' : tmrw ? 'Tomorrow' : `Join at ${date.time}`}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Weekly Focus</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{scheduledCount}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Scheduled</p>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16 }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalHours}h</p>
                  <p style={{ margin: '6px 0 0', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Total Time</p>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Attendance Goal</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb' }}>85%</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#2563eb', borderRadius: 100 }} />
                </div>
              </div>
            </div>
            <MiniCalendar highlightedDays={calendarDays} />
            <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', padding: 20, color: '#fff', minHeight: 100 }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>NEW FEATURE</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, lineHeight: 1.3 }}>Group Audio Lounges</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Drop into casual voice rooms with classmates.</p>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setModalOpen(true)} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 30, width: 56, height: 56, borderRadius: '50%', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }} aria-label="Schedule meeting">
        <Plus size={24} />
      </button>

      {modalOpen && <ScheduleModal onClose={() => setModalOpen(false)} onCreated={() => fetchMeetings(true)} />}
    </div>
  );
}
