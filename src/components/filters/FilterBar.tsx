'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { FilterState, Question, QuestionTypeId } from '@/types/question';
import { QUESTION_TYPES, TAG_LABELS } from '@/data/metadata';
import { IconHelper } from '@/components/ui/IconHelper';
import {
  Search,
  X,
  SlidersHorizontal,
  Shuffle,
  Eye,
  EyeOff,
  Bookmark,
  Presentation,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onSearchChange: (val: string) => void;
  onToggleType: (typeId: QuestionTypeId) => void;
  onToggleTag: (tag: string) => void;
  onToggleHideAsked: (val: boolean) => void;
  onToggleOnlyFavorites: (val: boolean) => void;
  onResetFilters: () => void;
  onRandomDraw: () => void;
  onOpenStage: (question?: Question) => void;
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
  allQuestions: Question[];
  isSearching?: boolean;
}

const emptySubscribe = () => () => {};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onSearchChange,
  onToggleType,
  onToggleTag,
  onToggleHideAsked,
  onToggleOnlyFavorites,
  onResetFilters,
  onRandomDraw,
  onOpenStage,
  activeFiltersCount,
  filteredCount,
  totalCount,
  allQuestions,
  isSearching = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'types' | 'tags'>('types');
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Type & Tag frequencies
  const typeFrequencies = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of allQuestions) {
      counts[q.type] = (counts[q.type] || 0) + 1;
    }
    return Object.keys(QUESTION_TYPES).map((key) => ({
      id: key as QuestionTypeId,
      meta: QUESTION_TYPES[key as QuestionTypeId],
      count: counts[key] || 0,
    }));
  }, [allQuestions]);

  const tagFrequencies = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of allQuestions) {
      for (const t of q.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map((t) => ({ tag: t, label: TAG_LABELS[t] || t, count: counts[t] }));
  }, [allQuestions]);

  const handleRandomClick = () => {
    onRandomDraw();
  };

  const selectedTypesCount = filters.types.length;
  const selectedTagsCount = filters.tags.length;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search & Actions Bar (Mobile First) */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-400" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-8 text-sm text-slate-100 placeholder-slate-500 backdrop-blur-md transition-all focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/40"
          />
          {filters.search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Button (Opens Bottom Sheet / Modal) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium backdrop-blur-md transition-all ${
            activeFiltersCount > 0
              ? 'border-blue-500/60 bg-blue-500/20 text-blue-300 font-semibold'
              : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
          }`}
          title="Filter options"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Presentation Button */}
        <button
          onClick={() => onOpenStage()}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 px-3 text-slate-200 backdrop-blur-md transition-all hover:bg-slate-800"
          title="Presentation Mode"
        >
          <Presentation className="h-4 w-4 text-blue-400" />
        </button>

        {/* Random Draw Button */}
        <button
          onClick={handleRandomClick}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25 active:scale-95 hover:brightness-110"
          title="Draw random question"
        >
          <Shuffle className="h-4 w-4" />
          <span className="hidden sm:inline">Random Draw</span>
        </button>
      </div>

      {/* Quick Status & Toggles row (Strictly single line, horizontal scroll if needed) */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {/* Hide asked toggle */}
          <button
            onClick={() => onToggleHideAsked(!filters.hideAsked)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
              filters.hideAsked
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300 font-medium'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
            }`}
          >
            {filters.hideAsked ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>Hide asked</span>
          </button>

          {/* Only favorites toggle */}
          <button
            onClick={() => onToggleOnlyFavorites(!filters.onlyFavorites)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
              filters.onlyFavorites
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300 font-medium'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Bookmark className="h-3 w-3" fill={filters.onlyFavorites ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          {/* Reset Filters chip if active */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Result Counter */}
        <span className="shrink-0 font-mono text-[11px] text-slate-400 pl-1">
          <span className="font-bold text-blue-400">{filteredCount}</span>/{totalCount}
        </span>
      </div>

      {/* Modal / Bottom Sheet rendered via React Portal directly into body to escape any backdrop-filter containing block */}
      {isMounted &&
        isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

            {/* Sheet container */}
            <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
              {/* Header (Always pinned at top of modal) */}
              <div className="shrink-0 flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Filter Options</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Segmented Tab Control */}
              <div className="shrink-0 mt-3 flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  onClick={() => setActiveTab('types')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'types'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Question Types ({typeFrequencies.length})
                  {selectedTypesCount > 0 && ` • ${selectedTypesCount}`}
                </button>
                <button
                  onClick={() => setActiveTab('tags')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'tags'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Topics / Tags ({tagFrequencies.length})
                  {selectedTagsCount > 0 && ` • ${selectedTagsCount}`}
                </button>
              </div>

              {/* Scrollable Items Container */}
              <div className="my-3 flex-1 overflow-y-auto pr-1">
                {activeTab === 'types' ? (
                  <div className="flex flex-wrap gap-2 py-1">
                    {typeFrequencies.map(({ id, meta, count }) => {
                      const isSelected = filters.types.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => onToggleType(id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                            isSelected
                              ? 'border border-cyan-400/80 bg-cyan-400/20 text-cyan-200 font-semibold'
                              : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <IconHelper name={meta.iconName} className="h-3.5 w-3.5" />
                          <span>{meta.label}</span>
                          <span className="text-[10px] text-slate-500">({count})</span>
                          {isSelected && <Check className="h-3 w-3 text-cyan-400 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 py-1">
                    {tagFrequencies.map(({ tag, label, count }) => {
                      const isSelected = filters.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => onToggleTag(tag)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                            isSelected
                              ? 'border border-rose-400/80 bg-rose-400/20 text-rose-200 font-semibold'
                              : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span>{label}</span>
                          <span className="text-[10px] text-slate-500">({count})</span>
                          {isSelected && <Check className="h-3 w-3 text-rose-400 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Actions Bar in Sheet (Always pinned at bottom of modal) */}
              <div className="shrink-0 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    onResetFilters();
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-110"
                >
                  <span>View {filteredCount} questions</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
