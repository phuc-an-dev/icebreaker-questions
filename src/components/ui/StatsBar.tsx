'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Bookmark,
  RotateCcw,
} from 'lucide-react';

interface StatsBarProps {
  totalCount: number;
  askedCount: number;
  favoriteCount: number;
  onResetAsked: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  totalCount,
  askedCount,
  favoriteCount,
  onResetAsked,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const percentage = totalCount > 0 ? Math.round((askedCount / totalCount) * 100) : 0;

  const handleConfirmReset = () => {
    onResetAsked();
    setShowConfirm(false);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* 3 Stats items (3-column on mobile) */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
          {/* Total Questions */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate">
                Total
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-white leading-tight">
                {totalCount}
              </p>
            </div>
          </div>

          {/* Asked */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate">
                Asked
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-emerald-400 leading-tight">
                {askedCount} <span className="text-[10px] text-slate-500">({percentage}%)</span>
              </p>
            </div>
          </div>

          {/* Favorites */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-white/[0.02] p-2 sm:p-0 sm:bg-transparent">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
              <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate">
                Favorites
              </p>
              <p className="font-mono text-sm sm:text-base font-bold text-rose-400 leading-tight">
                {favoriteCount}
              </p>
            </div>
          </div>
        </div>

        {/* Reset asked button */}
        {askedCount > 0 && (
          <div className="flex justify-end border-t border-slate-800/60 pt-2 sm:border-0 sm:pt-0">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset {askedCount} asked questions</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 px-2.5 py-1 text-[11px]">
                <span className="text-rose-300">Confirm reset?</span>
                <button
                  onClick={handleConfirmReset}
                  className="rounded bg-rose-500 px-2 py-0.5 font-semibold text-white hover:bg-rose-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
