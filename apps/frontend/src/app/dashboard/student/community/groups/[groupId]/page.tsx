'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Users, Loader2, UserPlus, X, Search, Sparkles, MoreVertical, MessageSquare, Ban, UserCheck } from 'lucide-react';
import { useGroupSocket } from '@/hooks/useGroupSocket';
import { useSocketStore } from '@/store/socket.store';

type GroupMember = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  role: string;
};

export default function GroupChatPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<GroupMember[]>([]);
  
  // Use Global Socket State
  const { messages, presence, typingUsers, setInitialMessages } = useSocketStore();
  const { sendMessage, sendTyping } = useGroupSocket(user?.id, groupId);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Invite Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
  useEffect(() => {
    if (!groupId || !user) return;

    const loadData = async () => {
      try {
        const [membersRes, msgsRes] = await Promise.all([
          api.get(`/community/groups/${groupId}/members`),
          api.get(`/community/groups/${groupId}/messages?limit=100`)
        ]);
        
        if (membersRes.data.status === 'success') {
          setMembers(membersRes.data.data);
        }
        if (msgsRes.data.status === 'success') {
          setInitialMessages(msgsRes.data.data);
        }
      } catch (err: any) {
        toast.error('Failed to load group chat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, user]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(true);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    sendTyping(false);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const msgContent = newMessage.trim();
    useSocketStore.getState().addOptimisticMessage({
      id: tempId,
      tempId,
      senderId: user!.id,
      sender: {
        id: user!.id,
        firstName: user!.firstName,
        lastName: user!.lastName
      },
      message: msgContent,
      createdAt: new Date().toISOString(),
      status: 'sending'
    });
    setNewMessage('');

    try {
      sendMessage(msgContent, tempId);
    } catch (err: any) {
      toast.error('Failed to send message');
      useSocketStore.getState().markMessageFailed(tempId);
    } finally {
      setSending(false);
    }
  };

  const isOwner = members.find(m => m.user.id === user?.id)?.role === 'OWNER';
  
  const onlineMembers = members.filter(m => m.user.id === user?.id || presence[m.user.id] === 'ONLINE');
  const offlineMembers = members.filter(m => m.user.id !== user?.id && presence[m.user.id] !== 'ONLINE');

  // Fetch available users for invite
  useEffect(() => {
    if (!showInviteModal) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/community/users/search?q=${searchQuery}&excludeGroupId=${groupId}`);
        setSearchResults(res.data.data || []);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showInviteModal, groupId]);

  const handleInvite = async (userId: string) => {
    setInvitingUserId(userId);
    try {
      await api.post(`/community/groups/${groupId}/invite`, { inviteeIdentifier: userId });
      toast.success('Member invited successfully!');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      // Refresh members
      const mRes = await api.get(`/community/groups/${groupId}/members`);
      setMembers(mRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm('Are you sure you want to kick this member from the group?')) return;
    try {
      await api.post(`/community/groups/${groupId}/kick`, { memberId: userId });
      toast.success('Member removed successfully');
      setMembers(prev => prev.filter(m => m.user.id !== userId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50/50">
        <Loader2 size={40} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-120px)] mt-2 min-h-0 bg-slate-50 overflow-hidden font-sans p-4 gap-4 rounded-xl">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden z-10 relative">
        
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <button 
            onClick={() => router.push('/student/community/groups')} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="m-0 text-[17px] font-extrabold text-slate-900 tracking-tight">Group Discussion</h2>
            <div className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {onlineMembers.length} online, {members.length} total
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm m-auto max-w-sm px-4 py-8 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <Sparkles size={24} className="mx-auto mb-3 text-blue-400" />
              <p className="font-medium text-slate-600 mb-1">It's quiet in here...</p>
              <p className="text-xs">Start the conversation by sending a message below.</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender?.id === user?.id;
              return (
                <div key={msg.id} className={`flex gap-3 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}>
                  
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    <img 
                      src={msg.sender?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${msg.sender?.id || 'unknown'}&backgroundColor=e2e8f0`} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-baseline gap-2 mb-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[12px] font-bold text-slate-700">{isMe ? 'You' : `${msg.sender?.firstName || 'Unknown'} ${msg.sender?.lastName || ''}`}</span>
                      <span className="text-[10px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className={`relative px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-[20px] rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-[20px] rounded-bl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-5 pb-5 pt-2 bg-white border-t border-slate-100 relative">
          {/* Typing Indicator */}
          {typingUsers.size > 0 && (
            <div className="absolute -top-7 left-6 flex items-center gap-2 text-slate-500 text-[11px] italic font-medium">
              <div className="flex gap-1">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {Array.from(typingUsers)
                .map(id => members.find(m => m.user.id === id)?.user.firstName || 'Someone')
                .join(', ')} is typing...
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3 items-end relative max-w-4xl mx-auto">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[24px] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all flex flex-col justify-end min-h-[48px] px-4 py-1.5 shadow-sm">
              <input 
                value={newMessage} 
                onChange={handleTyping} 
                placeholder="Type a message..."
                className="w-full bg-transparent border-none outline-none text-[14px] text-slate-800 placeholder-slate-400 py-2 h-full"
                style={{ outline: 'none', boxShadow: 'none' }}
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              disabled={sending || !newMessage.trim()} 
              className="w-12 h-12 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Members */}
      <div className="w-[300px] shrink-0 flex flex-col bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
          <h3 className="m-0 text-sm font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <Users size={16} className="text-slate-400" /> Members
          </h3>
          {isOwner && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors tooltip"
              title="Invite Members"
            >
              <UserPlus size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Online Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-600/80 mb-3 flex items-center gap-2">
              Online <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px]">{onlineMembers.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {onlineMembers.map(m => (
                <div key={m.user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default group">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-slate-300 transition-colors">
                      <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.user.id}&backgroundColor=e2e8f0`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-50 rounded-full group-hover:border-white transition-colors"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate leading-tight">
                      {m.user.id === user?.id ? 'You' : `${m.user.firstName} ${m.user.lastName}`}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {m.role === 'OWNER' ? <span className="text-blue-600 font-bold">Owner</span> : 'Student'}
                    </div>
                  </div>
                  {m.user.id !== user?.id && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === m.user.id ? null : m.user.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                        title="Member Options"
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      {openMenuId === m.user.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors text-left font-medium">
                              <MessageSquare size={14} className="text-blue-500" />
                              Message
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors text-left font-medium border-b border-slate-50">
                              <UserCheck size={14} className="text-green-500" />
                              Add Friend
                            </button>
                            {isOwner && (
                              <>
                                <button 
                                  onClick={() => { handleKick(m.user.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-orange-600 hover:bg-orange-50 transition-colors text-left font-medium"
                                >
                                  <X size={14} />
                                  Kick
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left font-medium">
                                  <Ban size={14} />
                                  Ban
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Offline Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              Offline <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px]">{offlineMembers.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              {offlineMembers.map(m => (
                <div key={m.user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-default opacity-60 hover:opacity-100 group">
                  <div className="relative shrink-0 grayscale group-hover:grayscale-0 transition-all">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-200">
                      <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.user.id}&backgroundColor=e2e8f0`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-600 truncate leading-tight group-hover:text-slate-800">
                      {m.user.id === user?.id ? 'You' : `${m.user.firstName} ${m.user.lastName}`}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {m.role === 'OWNER' ? <span className="text-blue-500 font-bold">Owner</span> : 'Student'}
                    </div>
                  </div>
                  {m.user.id !== user?.id && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === m.user.id ? null : m.user.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                        title="Member Options"
                      >
                        <MoreVertical size={14} />
                      </button>
                      
                      {openMenuId === m.user.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors text-left font-medium">
                              <MessageSquare size={14} className="text-blue-500" />
                              Message
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors text-left font-medium border-b border-slate-50">
                              <UserCheck size={14} className="text-green-500" />
                              Add Friend
                            </button>
                            {isOwner && (
                              <>
                                <button 
                                  onClick={() => { handleKick(m.user.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-orange-600 hover:bg-orange-50 transition-colors text-left font-medium"
                                >
                                  <X size={14} />
                                  Kick
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left font-medium">
                                  <Ban size={14} />
                                  Ban
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" /> Invite Members
              </h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2 min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                {isSearching ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-4">
                    No matching users found.
                  </div>
                ) : (
                  searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          <img 
                            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}&backgroundColor=e2e8f0`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 leading-none">{u.firstName} {u.lastName}</div>
                          <div className="text-xs text-slate-500 mt-1">{u.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleInvite(u.id)}
                        disabled={invitingUserId === u.id}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {invitingUserId === u.id ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} 
                        Invite
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
