'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Bookmark,
  RotateCcw,
} from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { hapticFeedback } from '@/lib/haptics';

interface StatsBarProps {
  totalCount: number;
  askedCount: number;
  favoriteCount: number;
  onResetAsked: () => void;
  compact?: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalCount,
  askedCount,
  favoriteCount,
  onResetAsked,
  compact = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const animatedTotal = useCountUp(totalCount, 800);
  const animatedAsked = useCountUp(askedCount, 600);
  const animatedFavorite = useCountUp(favoriteCount, 600);

  const percentage = totalCount > 0 ? Math.round((askedCount / totalCount) * 100) : 0;

  const handleConfirmReset = () => {
    hapticFeedback.success();
    onResetAsked();
    setShowConfirm(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-edge bg-surface-card/90 px-3 py-2 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all text-xs">
        {/* Total */}
        <div className="flex items-center gap-1.5" title="Total Questions">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400">
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono font-bold text-content">{animatedTotal}</span>
        </div>

        <div className="h-4 w-px bg-edge" />

        {/* Asked */}
        <div className="flex items-center gap-1.5" title="Asked Questions">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">
            {animatedAsked}
            <span className="text-[10px] text-content-muted font-normal ml-0.5">({percentage}%)</span>
          </span>
        </div>

        <div className="h-4 w-px bg-edge" />

        {/* Favorites */}
        <div className="flex items-center gap-1.5" title="Favorite Questions">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400">
            <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
          </div>
          <span className="font-mono font-bold text-rose-500 dark:text-rose-400">{animatedFavorite}</span>
        </div>

        {/* Reset asked button */}
        {askedCount > 0 && (
          <>
            <div className="h-4 w-px bg-edge" />
            {!showConfirm ? (
              <button
                onClick={() => {
                  hapticFeedback.warning();
                  setShowConfirm(true);
                }}
                title="Reset asked questions"
                className="text-content-muted hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-500/10"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  onClick={handleConfirmReset}
                  className="rounded bg-rose-500 px-1.5 py-0.5 font-semibold text-white hover:bg-rose-600"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-content-muted hover:text-content"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-edge bg-surface-card/60 p-3 sm:p-4 backdrop-blur-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* 3 Stats items (3-column on mobile) */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
          {/* Total Questions */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-content-muted truncate">
                Total
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-content leading-tight">
                {animatedTotal}
              </p>
            </div>
          </div>

          {/* Asked */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-content-muted truncate">
                Asked
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-emerald-500 dark:text-emerald-400 leading-tight">
                {animatedAsked} <span className="text-[10px] text-content-muted">({percentage}%)</span>
              </p>
            </div>
          </div>

          {/* Favorites */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-content-muted truncate">
                Favorites
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-rose-500 dark:text-rose-400 leading-tight">
                {animatedFavorite}
              </p>
            </div>
          </div>
        </div>

        {/* Reset asked button */}
        {askedCount > 0 && (
          <div className="flex justify-end border-t border-edge pt-2 sm:border-0 sm:pt-0">
            {!showConfirm ? (
              <button
                onClick={() => {
                  hapticFeedback.warning();
                  setShowConfirm(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-black/5 dark:bg-white/5 px-2.5 py-1 text-[11px] font-medium text-content-muted transition-colors hover:bg-black/10 dark:hover:bg-white/10 hover:text-content"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset {askedCount} asked questions</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 text-[11px]">
                <span className="text-rose-600 dark:text-rose-300">Confirm reset?</span>
                <button
                  onClick={handleConfirmReset}
                  className="rounded bg-rose-500 px-2 py-0.5 font-semibold text-white hover:bg-rose-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    hapticFeedback.light();
                    setShowConfirm(false);
                  }}
                  className="text-content-muted hover:text-content"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mini Progress Bar */}
      <div className="mt-2.5 w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-400 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
