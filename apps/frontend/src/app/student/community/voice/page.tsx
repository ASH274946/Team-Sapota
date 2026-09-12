'use client';
import { NativeSelect } from '@/components/ui/native-select';


import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Headphones, Mic, MicOff, Phone, Plus, Radio, Users, Volume2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type VoiceRoom = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  description?: string;
  participantCount?: number;
  createdAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
};

function getAvatar(id: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${id}&backgroundColor=e2e8f0`;
}

function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'STUDY' | 'PROJECT' | 'CASUAL' | 'INTERVIEW'>('STUDY');
  const [creating, setCreating] = useState(false);

  const inp: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 14px', fontSize: 13, fontWeight: 500, color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' as const, background: '#fff', fontFamily: 'inherit' };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      await api.post('/voice/rooms', { name: roomName.trim(), type: roomType });
      toast.success('Voice room created');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not create room');
    } finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 24px 48px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Create Voice Room</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6, color: '#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Room Name</span>
            <input value={roomName} onChange={e => setRoomName(e.target.value)} style={inp} placeholder="Late Night Study" required />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748b' }}>Room Type</span>
            <NativeSelect value={roomType} onChange={e => setRoomType(e.target.value as any)} style={inp}>
              <option value="STUDY">Study</option>
              <option value="PROJECT">Project</option>
              <option value="CASUAL">Casual</option>
              <option value="INTERVIEW">Interview</option>
            </NativeSelect>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose} style={{ height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px' }}>Cancel</button>
          <button type="submit" disabled={creating || !roomName.trim()} style={{ height: 40, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', opacity: (creating || !roomName.trim()) ? 0.5 : 1 }}>{creating ? 'Creating…' : 'Create Room'}</button>
        </div>
      </form>
    </div>
  );
}

export default function VoiceRoomsPage() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('default');

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      setAudioInputs(inputs);
      setAudioOutputs(outputs);
      if (inputs.length && !selectedMic) setSelectedMic(inputs[0].deviceId);
      if (outputs.length && !selectedSpeaker) setSelectedSpeaker(outputs[0].deviceId);
    }).catch(console.error);
  }, []);

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/voice/rooms');
      if (res.data?.status === 'success') {
        setRooms(res.data.data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not load voice rooms';
      console.error('[Voice Rooms Error]', errorMsg, err);
      if (!silent) {
        // Only show error toast for non-401 errors or initial load failures
        if (err?.response?.status !== 401) {
          toast.error(errorMsg);
        } else {
          console.warn('[Auth Error] Token may have expired, will retry');
        }
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchRooms(), 0);
    const i = window.setInterval(() => fetchRooms(true), 5000);
    return () => { 
      window.clearTimeout(t); 
      window.clearInterval(i); 
    };
  }, []);

  const joinRoom = async (room: VoiceRoom) => {
    try {
      // Generate token first
      const tokenRes = await api.get(`/voice/rooms/${encodeURIComponent(room.name)}/token`);
      if (tokenRes.data?.status !== 'success') {
        throw new Error('Failed to generate token');
      }
      
      // Record join in database
      await api.post(`/voice/rooms/${room.id}/join`);
      
      setJoinedRoomId(room.id);
      toast.success(`Joined ${room.name}`);
      
      // Refresh rooms list after joining
      await fetchRooms(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Could not join room';
      console.error('[Join Room Error]', msg, err);
      toast.error(msg);
    }
  };

  const leaveRoom = async () => {
    if (!joinedRoomId) return;
    try {
      await api.post(`/voice/rooms/${joinedRoomId}/leave`);
      setJoinedRoomId(null);
      toast.success('Left the voice room');
      
      // Refresh rooms list after leaving
      await fetchRooms(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Could not leave room';
      console.error('[Leave Room Error]', msg, err);
      toast.error(msg);
    }
  };

  const joinedRoom = rooms.find(r => r.id === joinedRoomId) ?? null;
  const userName = user ? `${user.firstName} ${user.lastName}` : 'You';

  // Build active speakers from rooms that have creators
  const activeSpeakers = useMemo(() => {
    const speakers: { id?: string; name: string; room: string; status: string }[] = [];
    rooms.forEach(r => {
      if (r.createdBy) {
        const name = `${r.createdBy.firstName} ${r.createdBy.lastName}`;
        speakers.push({ name, room: r.name, status: r.id === joinedRoomId ? 'Speaking' : 'Listening' });
      }
    });
    // Fill with placeholder speakers if empty for better UI
    if (speakers.length === 0) {
      speakers.push(
        { id: '1', name: 'Liam Chen', room: 'Physics Q&A', status: 'Speaking' },
        { id: '2', name: 'Sarah Jenkins', room: 'Late Night Study', status: 'Listening' },
        { id: '3', name: 'Marcus Thorne', room: 'Career Chat', status: 'Idle' },
        { id: '4', name: 'Yuki Tanaka', room: 'Career Chat', status: 'Speaking' },
      );
    }
    return speakers.slice(0, 6);
  }, [rooms, joinedRoomId]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: '#f8fafc', fontFamily: 'inherit', overflow: 'hidden' }}>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 32px 80px', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Voice Rooms</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>Jump into a live audio discussion with your peers.</p>
          </div>
          <button onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '0 20px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <Plus size={15} /> Create Room
          </button>
        </div>

        {/* Rooms grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14 }}>Loading voice rooms…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {rooms.map((room) => {
              const joined = room.id === joinedRoomId;
              const host = room.createdBy ? `${room.createdBy.firstName} ${room.createdBy.lastName}` : 'Open Room';
              const count = room.participantCount ?? (room.id.charCodeAt(0) % 20) + 2;
              return (
                <article key={room.id} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                        <Radio size={14} style={{ animation: 'pulse 2s infinite' }} /> LIVE NOW
                      </div>
                      {/* Mini avatars placeholder */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[0,1].map(i => (
                          <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: '#e2e8f0', border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img src={getAvatar(room.id + i)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                        <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: '#64748b' }}>+{count}</span>
                      </div>
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{room.name}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
                      {room.description || `Hosted by ${host}. Open to all members.`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      <Users size={14} style={{ color: '#94a3b8' }} /> {count} participants
                    </div>
                    <button onClick={() => joined ? leaveRoom() : joinRoom(room)} style={{ height: 36, borderRadius: 10, border: 'none', background: joined ? '#22c55e' : '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 18px', transition: 'all .15s' }}>
                      {joined ? 'Leave Room' : 'Join Room'}
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Schedule a Room placeholder card */}
            <article onClick={() => setModalOpen(true)} style={{ background: '#f8fafc', borderRadius: 20, border: '2px dashed #e2e8f0', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer', transition: 'border-color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Radio size={22} style={{ color: '#2563eb' }} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Schedule a Room</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>Plan a future voice session and invite your group members.</p>
            </article>

            {rooms.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>No live rooms yet. Create one above.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Right sidebar: Active Speakers ── */}
      <aside style={{ width: 280, flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '32px 20px 20px', height: '100%', overflowY: 'auto' }}>
        <p style={{ margin: '0 0 20px', fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }}>Active Speakers</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {activeSpeakers.map((speaker, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={getAvatar((speaker as any).id || speaker.name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {speaker.status === 'Speaking' && (
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mic size={9} style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{speaker.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: speaker.status === 'Speaking' ? '#2563eb' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {speaker.status} in {speaker.room}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom status bar */}
        <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: joinedRoom ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{joinedRoom ? joinedRoom.name : 'Not in a room'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Microphone</span>
              <NativeSelect value={selectedMic} onChange={e => setSelectedMic(e.target.value)} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, padding: '0 8px', outline: 'none', background: '#f8fafc', color: '#0f172a' }}>
                {audioInputs.length === 0 && <option value="default">Default Microphone</option>}
                {audioInputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${audioInputs.indexOf(d) + 1}`}</option>)}
              </NativeSelect>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Headphones</span>
              <NativeSelect value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)} style={{ width: '100%', height: 32, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, padding: '0 8px', outline: 'none', background: '#f8fafc', color: '#0f172a' }}>
                {audioOutputs.length === 0 && <option value="default">Default Speakers</option>}
                {audioOutputs.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${audioOutputs.indexOf(d) + 1}`}</option>)}
              </NativeSelect>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button onClick={() => setMicMuted(v => !v)} style={{ height: 44, borderRadius: 12, border: '1.5px solid #e2e8f0', background: micMuted ? '#fff5f5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: micMuted ? '#dc2626' : '#0f172a' }} aria-label="Toggle mic" title={micMuted ? "Unmute Mic" : "Mute Mic"}>
              {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={() => setDeafened(v => !v)} style={{ height: 44, borderRadius: 12, border: '1.5px solid #e2e8f0', background: deafened ? '#fff5f5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: deafened ? '#dc2626' : '#0f172a' }} aria-label="Toggle headphones" title={deafened ? "Undeafen" : "Deafen"}>
              {deafened ? <Volume2 size={18} /> : <Headphones size={18} />}
            </button>
            <button onClick={() => setJoinedRoomId(null)} disabled={!joinedRoom} style={{ height: 44, borderRadius: 12, border: 'none', background: joinedRoom ? '#22c55e' : '#2563eb', cursor: joinedRoom ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', opacity: joinedRoom ? 1 : 0.5 }} aria-label={joinedRoom ? "Leave call" : "Join a call first"} title={joinedRoom ? "Leave call" : "Join a call first"}>
              <Phone size={18} />
            </button>
          </div>
        </div>
      </aside>

      {modalOpen && <CreateRoomModal onClose={() => setModalOpen(false)} onCreated={() => fetchRooms(true)} />}
    </div>
  );
}
