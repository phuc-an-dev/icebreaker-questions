'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditAction } from '@/types/admin';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';
import {
  History,
  Search,
  RefreshCw,
  PlusCircle,
  Edit3,
  Trash2,
  Layers,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface AuditLogsTabProps {
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ onToast }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
      });
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch audit logs');
      }

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      onToast('error', err instanceof Error ? err.message : 'Error fetching audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, actionFilter, onToast]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search: debouncedSearch,
        });
        if (actionFilter !== 'all') {
          params.set('action', actionFilter);
        }

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch audit logs');
        }

        if (isMounted) {
          setLogs(data.logs || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        if (isMounted) {
          onToast('error', err instanceof Error ? err.message : 'Error fetching audit logs');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [page, limit, debouncedSearch, actionFilter, onToast]);

  const actionFilterOptions: DropdownOption[] = [
    { id: 'all', label: 'All Actions' },
    { id: 'CREATE_QUESTION', label: 'Create Question' },
    { id: 'UPDATE_QUESTION', label: 'Update Question' },
    { id: 'DELETE_QUESTION', label: 'Delete Question' },
    { id: 'BULK_DELETE_QUESTIONS', label: 'Bulk Delete Questions' },
  ];

  const renderActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE_QUESTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <PlusCircle className="w-3.5 h-3.5" />
            Created
          </span>
        );
      case 'UPDATE_QUESTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Edit3 className="w-3.5 h-3.5" />
            Updated
          </span>
        );
      case 'DELETE_QUESTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold">
            <Trash2 className="w-3.5 h-3.5" />
            Deleted
          </span>
        );
      case 'BULK_DELETE_QUESTIONS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Bulk Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-500/10 text-content-muted border border-edge text-xs">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-surface-card border border-edge rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-content">Question Audit Trails</h2>
            <p className="text-xs text-content-muted">
              Immutable log of all question creations, modifications, and deletions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-content-muted font-medium">
            Total records: <strong className="text-content">{total}</strong>
          </span>
          <button
            onClick={() => {
              hapticFeedback.light();
              fetchLogs();
            }}
            disabled={isLoading}
            className="p-2.5 bg-surface-input border border-edge rounded-xl text-content-muted hover:text-content hover:bg-surface-hover transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, email, or question content..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-edge rounded-xl text-sm text-content placeholder-content-muted focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div>
          <SearchableDropdown
            label=""
            options={actionFilterOptions}
            value={actionFilter}
            onChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
            placeholder="Filter by action"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-card border border-edge rounded-2xl overflow-hidden shadow-sm">
        {isLoading && logs.length === 0 ? (
          <div className="p-12 text-center text-content-muted flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-content-muted text-xs">
            No audit logs found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-input/50 text-content-muted border-b border-edge font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target ID</th>
                  <th className="py-3.5 px-4">Details / Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge text-content">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-hover/50 transition">
                    <td className="py-4 px-4 whitespace-nowrap text-content-muted">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-content-muted flex-shrink-0" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-surface-input border border-edge flex items-center justify-center text-[10px] font-bold text-content-muted">
                          {log.actorName ? log.actorName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-semibold text-content">{log.actorName}</div>
                          <div className="text-[11px] text-content-muted">{log.actorEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {log.targetId !== undefined && log.targetId !== null ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-surface-input border border-edge rounded-md text-[11px] font-mono font-medium text-content">
                          <Hash className="w-3 h-3 text-content-muted" />
                          {Array.isArray(log.targetId) ? `${log.targetId.length} items` : log.targetId}
                        </span>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>

                    <td className="py-4 px-4 max-w-md">
                      <p className="text-xs text-content line-clamp-2" title={log.targetText}>
                        {log.targetText || <span className="text-content-muted italic">No text recorded</span>}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-edge flex items-center justify-between gap-4 text-xs">
            <div className="text-content-muted">
              Page {page} of {totalPages} ({total} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  hapticFeedback.light();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="p-2 bg-surface-input border border-edge rounded-xl text-content-muted hover:text-content hover:bg-surface-hover disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-surface-input border border-edge rounded-xl font-medium">
                {page}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => {
                  hapticFeedback.light();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className="p-2 bg-surface-input border border-edge rounded-xl text-content-muted hover:text-content hover:bg-surface-hover disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
