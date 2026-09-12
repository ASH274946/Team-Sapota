'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/api.client';
import {
  MessageSquare,
  Heart,
  Plus,
  Users,
  Award,
  Megaphone,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NewPostModal } from '@/components/community/NewPostModal';
import { LoadingState } from '@/design-system/LoadingState';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title?: string;
  content: string;
  type: string;
  author: { id: string; firstName: string; lastName: string; role: string; avatar?: string };
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  imageUrl?: string;
  attachments?: any[];
}

interface TopUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  subject: string;
  karma: number;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  type: string;
}

// ── SVG Micro Bar Chart ──
function MetricBars({ values, color = '#e05934' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 w-12 shrink-0 items-end justify-between gap-1">
      {values.map((v, i) => {
        const height = max > 0 && v > 0 ? Math.max(15, Math.round((v / max) * 100)) : 10;
        return (
          <span
            key={i}
            style={{ height: `${height}%`, backgroundColor: color }}
            className="w-1.5 rounded-t-xs transition-all duration-300 opacity-80 hover:opacity-100"
          />
        );
      })}
    </div>
  );
}

export default function CommunityDashboard() {
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [discussions, setDiscussions] = useState<Post[]>([]);
  const [topContributors, setTopContributors] = useState<TopUser[]>([]);
  const [studyGroups, setStudyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [feedRes, topUsersRes, groupsRes] = await Promise.all([
        apiClient.get<{ status: string; data: Post[] }>('/community/posts/feed?limit=20'),
        apiClient.get<{ status: string; data: TopUser[] }>('/community/users/top'),
        apiClient.get<{ status: string; data: Group[] }>('/community/groups'),
      ]);

      const allPosts = feedRes.data.data || [];
      setAnnouncements(allPosts.filter((p) => p.type === 'ANNOUNCEMENT').slice(0, 3));
      setDiscussions(allPosts.filter((p) => p.type === 'DISCUSSION').slice(0, 10));

      setTopContributors(topUsersRes.data.data || []);
      setStudyGroups(groupsRes.data.data ? groupsRes.data.data.slice(0, 3) : []);
    } catch (err) {
      console.error('Error fetching community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingState lines={8} />;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto text-slate-900 font-sans">
      <NewPostModal
        isOpen={isNewPostModalOpen}
        onClose={() => setIsNewPostModalOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {/* ── 1. Header Section ── */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Student Community & Discussions
          </h1>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <span>Exchange research notes, ask peer questions, and join study groups with course mates</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/student/community/discussions?filter=mine')}
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            My Threads
          </Button>
          <Button
            type="button"
            onClick={() => setIsNewPostModalOpen(true)}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-[#e05934] hover:bg-[#c94a2a] text-white shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            Start Discussion
          </Button>
        </div>
      </section>

      {/* ── 2. Top Stats Grid (4 Cards matching Admin Layout) ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Active Threads */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active Discussions
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <MessageSquare className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {discussions.length}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 flex items-center gap-1">
                {discussions.length > 0 ? (
                  <>
                    <TrendingUp className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Active campus topics</span>
                  </>
                ) : (
                  <span>No discussions yet</span>
                )}
              </p>
            </div>
            <MetricBars values={discussions.length > 0 ? [discussions.length, discussions.length, discussions.length, discussions.length] : [0, 0, 0, 0]} color="#e05934" />
          </div>
        </article>

        {/* Card 2: Study Groups */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Study Groups
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Users className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {studyGroups.length} {studyGroups.length === 1 ? 'Group' : 'Groups'}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {studyGroups.length > 0 ? 'Active peer circles' : 'Create or join groups'}
              </p>
            </div>
            <MetricBars values={studyGroups.length > 0 ? [studyGroups.length, studyGroups.length, studyGroups.length, studyGroups.length] : [0, 0, 0, 0]} color="#3b82f6" />
          </div>
        </article>

        {/* Card 3: Top Contributors */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Peer Contributors
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Award className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">
                {topContributors.length}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {topContributors.length > 0 ? 'Verified peer tutors' : 'Leaderboard loading'}
              </p>
            </div>
            <MetricBars values={topContributors.length > 0 ? [topContributors.length, topContributors.length, topContributors.length, topContributors.length] : [0, 0, 0, 0]} color="#8b5cf6" />
          </div>
        </article>

        {/* Card 4: Community Karma */}
        <article className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Forum Status
            </h2>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <Sparkles className="size-4" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-neutral-900">Active</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                Peer network online
              </p>
            </div>
            <MetricBars values={[1, 1, 1, 1]} color="#f59e0b" />
          </div>
        </article>
      </section>

      {/* ── 3. Main Discussions Feed & Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discussions & Announcements (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements Banner */}
          {announcements.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900">Faculty & Department Notices</h3>
              </div>

              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {ann.title || 'Official Announcement'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-800 mt-2 font-medium leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion Posts */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Recent Discussion Threads</h2>
                <p className="text-xs text-neutral-500">Live questions and study group questions</p>
              </div>
              <button
                onClick={() => setIsNewPostModalOpen(true)}
                className="text-xs font-bold text-[#e05934] hover:underline"
              >
                + New Thread
              </button>
            </div>

            <div className="space-y-4">
              {discussions.length > 0 ? (
                discussions.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl border border-neutral-100 hover:border-neutral-200 bg-neutral-50/40 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center font-bold text-neutral-600 text-xs">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.author.firstName?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">
                          {post.author.firstName} {post.author.lastName}
                        </h4>
                        <span className="text-[11px] text-neutral-400">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 mb-1">
                      {post.title || post.content.split('\n')[0]}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed mb-4">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                      <button className="flex items-center gap-1.5 hover:text-neutral-900 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.commentsCount} replies</span>
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-rose-600 font-semibold">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{post.likesCount} likes</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-700">No discussions posted yet</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Start the conversation with your peers.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Top Contributors & Groups */}
        <div className="space-y-6">
          {/* Top Contributors */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
              Top Peer Contributors
            </h3>
            <div className="space-y-3">
              {topContributors && topContributors.length > 0 ? (
                topContributors.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center text-xs font-bold text-neutral-700">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                        ) : (
                          user.firstName?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-neutral-900 block">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-[10px] text-neutral-400">{user.subject || 'Student'}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-[#e05934]">
                      {user.karma} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-neutral-400">
                  No rankings calculated yet.
                </div>
              )}
            </div>
          </div>

          {/* Study Groups */}
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">
              Active Study Groups
            </h3>
            <div className="space-y-3">
              {studyGroups && studyGroups.length > 0 ? (
                studyGroups.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                    <h4 className="text-xs font-bold text-neutral-900">{g.name}</h4>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500">
                      <span>{g.memberCount} Members</span>
                      <span className="font-bold text-[#e05934]">{g.type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-neutral-400">
                  No active study groups found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
