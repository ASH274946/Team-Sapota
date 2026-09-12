'use client';

import React, { useState, useEffect } from 'react';
import { UserPlusIcon, X, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/base-ui/avatar';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export interface FriendMember {
  id?: string;
  src?: string;
  fallback: string;
  name: string;
  mail: string;
  role?: string;
}

const DEFAULT_MEMBERS: FriendMember[] = [
  {
    src: 'https://assets.watermelon.sh/wm_alex.png',
    fallback: 'AL',
    name: 'Alex Lee',
    mail: 'alex.lee@email.com',
    role: 'Student',
  },
  {
    src: 'https://assets.watermelon.sh/wm_olivia.png',
    fallback: 'MS',
    name: 'Maria Silva',
    mail: 'maria.silva@email.com',
    role: 'Student',
  },
  {
    src: 'https://assets.watermelon.sh/wm_josh.png',
    fallback: 'JP',
    name: 'John Park',
    mail: 'john.park@email.com',
    role: 'Teacher',
  },
  {
    src: 'https://assets.watermelon.sh/wm_mia.png',
    fallback: 'SK',
    name: 'Sara Kim',
    mail: 'sara.kim@email.com',
    role: 'Student',
  },
];

interface InviteMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  triggerButton?: React.ReactNode;
}

export function InviteMembersDialog({ isOpen, onClose }: InviteMembersDialogProps) {
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [members, setMembers] = useState<FriendMember[]>(DEFAULT_MEMBERS);
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchOrgMembers() {
      try {
        const res = await api.get<{ success: boolean; data: any[] }>('/student/community/members');
        if (res.data?.data && res.data.data.length > 0) {
          const fetched: FriendMember[] = res.data.data.slice(0, 6).map((m) => ({
            id: m.id,
            src: m.avatar || m.avatarUrl || '',
            fallback: (m.firstName?.[0] || 'U') + (m.lastName?.[0] || ''),
            name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Community Member',
            mail: m.email || 'user@organization.edu',
            role: m.role || 'Member',
          }));
          setMembers(fetched);
        }
      } catch {
        // Fallback to default peer list
      }
    }
    if (isOpen) {
      fetchOrgMembers();
    }
  }, [isOpen]);

  const handleSendFormInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    toast.success(`Invite sent to ${nameInput || emailInput}!`);
    setNameInput('');
    setEmailInput('');
    onClose();
  };

  const handleInviteMember = (mail: string) => {
    setInvitedIds((prev) => ({ ...prev, [mail]: true }));
    toast.success(`Invitation sent to ${mail}!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg z-101 my-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Invite new members
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Send an invitation link to collaborate on assessments and study groups.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-3 mb-6" onSubmit={handleSendFormInvite}>
          <div className="grid gap-2.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-800 dark:focus:ring-zinc-600 transition-all"
            />
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-1">Email</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="name@email.com"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-zinc-800 dark:focus:ring-zinc-600 transition-all"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold text-sm transition-all cursor-pointer shadow-md"
          >
            Send Invite
          </button>
        </form>

        {/* Available Members Section */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Available Peers & Members
          </p>
          <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {members.map((item, index) => {
              const isInvited = !!invitedIds[item.mail];
              return (
                <li key={item.id || index} className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9">
                      <AvatarImage src={item.src} alt={item.name} />
                      <AvatarFallback className="text-xs">
                        {item.fallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </span>
                      <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.mail}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isInvited}
                    onClick={() => handleInviteMember(item.mail)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isInvited
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 cursor-default'
                        : 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isInvited ? (
                      <>
                        <Check className="size-3.5" /> Invited
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="size-3.5" /> Invite
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
