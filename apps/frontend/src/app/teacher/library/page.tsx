'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
} from 'lucide-react';
import { ResourceTable } from '@/components/library/ResourceTable';
import { UploadModal } from '@/components/library/UploadModal';
import { LibraryResource, LibraryService } from '@/services/library.service';
import toast from 'react-hot-toast';
import { NativeSelect } from '@/components/ui/native-select';

const SUBJECTS = ['All', 'Math', 'Science', 'English', 'History', 'Computer Science', 'Art', 'General'];
const RESOURCE_TYPES = ['All', 'Document', 'PDF', 'Video', 'Presentation', 'Image', 'Archive', 'Assignment', 'Other'];

export default function TeacherLibraryPage() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [resourceType, setResourceType] = useState('All');

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await LibraryService.getResources({
        subject: subject !== 'All' ? subject : undefined,
        resourceType: resourceType !== 'All' ? resourceType : undefined,
        search: search.trim() || undefined,
      });
      setResources(data);
    } catch {
      toast.error('Failed to load library resources');
    } finally {
      setLoading(false);
    }
  }, [subject, resourceType, search]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleEdit = (resource: LibraryResource) => {
    toast.success(`Resource editor opened for: ${resource.title}`);
  };

  const resourceCount = resources.length;
  const docCount = resources.filter((r) => r.resourceType === 'Document' || r.resourceType === 'PDF').length;
  const videoCount = resources.filter((r) => r.resourceType === 'Video').length;
  const assignmentCount = resources.filter((r) => r.resourceType === 'Assignment').length;

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Digital Resource Library
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Upload, organize, and distribute instructional media, textbooks, and classroom materials
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-neutral-400 uppercase">TOTAL ITEMS</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-2">{resourceCount}</div>
          <span className="text-xs text-neutral-500 font-medium mt-1">All indexed files</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">DOCUMENTS & PDFS</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">{docCount}</div>
          <span className="text-xs text-neutral-500 font-medium mt-1">Course guides & notes</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-purple-600 uppercase">VIDEOS & RECORDINGS</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">{videoCount}</div>
          <span className="text-xs text-neutral-500 font-medium mt-1">Classroom lecture captures</span>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#e05934] uppercase">ASSIGNMENTS</span>
          <div className="text-2xl font-extrabold text-[#e05934] mt-2">{assignmentCount}</div>
          <span className="text-xs text-neutral-500 font-medium mt-1">Worksheets & problem sets</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources by title, keyword, or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <NativeSelect
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-200/90 rounded-xl text-neutral-700"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Subjects' : s}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-200/90 rounded-xl text-neutral-700"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Formats' : t}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Main Resource Table Card */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <ResourceTable
            resources={resources}
            onEdit={handleEdit}
            onRefresh={fetchResources}
          />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchResources}
      />
    </div>
  );
}
