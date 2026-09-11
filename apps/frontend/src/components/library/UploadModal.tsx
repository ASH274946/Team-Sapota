'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { LibraryService } from '@/services/library.service';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RESOURCE_TYPES = ['Document', 'PDF', 'Video', 'Presentation', 'Image', 'Archive', 'Other'];
const SUBJECTS = ['Math', 'Science', 'English', 'History', 'Computer Science', 'Art', 'General'];
const CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'General'];

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('PDF');
  const [subject, setSubject] = useState('General');
  const [className, setClassName] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const updateFileState = (newFile: File) => {
    setFile(newFile);
    if (!title) {
      // Auto-fill title from filename without extension
      setTitle(newFile.name.replace(/\.[^/.]+$/, ''));
    }

    // Auto-detect resource type
    const extension = newFile.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = newFile.type.toLowerCase();

    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      setResourceType('Video');
    } else if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      setResourceType('Image');
    } else if (mimeType === 'application/pdf' || extension === 'pdf') {
      setResourceType('PDF');
    } else if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) {
      setResourceType('Presentation');
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || ['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
      setResourceType('Archive');
    } else if (['doc', 'docx', 'txt', 'rtf', 'csv', 'xlsx', 'xls'].includes(extension) || mimeType.includes('word') || mimeType.includes('text/') || mimeType.includes('sheet')) {
      setResourceType('Document');
    } else {
      setResourceType('Other');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateFileState(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      updateFileState(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please select a file and enter a title');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('resourceType', resourceType);
      formData.append('subject', subject);
      formData.append('className', className);

      await LibraryService.uploadResource(formData);
      onSuccess();
      onClose();
      // Reset
      setFile(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200/80 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">Upload Resource</h2>
            <p className="text-xs text-neutral-500 font-medium">Add learning materials, documents, or presentations to your library</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-white">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="upload-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Drag & Drop Upload Zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer',
                file
                  ? 'border-orange-500/50 bg-orange-500/5'
                  : 'border-neutral-300 hover:border-orange-400 hover:bg-neutral-50'
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shadow-xs">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-neutral-900">{file.name}</p>
                    <p className="text-xs font-medium text-neutral-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-1 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="size-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                    <UploadCloud className="size-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Click to upload or drag and drop</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">PDF, DOCX, PPTX, MP4, Images or standard files (max 50MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  placeholder="E.g., Chapter 4 Physics Notes & Formulas"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Resource Type</label>
                <select
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  {RESOURCE_TYPES.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  {SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Class / Group</label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all cursor-pointer"
                >
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  placeholder="Briefly describe what this resource is about..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* High-Contrast Visible Footer Buttons */}
        <div className="px-6 py-4 border-t border-neutral-200/90 bg-neutral-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="upload-form"
            disabled={loading || !file || !title.trim()}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload Resource</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
