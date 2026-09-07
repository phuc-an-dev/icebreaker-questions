'use client';

import React, { useState, useEffect } from 'react';
import { FilterState, Question, QuestionTypeId } from '@/types/question';
import { QUESTION_TYPES, TAG_LABELS } from '@/data/metadata';
import { IconHelper } from '@/components/ui/IconHelper';
import { ModalShell } from '@/components/ui/ModalShell';
import { hapticFeedback } from '@/lib/haptics';
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
  User,
  Users,
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onSearchChange: (val: string) => void;
  onToggleType: (typeId: QuestionTypeId) => void;
  onToggleTag: (tag: string) => void;
  onSelectAuthor?: (authorId: string) => void;
  authorFrequencies?: Array<{ id: string; name: string; count: number }>;
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


export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onSearchChange,
  onToggleType,
  onToggleTag,
  onSelectAuthor,
  authorFrequencies = [],
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
  const [activeTab, setActiveTab] = useState<'types' | 'tags' | 'authors'>('types');

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
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500 dark:text-blue-400" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          )}
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search questions..."
            className="h-10 w-full rounded-xl border border-edge bg-surface-input pl-9 pr-8 text-sm text-content placeholder-content-muted backdrop-blur-md transition-all focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/40"
          />
          {filters.search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content"
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
              ? 'border-blue-500/60 bg-blue-500/20 text-blue-600 dark:text-blue-300 font-semibold'
              : 'border-edge bg-surface-card/80 text-content-secondary hover:border-edge-strong'
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
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-edge bg-surface-card/90 px-3 text-content backdrop-blur-md transition-all hover:bg-surface-elevated"
          title="Presentation Mode"
        >
          <Presentation className="h-4 w-4 text-blue-500 dark:text-blue-400" />
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
      <div className="flex items-center justify-between gap-2 text-xs text-content-muted">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {/* Hide asked toggle */}
          <button
            onClick={() => onToggleHideAsked(!filters.hideAsked)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
              filters.hideAsked
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-300 font-medium'
                : 'border-edge bg-surface-card/50 text-content-muted hover:border-edge-strong'
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
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-300 font-medium'
                : 'border-edge bg-surface-card/50 text-content-muted hover:border-edge-strong'
            }`}
          >
            <Bookmark className="h-3 w-3" fill={filters.onlyFavorites ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          {/* Author quick toggle */}
          {authorFrequencies.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('authors');
                setIsModalOpen(true);
                hapticFeedback.light();
              }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
                filters.author && filters.author !== 'all'
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-medium'
                  : 'border-edge bg-surface-card/50 text-content-muted hover:border-edge-strong'
              }`}
              title="Filter by Author"
            >
              <User className="h-3 w-3" />
              <span>
                {filters.author && filters.author !== 'all'
                  ? authorFrequencies.find((a) => a.id === filters.author)?.name || 'Author'
                  : 'Author'}
              </span>
              {filters.author && filters.author !== 'all' && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAuthor?.('all');
                    hapticFeedback.light();
                  }}
                  className="ml-0.5 hover:text-content"
                  title="Clear author filter"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          )}

          {/* Reset Filters chip if active */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Result Counter */}
        <span className="shrink-0 font-mono text-[11px] text-content-muted pl-1">
          <span className="font-bold text-blue-500 dark:text-blue-400">{filteredCount}</span>/{totalCount}
        </span>
      </div>

      {/* Modal / Bottom Sheet */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Filter Options"
        subtitle="Filter questions by format, thematic tags, and author"
        icon={<SlidersHorizontal className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
        maxWidth="lg"
        subHeader={
          <div className="mx-5 sm:mx-6 mt-3 flex rounded-xl bg-surface-elevated p-1 border border-edge">
            <button
              onClick={() => {
                setActiveTab('types');
                hapticFeedback.light();
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'types'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              Types ({typeFrequencies.length})
              {selectedTypesCount > 0 && ` • ${selectedTypesCount}`}
            </button>
            <button
              onClick={() => {
                setActiveTab('tags');
                hapticFeedback.light();
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'tags'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              Tags ({tagFrequencies.length})
              {selectedTagsCount > 0 && ` • ${selectedTagsCount}`}
            </button>
            {authorFrequencies.length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('authors');
                  hapticFeedback.light();
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  activeTab === 'authors'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-content-muted hover:text-content'
                }`}
              >
                Authors ({authorFrequencies.length})
                {filters.author && filters.author !== 'all' && ` • 1`}
              </button>
            )}
          </div>
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <button
              onClick={() => {
                onResetFilters();
                hapticFeedback.light();
              }}
              className="inline-flex items-center gap-1 text-xs text-content-muted hover:text-content px-3 py-2 rounded-lg hover:bg-surface-elevated transition min-h-[40px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset all</span>
            </button>

            <button
              onClick={() => {
                setIsModalOpen(false);
                hapticFeedback.light();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition min-h-[44px]"
            >
              <span>View {filteredCount} questions</span>
            </button>
          </div>
        }
        contentClassName="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar"
      >
        {activeTab === 'types' ? (
          <div className="flex flex-wrap gap-2">
            {typeFrequencies.map(({ id, meta, count }) => {
              const isSelected = filters.types.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => {
                    onToggleType(id);
                    hapticFeedback.light();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? 'border border-cyan-500/80 dark:border-cyan-400/80 bg-cyan-500/20 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-200 font-semibold'
                      : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
                  }`}
                >
                  <IconHelper name={meta.iconName} className="h-3.5 w-3.5" />
                  <span>{meta.label}</span>
                  <span className="text-[10px] text-content-muted">({count})</span>
                  {isSelected && <Check className="h-3 w-3 text-cyan-500 dark:text-cyan-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        ) : activeTab === 'tags' ? (
          <div className="flex flex-wrap gap-2">
            {tagFrequencies.map(({ tag, label, count }) => {
              const isSelected = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    onToggleTag(tag);
                    hapticFeedback.light();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? 'border border-rose-500/80 dark:border-rose-400/80 bg-rose-500/20 dark:bg-rose-400/20 text-rose-700 dark:text-rose-200 font-semibold'
                      : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[10px] text-content-muted">({count})</span>
                  {isSelected && <Check className="h-3 w-3 text-rose-500 dark:text-rose-400 ml-0.5" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                onSelectAuthor?.('all');
                hapticFeedback.light();
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                !filters.author || filters.author === 'all'
                  ? 'border border-indigo-500/80 dark:border-indigo-400/80 bg-indigo-500/20 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-200 font-semibold'
                  : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Authors</span>
              <span className="text-[10px] text-content-muted">({totalCount})</span>
              {(!filters.author || filters.author === 'all') && (
                <Check className="h-3 w-3 text-indigo-500 dark:text-indigo-400 ml-0.5" />
              )}
            </button>
            {authorFrequencies.map((a) => {
              const isSelected = filters.author === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    onSelectAuthor?.(a.id);
                    hapticFeedback.light();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? 'border border-indigo-500/80 dark:border-indigo-400/80 bg-indigo-500/20 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-200 font-semibold'
                      : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{a.name}</span>
                  <span className="text-[10px] text-content-muted">({a.count})</span>
                  {isSelected && (
                    <Check className="h-3 w-3 text-indigo-500 dark:text-indigo-400 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ModalShell>
    </div>
  );
};
