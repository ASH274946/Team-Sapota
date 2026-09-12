'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  ChevronDown,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Download,
  FileText,
  Trash2
} from 'lucide-react';
import { useAssignments } from '@/hooks/useAssignments';
import { deleteAssignment as deleteAssignmentRequest } from '@/services/assignment.service';
import { api } from '@/lib/api';
import type { Assignment } from '@/types/assignment.types';

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const config: Record<string, { cls: string; label: string }> = {
    draft:               { cls: 'badge-draft',      label: 'Draft' },
    queued:              { cls: 'badge-queued',     label: 'Queued' },
    generating:          { cls: 'badge-generating', label: 'Generating' },
    completed:           { cls: 'badge-completed',  label: 'Completed' },
    failed:              { cls: 'badge-failed',     label: 'Failed' },
    partially_generated: { cls: 'badge-warning',    label: 'Partially Generated' },
  };
  const { cls, label } = config[status] ?? config.draft;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function CardMenu({
  assignment,
  onView,
  onDelete,
  onDownload,
  isDeleting,
  isDownloading,
}: {
  assignment: Assignment;
  onView: (assignmentId: string, status?: Assignment['status']) => void;
  onDelete: (assignmentId: string) => Promise<void>;
  onDownload: (assignmentId: string) => Promise<void>;
  isDeleting: boolean;
  isDownloading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const showPdf = assignment.status === 'COMPLETED' || assignment.status === 'PARTIALLY_GENERATED';

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className="menu-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="Card options"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onView(assignment.id, assignment.status); }}>
              <Eye size={14} /> View Paper
            </button>
            {showPdf && (
              <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); void onDownload(assignment.id); }} disabled={isDownloading}>
                <Download size={14} /> {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
            )}
            <div className="dropdown-divider" />
            <button
              type="button"
              className="dropdown-item danger"
              onClick={async (e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); await onDelete(assignment.id); }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssignmentCard({
  assignment,
  index,
  onView,
  onDelete,
  onDownload,
  isDeleting,
  isDownloading,
}: {
  assignment: Assignment;
  index: number;
  onView: (assignmentId: string, status?: Assignment['status']) => void;
  onDelete: (assignmentId: string) => Promise<void>;
  onDownload: (assignmentId: string) => Promise<void>;
  isDeleting: boolean;
  isDownloading: boolean;
}) {
  const isLive = assignment.status === 'GENERATING' || assignment.status === 'QUEUED';
  const assignedDate = format(new Date(assignment.createdAt), 'dd-MM-yyyy');
  const dueDate = format(new Date(assignment.dueDate), 'dd-MM-yyyy');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      className="assignment-card assignment-card-v3"
    >
      {isLive && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)', boxShadow: '0 0 15px 2px rgba(234, 88, 12, 0.4)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', pointerEvents: 'none', zIndex: -1 }} aria-hidden="true" />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="card-title assignment-card-title-v3">{assignment.title}</h3>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={assignment.status} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {assignment.subject}
            </span>
          </div>
        </div>
        <CardMenu assignment={assignment} onView={onView} onDelete={onDelete} onDownload={onDownload} isDeleting={isDeleting} isDownloading={isDownloading} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '12px', color: '#111827', gap: 8, flexWrap: 'wrap' }}>
        <span><strong>Assigned on : </strong><span style={{ color: '#6B7280', fontWeight: 500 }}>{assignedDate}</span></span>
        <span><strong>Due : </strong><span style={{ color: '#6B7280', fontWeight: 500 }}>{dueDate}</span></span>
      </div>

      {isLive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 600 }}>
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          Generating paper...
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="assignment-card" style={{ animation: 'none' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 20, width: '65%', borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 100 }} />
        </div>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }} />
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function EmptyState({ isFiltered, assignmentsCount }: { isFiltered: boolean; assignmentsCount: number }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <Image src="/empty-state.png" alt="" fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: 'contain' }} />
      </div>
      <h2 className="empty-title">
        {isFiltered && assignmentsCount > 0 ? 'No matching assessments' : 'No assessments yet'}
      </h2>
      <p className="empty-desc">
        {isFiltered && assignmentsCount > 0
          ? 'Try adjusting your search or filter criteria.'
          : 'Create your first assignment to start collecting and grading student submissions.'}
      </p>
      {!(isFiltered && assignmentsCount > 0) && (
        <div className="empty-state-actions">
          <Link href="/generate" className="btn btn-dark btn-pill">
            <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>+</span>
            Create Your First Assessment
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PapersPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const filterRef = useRef<HTMLDivElement>(null);
  const effectiveStatus = statusFilter === 'All' ? undefined : statusFilter;
  const { assignments, isLoading, error, phase, reload } = useAssignments(1, effectiveStatus);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (error) toast.error(error, { id: 'papers-error', position: 'bottom-center' });
  }, [error]);

  const handleView = (assignmentId: string, status?: Assignment['status']) => {
    const resolved =
      status ?? assignments.find((a) => a.id === assignmentId)?.status;
    // Always navigate directly to paper page for completed/partial status
    // For draft/generating, show the detail page with generation progress
    if (resolved === 'COMPLETED' || resolved === 'PARTIALLY_GENERATED') {
      router.push(`/assignments/${assignmentId}/paper`);
    } else {
      // For non-completed statuses, still go to detail page to show generation progress
      router.push(`/assignments/${assignmentId}`);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment? This action cannot be undone.')) return;
    try {
      setDeletingId(assignmentId);
      await deleteAssignmentRequest(assignmentId);
      toast.success('Assignment deleted');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (assignmentId: string) => {
    setDownloadingId(assignmentId);
    try {
      const res = await api.get(`/papers/${assignmentId}/pdf`, { responseType: 'blob' });
      if (!res.data) throw new Error('PDF not available');
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paper-${assignmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF not yet available. Generate the paper first.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = assignments.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isFiltered = Boolean(search || statusFilter !== 'All');

  return (
    <div className="dashboard-view">
      <div className="desktop-page-header dashboard-header-v3">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={24} color="var(--brand)" />
              <h1 className="page-title">Paper Management</h1>
            </div>
            <p className="page-subtitle" style={{ marginTop: '4px', marginLeft: '32px' }}>Assemble, review, and export full assessment question papers.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: 8, padding: 2, marginRight: 8 }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ border: 'none', background: viewMode === 'grid' ? '#fff' : 'transparent', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: viewMode === 'grid' ? '#111827' : '#6b7280' }}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{ border: 'none', background: viewMode === 'table' ? '#fff' : 'transparent', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: viewMode === 'table' ? '#111827' : '#6b7280' }}
                aria-label="Table view"
              >
                <ListIcon size={16} />
              </button>
            </div>
            <Link href="/assignments/create" className="btn btn-dark btn-pill" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Create Paper
            </Link>
          </div>
        </div>
      </div>

      <div className="mobile-page-header">
        <button onClick={() => window.history.back()} aria-label="Go back" className="topbar-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="mobile-header-title">Paper Mgmt</h1>
        <div style={{ width: 32 }} />
      </div>

      <div className="search-filter-row search-filter-row-v3">
        <div className="filter-select-wrap modern-filter" ref={filterRef}>
          <button
            type="button"
            className={`modern-filter-trigger${filterOpen ? ' open' : ''}`}
            onClick={() => setFilterOpen((s) => !s)}
            aria-label="Filter assignments by status"
            aria-expanded={filterOpen}
          >
            <Filter size={14} className="filter-icon" aria-hidden="true" />
            <span>{statusFilter === 'All' ? 'All' : statusFilter.replace('_', ' ')}</span>
            <ChevronDown size={14} className={`filter-chevron${filterOpen ? ' open' : ''}`} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="modern-filter-menu"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
              >
                {['All', 'draft', 'queued', 'generating', 'completed', 'partially_generated', 'failed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`modern-filter-item${statusFilter === status ? ' active' : ''}`}
                    onClick={() => {
                      setStatusFilter(status);
                      setFilterOpen(false);
                    }}
                  >
                    {status === 'All' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="search-wrap">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input type="text" placeholder="Search Assessment" value={search} onChange={(e) => setSearch(e.target.value)} className="input search-input" aria-label="Search assessments" />
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === 'grid' ? "assignment-grid assignment-grid-v3" : "card"}>
          {viewMode === 'grid' ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 20, color: 'var(--text-muted)' }}>
              <Loader2 size={18} className="animate-spin" /> Loading papers...
            </div>
          )}
        </div>
      ) : phase === 'error' && error ? (
        <div className="empty-state">
          <div className="empty-illustration" aria-hidden="true">
            <Image src="/empty-state.png" alt="" fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: 'contain' }} />
          </div>
          <h2 className="empty-title">Failed to load assignments</h2>
          <p className="empty-desc">Could not connect to server. {error}</p>
          <div className="empty-state-actions">
            <button type="button" onClick={() => void reload()} className="btn btn-dark btn-pill">
              <RefreshCw size={14} />
              Retry loading
            </button>
          </div>
        </div>
      ) : assignments.length === 0 || filtered.length === 0 ? (
        <EmptyState isFiltered={isFiltered} assignmentsCount={assignments.length} />
      ) : viewMode === 'grid' ? (
        <AnimatePresence mode="popLayout">
          <div className="assignment-grid assignment-grid-v3">
            {filtered.map((assignment, i) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                index={i}
                onView={handleView}
                onDelete={handleDelete}
                onDownload={handleDownload}
                isDeleting={deletingId === assignment.id}
                isDownloading={downloadingId === assignment.id}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Subject</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const showPdf = p.status === 'COMPLETED' || p.status === 'PARTIALLY_GENERATED';
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', fontSize: 14, transition: 'background 0.1s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.subject}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ gap: 4 }}
                            onClick={() => handleView(p.id, p.status)}
                            aria-label="View paper"
                          >
                            <Eye size={14} /> View
                          </button>
                          {showPdf && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ gap: 4 }}
                              onClick={() => void handleDownload(p.id)}
                              disabled={downloadingId === p.id}
                              aria-label="Download PDF"
                            >
                              {downloadingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                              PDF
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm danger"
                            style={{ border: 'none', background: 'transparent', gap: 4 }}
                            onClick={() => void handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            aria-label="Delete paper"
                          >
                            {deletingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}