'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (newSize: number) => void;
  itemName?: string;
  className?: string;
  showRowsPerPage?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  itemName = 'items',
  className = '',
  showRowsPerPage = true,
}) => {
  if (totalPages <= 0 && (!totalItems || totalItems <= 0)) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  // Calculate items range (e.g. 1 - 20)
  const fromIndex =
    totalItems !== undefined && pageSize !== undefined && totalItems > 0
      ? (safePage - 1) * pageSize + 1
      : undefined;
  const toIndex =
    totalItems !== undefined && pageSize !== undefined && totalItems > 0
      ? Math.min(totalItems, safePage * pageSize)
      : undefined;

  const handlePageClick = (p: number) => {
    if (p < 1 || p > safeTotalPages || p === safePage) return;
    hapticFeedback.light();
    onPageChange(p);
  };

  // Generate desktop page numbers
  const getVisiblePages = (): (number | '...')[] => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (safePage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages];
    }
    if (safePage >= safeTotalPages - 3) {
      return [
        1,
        '...',
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', safeTotalPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`p-3 sm:p-3.5 bg-surface-card border border-edge rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* ── Left / Top Row: Range summary + Rows-per-page ── */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto text-xs text-content-muted">
        {totalItems !== undefined && fromIndex !== undefined && toIndex !== undefined ? (
          <span className="truncate">
            Showing <strong className="text-content font-mono font-medium">{fromIndex}–{toIndex}</strong> of{' '}
            <strong className="text-content font-mono font-medium">{totalItems}</strong> {itemName}
          </span>
        ) : (
          <span>
            Total: <strong className="text-content font-mono font-medium">{totalItems ?? safeTotalPages}</strong> {itemName}
          </span>
        )}

        {/* Rows per page selector (compact pill) */}
        {showRowsPerPage && pageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-content-muted hidden xs:inline">Rows:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-surface-elevated/70 border border-edge">
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (size !== pageSize) {
                      hapticFeedback.light();
                      onPageSizeChange(size);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium transition ${
                    pageSize === size
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-content-muted hover:text-content'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Navigation Bar (< sm) ── */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full pt-2.5 border-t border-edge/60">
        {/* Prev Page Button */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage - 1)}
          disabled={safePage <= 1}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-surface-elevated hover:bg-surface-elevated/80 disabled:opacity-35 disabled:cursor-not-allowed border border-edge rounded-xl text-xs font-semibold text-content transition min-h-[40px] active:scale-[0.98]"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        {/* Current Page / Total Pages Badge */}
        <div className="px-3.5 py-2 bg-surface-input border border-edge-strong rounded-xl text-xs font-mono font-semibold text-content text-center min-h-[40px] flex items-center justify-center shrink-0">
          <span>{safePage}</span>
          <span className="text-content-muted mx-1">/</span>
          <span className="text-content-muted">{safeTotalPages}</span>
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-surface-elevated hover:bg-surface-elevated/80 disabled:opacity-35 disabled:cursor-not-allowed border border-edge rounded-xl text-xs font-semibold text-content transition min-h-[40px] active:scale-[0.98]"
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Desktop Navigation Controls (>= sm) ── */}
      <div className="hidden sm:flex items-center justify-end gap-1.5 shrink-0">
        {/* First Page (if > 7 pages) */}
        {safeTotalPages > 7 && (
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            disabled={safePage <= 1}
            className="p-2 rounded-xl border border-edge bg-surface-card hover:bg-surface-elevated text-content-muted hover:text-content disabled:opacity-35 disabled:cursor-not-allowed transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage - 1)}
          disabled={safePage <= 1}
          className="p-2 rounded-xl border border-edge bg-surface-card hover:bg-surface-elevated text-content-muted hover:text-content disabled:opacity-35 disabled:cursor-not-allowed transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Number Pills */}
        <div className="flex items-center gap-1">
          {visiblePages.map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 text-center text-xs text-content-muted font-mono"
                >
                  …
                </span>
              );
            }

            const isCurrent = item === safePage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => handlePageClick(item)}
                className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-mono font-medium transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'bg-surface-card border border-edge text-content-secondary hover:text-content hover:bg-surface-elevated'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageClick(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          className="p-2 rounded-xl border border-edge bg-surface-card hover:bg-surface-elevated text-content-muted hover:text-content disabled:opacity-35 disabled:cursor-not-allowed transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page (if > 7 pages) */}
        {safeTotalPages > 7 && (
          <button
            type="button"
            onClick={() => handlePageClick(safeTotalPages)}
            disabled={safePage >= safeTotalPages}
            className="p-2 rounded-xl border border-edge bg-surface-card hover:bg-surface-elevated text-content-muted hover:text-content disabled:opacity-35 disabled:cursor-not-allowed transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
};
