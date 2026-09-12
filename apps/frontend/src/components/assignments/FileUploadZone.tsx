'use client';

import React, { useState, useCallback } from 'react';
import { X, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';

export function FileUploadZone({
  files,
  onAdd,
  onRemove,
  onRename,
}: {
  files: File[];
  onAdd: (f: File[]) => void;
  onRemove: (i: number) => void;
  onRename: (i: number, newName: string) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type === 'application/pdf' ||
          f.type === 'text/plain' ||
          f.type.startsWith('image/')
      );
      onAdd(dropped);
    },
    [onAdd]
  );

  const uploadArea = (
    <div style={{ flex: files.length > 0 ? '1' : 'none' }}>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            style={{ margin: '0 auto 12px' }}
            aria-hidden="true"
          >
            <circle cx="22" cy="22" r="22" fill="#F3F4F6" />
            <path
              d="M22 26V18M22 18L19 21M22 18L25 21"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 30h14"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="upload-zone-title">Choose a file or drag &amp; drop it here</p>
          <p className="upload-zone-sub" style={{ marginBottom: 12 }}>
            JPEG, PNG, upto 10MB
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '7px 20px',
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Browse Files
          </span>
          <input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,application/pdf,text/plain"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files) onAdd(Array.from(e.target.files)); }}
            aria-label="Upload material files"
          />
        </label>
      </div>

      {files.length === 0 && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Upload images of your preferred document/image
        </p>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      {files.length > 0 ? (
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
          {/* Left: Upload Area */}
          {uploadArea}
          
          {/* Right: Uploaded Files */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Uploaded Documents</h3>
            {files.map((file, i) => {
              let Icon = FileIcon;
              let iconColor = '#6B7280';
              if (file.type.startsWith('image/')) {
                Icon = ImageIcon;
                iconColor = '#3B82F6';
              } else if (file.name.endsWith('.pdf')) {
                Icon = FileText;
                iconColor = '#EF4444';
              } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
                Icon = FileText;
                iconColor = '#3B82F6';
              }

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    value={file.name}
                    onChange={(e) => onRename(i, e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: '1px solid transparent',
                      background: 'transparent',
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      outline: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 4px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid var(--border-focus)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid transparent';
                      e.target.style.background = 'transparent';
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        uploadArea
      )}
    </div>
  );
}
