'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import {
  Megaphone,
  Clock,
  Send,
  Edit2,
  Trash2,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NativeSelect } from '@/components/ui/native-select';

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: string;
  date: string;
}

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('All Enrolled Students');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/teacher/announcements');
        if (res.data?.success) {
          setAnnouncements(res.data.data);
        }
      } catch {
        toast.error('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`/teacher/announcements/${editingId}`, { title, message, audience });
        if (res.data?.success) {
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === editingId ? { ...a, title, message, audience } : a))
          );
          setEditingId(null);
          setTitle('');
          setMessage('');
          toast.success('Announcement updated successfully!');
        }
      } else {
        const res = await api.post('/teacher/announcements', { title, message, audience });
        if (res.data?.success) {
          const newAnnouncement: Announcement = {
            id: res.data.data.id,
            title: res.data.data.title || title,
            message: res.data.data.content || message,
            audience,
            date: res.data.data.createdAt || new Date().toISOString(),
          };
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
          setTitle('');
          setMessage('');
          toast.success('Announcement published successfully!');
        }
      }
    } catch {
      toast.error(editingId ? 'Failed to update announcement' : 'Failed to publish announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setMessage(item.message);
    setAudience(item.audience);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await api.delete(`/teacher/announcements/${id}`);
      if (res.data?.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        if (editingId === id) {
          setEditingId(null);
          setTitle('');
          setMessage('');
        }
        toast.success('Announcement removed');
      }
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Class Announcements & Broadcasts
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Publish notices, urgent alerts, and exam notifications directly to student feeds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-[#e05934] text-xs font-bold border border-orange-100 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>{announcements.length} Live Broadcasts</span>
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout: Composer + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Announcement Composer */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handlePublish}
            className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col gap-4 sticky top-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#e05934]" />
                <span>{editingId ? 'Edit Announcement' : 'Compose Broadcast'}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setMessage('');
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Headline Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mid-Term Assessment Schedule Announced"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Target Audience
                </label>
                <NativeSelect
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] focus:bg-white"
                >
                  <option value="All Enrolled Students">All Enrolled Students</option>
                  <option value="Computer Science Section A">Computer Science Section A</option>
                  <option value="Computer Science Section B">Computer Science Section B</option>
                  <option value="Faculty & Mentors">Faculty & Mentors</option>
                </NativeSelect>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Notice Details
                </label>
                <textarea
                  placeholder="Write message content, instructions, links, or deadlines..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publishing...' : editingId ? 'Update Broadcast' : 'Publish Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* Right Col: Broadcast Feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Broadcast Feed</h3>
            <span className="text-xs text-neutral-400 font-medium">Sorted by latest publication</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex flex-col items-center">
              <Megaphone className="w-10 h-10 text-neutral-300 mb-2" />
              <h4 className="text-sm font-bold text-neutral-800">No Announcements Published</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                Use the composer on the left to post updates and news to your students.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#e05934] border border-orange-100">
                          {item.audience}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-neutral-900">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                        title="Edit Announcement"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
