'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Terminal, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '@/components/ui/Pagination';
import { NativeSelect } from '@/components/ui/native-select';
import { motion } from 'framer-motion';

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [actions, setActions] = useState<string[]>([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/audit?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || res.data.data);
        setTotalPages(res.data.data.totalPages || 1);
        const distinct = Array.from(
          new Set((res.data.data.logs || res.data.data).map((l: AuditEntry) => l.action))
        ).filter(Boolean) as string[];
        setActions((prev) => (prev.length ? prev : distinct));
      }
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, dateFrom, dateTo, search]);

  const handleFilter = () => {
    setPage(1);
    loadLogs();
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('FAIL') || action.includes('ERR') || action.includes('DELETE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('CREATE') || action.includes('RESET')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('LOGIN') || action.includes('APPROVE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  const formatIpAddress = (ip: string) => {
    if (!ip) return '-';
    const cleanIp = ip.split(',')[0].trim();
    if (cleanIp === '::1') return '127.0.0.1';
    if (cleanIp.startsWith('::ffff:')) return cleanIp.substring(7);
    return cleanIp;
  };

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Security & Audit Trail
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Immutable platform-wide audit log for compliance, administrative actions, and IP tracking
          </p>
        </div>
      </div>

      {/* Main Grid: Log Table (Left) + Detail Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Filter + Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl border border-neutral-200/90 bg-white shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by user, operation, or IP address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs"
                />
              </div>
              <NativeSelect
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800"
              >
                <option value="">All Operations</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Date:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
              />
              <span className="text-xs text-neutral-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
              />
              <button
                onClick={handleFilter}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Terminal className="w-10 h-10 text-neutral-300 mb-2" />
                <h4 className="text-sm font-bold text-neutral-800">No Audit Events Logged</h4>
                <p className="text-xs text-neutral-400 mt-1">Adjust your filters to inspect historical logs.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Operation</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Client IP</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {logs.map((log) => {
                      const userName = log.user
                        ? `${log.user.firstName} ${log.user.lastName}`.trim()
                        : log.userEmail || log.userId || 'System Engine';
                      const isSelected = selectedLog?.id === log.id;
                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-neutral-50/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-orange-50/40' : ''
                          }`}
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="py-3 px-4 text-neutral-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900">{userName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeClass(
                                log.action
                              )}`}
                            >
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-600 font-medium">
                            <div>{log.entity || '-'}</div>
                            <div className="text-[10px] text-neutral-400">
                              {log.metadata?.name
                                ? String(log.metadata.name)
                                : log.entityId
                                ? log.entityId.substring(0, 10) + '...'
                                : '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                            {formatIpAddress(log.ipAddress)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <span className="text-xs text-neutral-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="max-w-xs">
                <Pagination totalPages={totalPages || 1} value={page} onChange={setPage} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detail Inspector Card */}
        <div className="sticky top-20">
          {!selectedLog ? (
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-xs text-center flex flex-col items-center">
              <Terminal className="w-10 h-10 text-neutral-300 mb-2" />
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Inspect Event</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                Select any log entry on the left to inspect its parameters, stack trace, and JSON metadata.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    EVENT PAYLOAD
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 mt-0.5">{selectedLog.action}</h4>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-medium">Timestamp</span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-medium">User / Actor</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedLog.user
                      ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}`
                      : selectedLog.userEmail || 'System'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-medium">Target Entity</span>
                  <span className="font-semibold text-neutral-800">{selectedLog.entity || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-50">
                  <span className="text-neutral-400 font-medium">Client IP</span>
                  <span className="font-mono text-neutral-800">{formatIpAddress(selectedLog.ipAddress)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  JSON Metadata Payload
                </span>
                <pre className="p-3 rounded-xl bg-neutral-900 text-emerald-400 text-[11px] font-mono overflow-auto max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
