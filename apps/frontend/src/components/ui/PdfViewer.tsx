'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Printer,
} from 'lucide-react';

export interface PdfViewerProps {
  file: string; // URL or blob URL
  title?: string;
  buttonText?: string;
  buttonClassName?: string;
  initialPage?: number;
  initialScale?: number;
  asButtonOnly?: boolean;
}

export function PdfViewer({
  file,
  title = 'Document Viewer',
  buttonText = 'View PDF',
  buttonClassName = '',
  initialScale = 1.0,
  asButtonOnly = true,
}: PdfViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file) return;
    const a = document.createElement('a');
    a.href = file;
    a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = file;
    document.body.appendChild(iframe);
    iframe.contentWindow?.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-[#e05934] border border-orange-200 px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all hover:scale-102 active:scale-97 cursor-pointer ${buttonClassName}`}
      >
        <FileText className="w-4 h-4 text-[#e05934]" />
        <span>{buttonText}</span>
      </button>

      <AnimatePresence>
        {isOpen && file && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Navigation & Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-white select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-[#e05934] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-md">
                    {title}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <span className="text-[11px] font-mono text-neutral-400 px-1">
                    {Math.round(scale * 100)}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-neutral-800 mx-1" />

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Print PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(file, '_blank')}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-neutral-800 mx-1" />

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PDF Canvas / Embed Container */}
              <div className="flex-1 w-full bg-neutral-950/90 overflow-auto p-4 flex items-center justify-center">
                <div
                  className="transition-transform duration-150 origin-top flex items-center justify-center w-full h-full"
                  style={{ transform: `scale(${scale})` }}
                >
                  <iframe
                    src={`${file}#toolbar=0&navpanes=0`}
                    title={title}
                    className="w-full h-full rounded-xl bg-white shadow-2xl border border-neutral-800"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PdfViewer;
