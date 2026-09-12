'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
  FileCode,
  FileSpreadsheet,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AttachmentMeta {
  type?: 'file' | 'image' | string;
  name: string;
  url?: string;
  size?: number;
  mimeType?: string;
  source?: 'paste' | 'upload' | string;
  file?: File;
}

interface AttachmentsContextType {
  attachments: AttachmentMeta[];
  appendFiles: (files: File[] | FileList, options?: { paste?: boolean }) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  disabled?: boolean;
  openFilePicker: () => void;
}

const AttachmentsContext = createContext<AttachmentsContextType | null>(null);

export function useAttachments() {
  const context = useContext(AttachmentsContext);
  if (!context) {
    throw new Error('useAttachments must be used within an <Attachments /> provider');
  }
  return context;
}

export interface AttachmentsProps {
  children: React.ReactNode;
  attachments: AttachmentMeta[];
  onAttachmentsChange: (attachments: AttachmentMeta[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function Attachments({
  children,
  attachments,
  onAttachmentsChange,
  accept = '*/*',
  multiple = true,
  maxSize = 50 * 1024 * 1024,
  disabled = false,
  className = '',
}: AttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const appendFiles = useCallback(
    (files: File[] | FileList, options?: { paste?: boolean }) => {
      if (disabled) return;
      const fileList = Array.from(files);
      const newItems: AttachmentMeta[] = fileList.map((file) => {
        const isImg = file.type.startsWith('image/');
        return {
          type: isImg ? 'image' : 'file',
          name: file.name,
          url: isImg ? URL.createObjectURL(file) : undefined,
          size: file.size,
          mimeType: file.type,
          source: options?.paste ? 'paste' : 'upload',
          file,
        };
      });
      onAttachmentsChange([...attachments, ...newItems]);
    },
    [attachments, disabled, onAttachmentsChange],
  );

  const removeAttachment = useCallback(
    (index: number) => {
      const target = attachments[index];
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      onAttachmentsChange(attachments.filter((_, i) => i !== index));
    },
    [attachments, onAttachmentsChange],
  );

  const clearAttachments = useCallback(() => {
    attachments.forEach((a) => {
      if (a.url?.startsWith('blob:')) URL.revokeObjectURL(a.url);
    });
    onAttachmentsChange([]);
  }, [attachments, onAttachmentsChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !e.dataTransfer.files?.length) return;
    appendFiles(e.dataTransfer.files);
  };

  return (
    <AttachmentsContext.Provider
      value={{
        attachments,
        appendFiles,
        removeAttachment,
        clearAttachments,
        disabled,
        openFilePicker,
      }}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) {
              appendFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        {isDragging && <AttachmentsDropOverlay />}

        {children}
      </div>
    </AttachmentsContext.Provider>
  );
}

export function AttachmentsDropOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-500 bg-orange-50/90 backdrop-blur-xs text-orange-950 p-4 transition-all">
      <UploadCloud className="w-8 h-8 text-orange-600 animate-bounce" />
      <p className="text-xs sm:text-sm font-semibold">Drop files here to attach</p>
    </div>
  );
}

export function AttachmentTrigger({
  children,
  asChild = false,
  className = '',
}: {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { openFilePicker, disabled } = useAttachments();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: openFilePicker,
      disabled,
    });
  }

  return (
    <button
      type="button"
      onClick={openFilePicker}
      disabled={disabled}
      className={`p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      title="Attach files"
    >
      {children || <Paperclip className="w-4 h-4" />}
    </button>
  );
}

export function AttachmentList({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <AnimatePresence>{children}</AnimatePresence>
    </div>
  );
}

export interface AttachmentProps {
  attachment: AttachmentMeta;
  variant?: 'inline' | 'detailed' | 'pasted';
  progress?: number;
  onRemove?: () => void;
  className?: string;
}

export function Attachment({
  attachment,
  variant = 'detailed',
  progress,
  onRemove,
  className = '',
}: AttachmentProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (attachment.type === 'image' || attachment.mimeType?.startsWith('image/')) {
      return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (attachment.mimeType?.includes('pdf')) {
      return <FileText className="w-3.5 h-3.5 text-red-500" />;
    }
    if (attachment.mimeType?.includes('sheet') || attachment.name.endsWith('.xlsx') || attachment.name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (attachment.mimeType?.includes('code') || attachment.name.endsWith('.json')) {
      return <FileCode className="w-3.5 h-3.5 text-purple-500" />;
    }
    return <FileText className="w-3.5 h-3.5 text-neutral-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-2.5 py-1.5 text-xs shadow-2xs transition-all hover:border-neutral-300 ${className}`}
    >
      {/* Icon or Thumbnail */}
      {attachment.url && (attachment.type === 'image' || attachment.mimeType?.startsWith('image/')) ? (
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-5 h-5 rounded-md object-cover border border-neutral-200/60"
        />
      ) : (
        <div className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
          {getFileIcon()}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="font-medium text-neutral-800 truncate max-w-[130px] sm:max-w-[180px]">
          {attachment.name}
        </span>
        {variant !== 'inline' && (
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
            {attachment.source === 'paste' ? (
              <span className="text-orange-600 font-semibold">Pasted text</span>
            ) : (
              <span>{formatSize(attachment.size)}</span>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      {progress !== undefined && progress < 100 && (
        <div className="flex items-center gap-1 text-[10px] text-orange-600 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{progress}%</span>
        </div>
      )}

      {/* Remove Button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          title="Remove attachment"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
}
