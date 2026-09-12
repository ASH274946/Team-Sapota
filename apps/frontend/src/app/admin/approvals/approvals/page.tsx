'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Eye,
  Download,
  FileText,
  Zap,
  History,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  Check,
  X,
  BookOpen,
  User,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { Pagination } from '@/components/ui/Pagination';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/base-ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── Interfaces ──
interface PaperQuestion {
  question: string;
  marks: number;
  type: string;
  difficulty?: string;
  options?: string[];
  answer?: { text?: string; explanation?: string } | string;
  hint?: string;
  bloomLevel?: string;
}

interface PaperSection {
  title: string;
  instructions?: string;
  questions: PaperQuestion[];
}

interface GeneratedPaper {
  id: string;
  title: string;
  totalMarks?: number;
  duration?: number;
  status?: string;
  pdfUrl?: string;
  sections: PaperSection[];
  createdAt: string;
}

interface PendingApproval {
  id: string;
  title: string;
  subject: string;
  description?: string;
  duration?: number;
  totalMarks?: number;
  typeBreakdown: string | null;
  status: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  reviewComments?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: { firstName: string; lastName: string };
  rejectedBy?: { firstName: string; lastName: string };
  _count?: { generatedPapers: number };
  generatedPapers?: GeneratedPaper[];
}

// ── Mini Sparkline Bars ──
function MetricBars({
  values,
  color = '#0284c7',
}: {
  values: number[];
  color?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 w-12 shrink-0 items-end justify-between gap-1">
      {values.map((val, idx) => (
        <span
          key={idx}
          className="w-1.5 rounded-t-xs transition-all duration-300"
          style={{
            height: `${Math.max((val / max) * 100, 15)}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

// ── Metric Card Component ──
function MetricCard({
  title,
  value,
  trend,
  trendType = 'neutral',
  icon: Icon,
  bars,
  color = '#0284c7',
}: {
  title: string;
  value: string | number;
  trend: string;
  trendType?: 'positive' | 'warning' | 'danger' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  bars: number[];
  color?: string;
}) {
  return (
    <div className="flex h-34 flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {title}
        </h3>
        <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
          <Icon className="size-4" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tracking-tight text-neutral-900">
            {value}
          </p>
          <p
            className={cn(
              'mt-1 text-xs font-semibold flex items-center gap-1',
              trendType === 'positive' && 'text-emerald-600',
              trendType === 'warning' && 'text-amber-600',
              trendType === 'danger' && 'text-red-600',
              trendType === 'neutral' && 'text-neutral-500'
            )}
          >
            {trendType === 'positive' && <TrendingUp className="size-3.5" />}
            {trendType === 'warning' && <Clock className="size-3.5" />}
            {trendType === 'danger' && <AlertCircle className="size-3.5" />}
            <span>{trend}</span>
          </p>
        </div>

        <MetricBars values={bars} color={color} />
      </div>
    </div>
  );
}

export default function ApprovalsOverview() {
  const { user } = useAuthStore();
  const { activeOrganizationId } = useAdminAuthStore();

  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PUBLISHED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<PendingApproval | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleViewPdf = async (assignmentId: string) => {
    try {
      setPdfLoading(true);
      toast.loading('Preparing question paper PDF...', { id: 'pdf-toast' });
      const res = await api.get(`/papers/${assignmentId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      toast.success('PDF opened in new tab!', { id: 'pdf-toast' });
      window.open(blobUrl, '_blank');
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      toast.error('Failed to load PDF. Please try again.', { id: 'pdf-toast' });
    } finally {
      setPdfLoading(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const queryParams = activeOrganizationId ? `?organizationId=${activeOrganizationId}` : '';
      const res = await api.get(`/admin/approvals${queryParams}`);
      if (res.data?.success) {
        setApprovals(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      user &&
      (activeOrganizationId ||
        user?.role === 'ADMIN' ||
        user?.role === 'SUPER_ADMIN' ||
        user?.role === 'ORG_ADMIN')
    ) {
      fetchApprovals();
    }
  }, [activeOrganizationId, user]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.post(`/admin/approvals/${id}/approve`);
      toast.success('Assessment approved & published successfully');
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'PUBLISHED', approvedAt: new Date().toISOString() }
            : a
        )
      );
      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: 'PUBLISHED' } : null));
      }
    } catch (err) {
      toast.error('Failed to approve assessment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await api.post(`/admin/approvals/${id}/reject`, {
        reviewComments: 'Changes requested by administrator',
      });
      toast.success('Assessment returned for revision');
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'REJECTED', rejectedAt: new Date().toISOString() }
            : a
        )
      );
      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
      }
    } catch (err) {
      toast.error('Failed to reject assessment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    const pendingItems = approvals.filter(
      (a) => a.status === 'PENDING_APPROVAL' || a.status === 'COMPLETED'
    );
    if (pendingItems.length === 0) {
      toast('No pending assessments in queue');
      return;
    }

    try {
      setActionLoading('BULK');
      for (const item of pendingItems) {
        await api.post(`/admin/approvals/${item.id}/approve`);
      }
      toast.success(`Successfully approved ${pendingItems.length} assessments`);
      fetchApprovals();
    } catch (err) {
      toast.error('Bulk approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Real Counts from Database
  const pendingCount = approvals.filter(
    (a) => a.status === 'PENDING_APPROVAL' || a.status === 'COMPLETED'
  ).length;
  const approvedCount = approvals.filter((a) => a.status === 'PUBLISHED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;
  const totalCount = approvals.length;

  // Filtered List
  const filteredApprovals = approvals.filter((item) => {
    const isPending = item.status === 'PENDING_APPROVAL' || item.status === 'COMPLETED';
    if (activeTab === 'PENDING' && !isPending) return false;
    if (activeTab === 'PUBLISHED' && item.status !== 'PUBLISHED') return false;
    if (activeTab === 'REJECTED' && item.status !== 'REJECTED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSubject = item.subject?.toLowerCase().includes(q);
      const matchAuthor = `${item.createdBy?.firstName || ''} ${item.createdBy?.lastName || ''}`
        .toLowerCase()
        .includes(q);
      return matchTitle || matchSubject || matchAuthor;
    }
    return true;
  });

  const paginatedApprovals = filteredApprovals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    if (status === 'PUBLISHED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="size-3" />
          Approved
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
          <XCircle className="size-3" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock className="size-3" />
        Pending Review
      </span>
    );
  };

  // Recent Activity Feed
  const recentHistory = approvals
    .filter((a) => a.status === 'PUBLISHED' || a.status === 'REJECTED')
    .sort((a, b) => {
      const dateA = a.approvedAt || a.rejectedAt || a.createdAt;
      const dateB = b.approvedAt || b.rejectedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* ── 1. Header & Navigation Breadcrumb ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span>Admin Portal</span>
            <span>›</span>
            <span className="text-neutral-900 font-semibold">Approvals & Verification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
            Approvals Queue
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Review and verify assessment publications, curriculum updates, and institutional submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="h-9.5 rounded-xl px-3.5 text-xs font-semibold border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-xs"
            onClick={() => window.print()}
          >
            <Download className="size-3.5 mr-1.5 text-neutral-500" />
            Export Log
          </Button>

          <Button
            type="button"
            onClick={handleBulkApprove}
            disabled={actionLoading === 'BULK' || pendingCount === 0}
            className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs disabled:opacity-50"
          >
            {actionLoading === 'BULK' ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="size-3.5 mr-1.5 fill-current" />
            )}
            Bulk Approve ({pendingCount})
          </Button>
        </div>
      </div>

      {/* ── 2. Top 4 Metric Cards (Matching Medesk Layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Queue"
          value={pendingCount}
          trend={pendingCount > 0 ? `${pendingCount} requires review` : 'All clear'}
          trendType={pendingCount > 0 ? 'warning' : 'positive'}
          icon={Clock}
          bars={[
            Math.max(1, pendingCount - 3),
            Math.max(1, pendingCount - 2),
            Math.max(1, pendingCount - 1),
            pendingCount,
            pendingCount,
            Math.max(1, pendingCount),
          ]}
          color="#f59e0b"
        />

        <MetricCard
          title="Approved & Published"
          value={approvedCount}
          trend={approvedCount > 0 ? `${approvedCount} live papers` : '0 published'}
          trendType={approvedCount > 0 ? 'positive' : 'neutral'}
          icon={CheckCircle2}
          bars={[
            Math.max(1, approvedCount - 4),
            Math.max(1, approvedCount - 2),
            approvedCount,
            approvedCount,
            approvedCount,
            Math.max(1, approvedCount),
          ]}
          color="#10b981"
        />

        <MetricCard
          title="Rejections & Revisions"
          value={rejectedCount}
          trend={rejectedCount > 0 ? `${rejectedCount} returned` : '0 returned'}
          trendType={rejectedCount > 0 ? 'danger' : 'neutral'}
          icon={XCircle}
          bars={[
            Math.max(1, rejectedCount - 1),
            rejectedCount,
            rejectedCount,
            rejectedCount,
            rejectedCount,
            Math.max(1, rejectedCount),
          ]}
          color="#ef4444"
        />

        <MetricCard
          title="Total Processed"
          value={totalCount}
          trend={`${totalCount} submissions in record`}
          trendType="neutral"
          icon={FileText}
          bars={[
            Math.max(1, totalCount - 5),
            Math.max(1, totalCount - 3),
            Math.max(1, totalCount - 1),
            totalCount,
            totalCount,
            Math.max(1, totalCount),
          ]}
          color="#0284c7"
        />
      </div>

      {/* ── 3. Main Approvals Table Card ── */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-0 shadow-xs overflow-hidden min-h-[660px] flex flex-col justify-between">
        {/* Table Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-neutral-100 shrink-0">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('PENDING'); setCurrentPage(1); }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'PENDING'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('PUBLISHED'); setCurrentPage(1); }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'PUBLISHED'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Approved ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('REJECTED'); setCurrentPage(1); }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                activeTab === 'REJECTED'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assessment or faculty..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-xs font-medium text-neutral-800 placeholder-neutral-400 shadow-2xs focus:border-neutral-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20 min-h-[500px]">
            <div className="flex flex-col items-center gap-2.5">
              <Loader2 size={32} className="animate-spin text-neutral-800" />
              <span className="text-neutral-500 text-xs font-medium">Loading approval records...</span>
            </div>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 px-6 text-center min-h-[500px]">
            <div className="size-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="size-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">All caught up!</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              There are no {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} approvals in the queue right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 flex flex-col justify-between min-h-[520px]">
            <table className="w-full min-w-[700px] table-fixed text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 h-10">
                  <th className="w-[34%] px-5 py-2.5">Assessment / Topic</th>
                  <th className="w-[24%] px-4 py-2.5">Requester</th>
                  <th className="w-[18%] px-4 py-2.5">Submitted Date</th>
                  <th className="w-[12%] px-4 py-2.5">Status</th>
                  <th className="w-[12%] px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedApprovals.map((item) => {
                  const author = item.createdBy
                    ? `${item.createdBy.firstName} ${item.createdBy.lastName || ''}`.trim()
                    : 'Faculty Member';
                  const initials = author.slice(0, 2).toUpperCase();
                  const isPending =
                    item.status === 'PENDING_APPROVAL' || item.status === 'COMPLETED';

                  const dateObj = new Date(item.createdAt);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? 'Recent'
                    : format(dateObj, 'MMM dd, yyyy');
                  const formattedTime = isNaN(dateObj.getTime())
                    ? ''
                    : format(dateObj, 'hh:mm a');

                  return (
                    <tr
                      key={item.id}
                      className="h-[60px] transition-colors hover:bg-neutral-50/70 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Item info */}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                              Subject: {item.subject || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Requester */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="size-7 rounded-lg border border-neutral-200 shadow-2xs">
                            <AvatarFallback className="text-[10px] font-bold bg-neutral-100 text-neutral-700">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-800 truncate">{author}</p>
                            <p className="text-[10px] text-neutral-400 truncate">
                              {item.createdBy?.email || 'Teacher'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-medium text-neutral-800">{formattedDate}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{formattedTime}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-5 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="size-8 rounded-lg p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="size-4" />
                          </button>

                          {isPending && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={actionLoading === item.id}
                                onClick={() => handleApprove(item.id)}
                                className="h-7.5 px-3 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white"
                              >
                                {actionLoading === item.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actionLoading === item.id}
                                onClick={() => handleReject(item.id)}
                                className="h-7.5 px-2.5 rounded-lg text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Spacer to keep pagination pinned to bottom when fewer rows */}
            <div className="flex-1 min-h-0" />

            {/* Pagination Footer - always rendered when items exist so height is 100% static */}
            <div className="mt-auto px-5 py-3 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3 bg-white h-13 shrink-0">
              <p className="text-xs text-neutral-500 font-medium">
                Showing {Math.min(itemsPerPage, filteredApprovals.length - (currentPage - 1) * itemsPerPage)} of {filteredApprovals.length} requests
              </p>
              <div className="max-w-[280px]">
                <Pagination
                  totalPages={totalPages || 1}
                  value={currentPage}
                  onChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Bottom Grid: Smart Assistant & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Smart Approval Assistant (AI Model) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Smart Approval Assistant (AI Model)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
              Vidya AI automated verification scans syllabus alignment, marks distribution, and grading criteria across all pending assessments.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Queue Health Status
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500')} />
                  <span className="text-sm font-bold text-neutral-900">
                    {pendingCount > 0 ? `${pendingCount} Items Awaiting Review` : 'All Queue Clear'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Total Approved Papers
                </p>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-bold text-neutral-900">{approvedCount} Published</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
            <Button
              type="button"
              onClick={handleBulkApprove}
              disabled={actionLoading === 'BULK' || pendingCount === 0}
              className="h-9.5 rounded-xl px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              <Zap className="size-3.5 mr-1.5 fill-current" />
              Bulk Approve Verified Items
            </Button>
          </div>
        </div>

        {/* Right: Recent Audit Trail / History */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Recent Audit Trail
              </h2>
              <History className="size-4 text-neutral-400" />
            </div>
            <p className="text-xs text-neutral-500 mb-5">
              Live audit record of approved and rejected assessments.
            </p>

            <div className="space-y-4">
              {recentHistory.length > 0 ? (
                recentHistory.map((item) => {
                  const isRejected = item.status === 'REJECTED';
                  const timestamp = item.approvedAt || item.rejectedAt || item.createdAt;
                  const dateObj = new Date(timestamp);
                  const formatted = isNaN(dateObj.getTime())
                    ? 'Recent'
                    : format(dateObj, 'MMM dd, hh:mm a');

                  return (
                    <div key={item.id} className="flex items-start gap-3 text-xs">
                      <div
                        className={cn(
                          'size-2 rounded-full mt-1.5 shrink-0',
                          isRejected ? 'bg-red-500' : 'bg-emerald-500'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-neutral-900 font-semibold truncate">
                          {isRejected ? 'Rejected' : 'Approved'}: {item.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{formatted}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No recent audit records found.
                </div>
              )}
            </div>
          </div>

          <Link href="/admin/analytics" className="w-full mt-6">
            <Button
              variant="outline"
              className="w-full h-9.5 text-xs font-semibold rounded-xl border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800"
            >
              View System Analytics
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 5. Slide-Out Details Sheet / Drawer ── */}
      <Sheet
        open={selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full max-w-full sm:max-w-[520px] bg-white p-0 border-l border-neutral-200 shadow-2xl z-50 overflow-hidden flex flex-col"
        >
          {selectedItem && (
            <div className="flex h-full flex-col">
              {/* Header */}
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 px-6">
                <SheetTitle className="text-base font-bold text-neutral-900">
                  Assessment Verification Details
                </SheetTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="size-8 rounded-full p-0 text-neutral-500 hover:text-neutral-900"
                >
                  <X className="size-4" />
                </Button>
              </header>

              {/* Body */}
              <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6">
                <SheetDescription className="sr-only">
                  Details of assessment {selectedItem.title}
                </SheetDescription>

                {/* Top Info Banner */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Subject: {selectedItem.subject || 'General'}
                    </span>
                    {getStatusBadge(selectedItem.status)}
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {selectedItem.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      {selectedItem.createdBy
                        ? `${selectedItem.createdBy.firstName} ${selectedItem.createdBy.lastName || ''}`.trim()
                        : 'Faculty Member'}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(selectedItem.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                {/* Assessment Config Specs */}
                {(() => {
                  const paper = selectedItem.generatedPapers?.[0];
                  const marks = paper?.totalMarks ?? selectedItem.totalMarks;
                  const duration = paper?.duration ?? selectedItem.duration;
                  const allQ = (paper?.sections ?? []).flatMap((s: PaperSection) => s.questions);
                  const totalQ = allQ.length;
                  const typeMap: Record<string, number> = {};
                  allQ.forEach((q: PaperQuestion) => { typeMap[q.type] = (typeMap[q.type] ?? 0) + 1; });
                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Assessment Parameters</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                          <p className="text-[11px] text-neutral-500 font-medium">Total Marks</p>
                          <p className="text-base font-bold text-neutral-900 mt-1">{marks ?? '—'} Marks</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                          <p className="text-[11px] text-neutral-500 font-medium">Duration</p>
                          <p className="text-base font-bold text-neutral-900 mt-1">{duration ?? '—'} Min</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                          <p className="text-[11px] text-neutral-500 font-medium">Total Questions</p>
                          <p className="text-base font-bold text-neutral-900 mt-1">{totalQ}</p>
                        </div>
                        <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-100">
                          <p className="text-[11px] text-neutral-500 font-medium">Sections</p>
                          <p className="text-base font-bold text-neutral-900 mt-1">{paper?.sections?.length ?? 0}</p>
                        </div>
                      </div>
                      {Object.keys(typeMap).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(typeMap).map(([type, count]) => (
                            <span key={type} className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                              {type.replace(/_/g, ' ')}: {count}Q
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Description */}
                {selectedItem.description && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Description &amp; Syllabus Topics</h4>
                    <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-100 text-xs text-neutral-700 leading-relaxed max-h-32 overflow-y-auto">
                      {selectedItem.description}
                    </div>
                  </div>
                )}

                {/* ── Structured Question Preview ── */}
                {(() => {
                  const paper = selectedItem.generatedPapers?.[0];
                  if (!paper || !paper.sections?.length) {
                    return (
                      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-center">
                        <BookOpen className="size-5 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-neutral-500">Question paper not yet generated for this assessment.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Question Paper Preview</h4>
                        <button
                          type="button"
                          disabled={pdfLoading}
                          onClick={() => handleViewPdf(selectedItem.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-neutral-900 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {pdfLoading ? (
                            <Loader2 className="size-3 animate-spin text-neutral-500" />
                          ) : (
                            <ExternalLink className="size-3 text-neutral-500" />
                          )}
                          <span>PDF</span>
                        </button>
                      </div>

                      {paper.sections.map((section: PaperSection, si: number) => (
                        <div key={si} className="rounded-xl border border-neutral-200 overflow-hidden">
                          <div className="flex items-center justify-between bg-neutral-900 px-4 py-2.5">
                            <span className="text-xs font-bold text-white tracking-wide">
                              {section.title || `Section ${si + 1}`}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-400">
                              {section.questions?.length ?? 0} Questions
                            </span>
                          </div>
                          {section.instructions && (
                            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-[10px] text-amber-800 font-medium leading-relaxed">
                              {section.instructions}
                            </div>
                          )}
                          <div className="divide-y divide-neutral-100">
                            {(section.questions ?? []).map((q: PaperQuestion, qi: number) => {
                              const ansText = typeof q.answer === 'string'
                                ? q.answer
                                : (q.answer as any)?.text || (q.answer as any)?.answer || (q.answer as any)?.value || '';

                              return (
                                <div key={qi} className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-xs font-semibold text-neutral-800 leading-snug flex-1">
                                      <span className="font-bold text-neutral-400 mr-1">Q{qi + 1}.</span>
                                      {q.question}
                                    </p>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">{q.marks}M</span>
                                      {q.difficulty && (
                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                          String(q.difficulty).toUpperCase() === 'HARD' ? 'bg-red-50 text-red-600'
                                          : String(q.difficulty).toUpperCase() === 'MEDIUM' ? 'bg-amber-50 text-amber-600'
                                          : 'bg-emerald-50 text-emerald-600'}`}>
                                          {String(q.difficulty)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 gap-1 pl-5">
                                      {q.options.map((opt: any, oi: number) => {
                                        const optStr = typeof opt === 'string'
                                          ? opt
                                          : (opt?.text || opt?.value || opt?.label || (typeof opt === 'object' ? JSON.stringify(opt) : String(opt || '')));
                                        const letter = opt?.key || opt?.label || String.fromCharCode(65 + oi);
                                        const isCorrect = Boolean(
                                          opt?.isCorrect === true ||
                                          (ansText && (
                                            String(ansText).trim().toLowerCase() === String(optStr).trim().toLowerCase() ||
                                            String(ansText).trim().toLowerCase() === String(letter).trim().toLowerCase()
                                          ))
                                        );
                                        return (
                                          <div key={oi} className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${isCorrect ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200' : 'bg-neutral-50 text-neutral-700 border border-neutral-100'}`}>
                                            <span className="font-bold shrink-0">{letter}.</span>
                                            <span>{optStr}</span>
                                            {isCorrect && <CheckCircle2 className="size-3 text-emerald-600 mt-0.5 shrink-0 ml-auto" />}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {!q.options?.length && ansText && (
                                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 pl-5">
                                      <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Answer</p>
                                      <p className="text-[11px] text-emerald-800 leading-snug">{String(ansText)}</p>
                                    </div>
                                  )}
                                  {q.hint && (
                                    <p className="pl-5 text-[10px] text-neutral-400 italic">Hint: {String(q.hint)}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Footer Actions */}
              <footer className="border-t border-neutral-100 p-4 bg-neutral-50/50 flex gap-2.5">
                {(selectedItem.status === 'PENDING_APPROVAL' || selectedItem.status === 'COMPLETED') ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoading === selectedItem.id}
                      onClick={() => handleReject(selectedItem.id)}
                      className="flex-1 h-10 rounded-xl text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reject / Request Revision
                    </Button>
                    <Button
                      type="button"
                      disabled={actionLoading === selectedItem.id}
                      onClick={() => handleApprove(selectedItem.id)}
                      className="flex-1 h-10 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white"
                    >
                      {actionLoading === selectedItem.id ? (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Check className="size-4 mr-1.5" />
                      )}
                      Approve & Publish
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedItem(null)}
                    className="w-full h-10 rounded-xl text-xs font-semibold border-neutral-200 bg-white text-neutral-800"
                  >
                    Close
                  </Button>
                )}
              </footer>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
