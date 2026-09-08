'use client';

import React, { useMemo } from 'react';
import { CategoryId, Question, QuestionTypeId, CategoryMeta, TypeMeta } from '@/types/question';
import { CATEGORIES, QUESTION_TYPES, TAG_LABELS } from '@/data/metadata';
import { IconHelper } from '@/components/ui/IconHelper';
import { hapticFeedback } from '@/lib/haptics';
import {
  Layers,
  User,
  Users,
  LayoutGrid,
  Tags,
  Check,
  RotateCcw,
} from 'lucide-react';

interface InlineFiltersProps {
  // Category
  selectedCategories: CategoryId[];
  onToggleCategory: (cat: CategoryId) => void;
  onClearCategories: () => void;
  categories?: CategoryMeta[];

  // Author
  selectedAuthor?: string;
  onSelectAuthor: (authorId?: string) => void;
  authorFrequencies: Array<{ id: string; name: string; count: number }>;

  // Type
  selectedTypes: QuestionTypeId[];
  onToggleType: (typeId: QuestionTypeId) => void;
  onClearTypes: () => void;
  types?: TypeMeta[];

  // Tag
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;

  // Questions and Global State
  questions: Question[];
  onResetAll: () => void;
  activeFiltersCount: number;
}

export const InlineFilters: React.FC<InlineFiltersProps> = ({
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  categories = [],
  selectedAuthor,
  onSelectAuthor,
  authorFrequencies,
  selectedTypes,
  onToggleType,
  onClearTypes,
  types = [],
  selectedTags,
  onToggleTag,
  onClearTags,
  questions,
  onResetAll,
  activeFiltersCount,
}) => {
  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of questions) {
      map[q.category] = (map[q.category] || 0) + 1;
    }
    return map;
  }, [questions]);

  // Merge categories from props, fallback to default CATEGORIES, and ensure any category present in questions is included!
  const categoryList: CategoryMeta[] = useMemo(() => {
    const map = new Map<string, CategoryMeta>();

    // 1. Static defaults
    for (const c of Object.values(CATEGORIES)) {
      map.set(c.id, c);
    }

    // 2. Dynamic categories from database (props)
    if (categories && categories.length > 0) {
      for (const c of categories) {
        map.set(c.id, c);
      }
    }

    // 3. Any category that exists on questions in current dataset
    for (const q of questions) {
      if (q.category && !map.has(q.category)) {
        const found = categories?.find(
          (c) => c.id.toLowerCase() === q.category.toLowerCase()
        );
        const resolvedLabel =
          found?.label ||
          q.category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

        map.set(q.category, {
          id: q.category,
          label: resolvedLabel,
          description: found?.description || '',
          color: found?.color || '#3b82f6',
          gradient: found?.gradient || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          glowColor: found?.glowColor || 'rgba(59, 130, 246, 0.4)',
          borderGlow: found?.borderGlow || 'rgba(59, 130, 246, 0.6)',
          iconName: found?.iconName || 'Users',
        });
      }
    }

    // Filter out categories with 0 questions IF they are temporary/unused, but keep those that have questions or are core defaults
    return Array.from(map.values()).filter((c) => {
      const count = categoryCounts[c.id] || 0;
      if (count > 0) return true;
      return Boolean(CATEGORIES[c.id as CategoryId]);
    });
  }, [categories, questions, categoryCounts]);

  // Calculate type frequencies (only include types with count > 0)
  const typeFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      counts[q.type] = (counts[q.type] || 0) + 1;
    }
    const typeMetaMap = new Map<string, TypeMeta>();
    for (const t of Object.values(QUESTION_TYPES)) {
      typeMetaMap.set(t.id, t);
    }
    if (types && types.length > 0) {
      for (const t of types) {
        typeMetaMap.set(t.id, t);
      }
    }
    for (const q of questions) {
      if (q.type && !typeMetaMap.has(q.type)) {
        const found = types?.find(
          (t) => t.id.toLowerCase() === q.type.toLowerCase()
        );
        const resolvedLabel =
          found?.label ||
          q.type.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());

        typeMetaMap.set(q.type, {
          id: q.type,
          label: resolvedLabel,
          hint: found?.hint || '',
          iconName: found?.iconName || 'HelpCircle',
        });
      }
    }
    return Array.from(typeMetaMap.values())
      .map((t) => ({
        id: t.id as QuestionTypeId,
        meta: t,
        count: counts[t.id] || 0,
      }))
      .filter((item) => item.count > 0);
  }, [questions, types]);

  // Calculate tag frequencies sorted descending
  const tagFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      for (const t of q.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .map((t) => ({ tag: t, label: TAG_LABELS[t] || t, count: counts[t] }));
  }, [questions]);

  const isAllCategories = selectedCategories.length === 0;
  const isAllTypes = selectedTypes.length === 0;
  const isAllTags = selectedTags.length === 0;
  const isAllAuthors = !selectedAuthor || selectedAuthor === 'all';

  return (
    <section className="mb-6 rounded-2xl border border-edge bg-surface-card/60 p-3 sm:p-4.5 backdrop-blur-xl space-y-3.5 shadow-sm transition-all">
      {/* Active filters global bar if any active */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between pb-2.5 border-b border-edge">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-content">Active Filters:</span>
            <span className="flex h-5 items-center justify-center rounded-full bg-blue-500/20 px-2 text-[11px] font-bold text-blue-600 dark:text-blue-300">
              {activeFiltersCount} applied
            </span>
          </div>
          <button
            onClick={() => {
              onResetAll();
              hapticFeedback.light();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset all filters</span>
          </button>
        </div>
      )}

      {/* Row 1: Categories & Authors (Side-by-side on desktop!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Categories Section */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-content-muted">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              <span>Categories</span>
              {selectedCategories.length > 0 && (
                <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                  {selectedCategories.length}
                </span>
              )}
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => {
                  onClearCategories();
                  hapticFeedback.light();
                }}
                className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Categories Chips Track */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap">
            {/* All Categories Chip */}
            <button
              onClick={() => {
                onClearCategories();
                hapticFeedback.light();
              }}
              className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                isAllCategories
                  ? 'border border-blue-500/80 bg-blue-500/20 text-blue-700 dark:text-white shadow-sm ring-1 ring-blue-400/40'
                  : 'border border-edge bg-surface-card/70 text-content-muted hover:border-edge-strong hover:text-content'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                  isAllCategories
                    ? 'bg-blue-500/20 dark:bg-white/20 text-blue-700 dark:text-white'
                    : 'bg-surface-elevated text-content-muted'
                }`}
              >
                {questions.length}
              </span>
            </button>

            {/* Individual Category Chips */}
            {categoryList.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onToggleCategory(cat.id);
                    hapticFeedback.light();
                  }}
                  className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                    isSelected
                      ? 'shadow-md ring-1'
                      : 'border border-edge bg-surface-card/60 text-content-secondary hover:border-edge-strong hover:bg-surface-elevated/80 hover:text-content'
                  }`}
                  style={{
                    borderColor: isSelected ? cat.color : undefined,
                    backgroundColor: isSelected ? `${cat.color}22` : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                    boxShadow: isSelected ? `0 0 12px ${cat.color}33` : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125 shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <IconHelper
                    name={cat.iconName}
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: isSelected ? cat.color : 'inherit' }}
                  />
                  <span className="whitespace-nowrap">{cat.label}</span>
                  <span
                    className="rounded-md px-1.5 py-0.2 text-[10px] font-semibold"
                    style={{
                      backgroundColor: isSelected ? `${cat.color}33` : undefined,
                      color: isSelected ? '#ffffff' : undefined,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Authors Section (Adjacent to Categories on Desktop!) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-1.5 lg:border-l lg:border-edge lg:pl-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-content-muted">
              <User className="h-3.5 w-3.5 text-indigo-500" />
              <span>Author</span>
              {!isAllAuthors && (
                <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                  1
                </span>
              )}
            </div>
            {!isAllAuthors && (
              <button
                onClick={() => {
                  onSelectAuthor('all');
                  hapticFeedback.light();
                }}
                className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:underline font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Authors Chips Track */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap">
            {/* All Authors */}
            <button
              onClick={() => {
                onSelectAuthor('all');
                hapticFeedback.light();
              }}
              className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                isAllAuthors
                  ? 'border border-indigo-500/80 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-semibold shadow-sm ring-1 ring-indigo-400/30'
                  : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All</span>
              <span className="rounded-md bg-surface-elevated px-1.5 py-0.2 text-[10px] text-content-muted font-semibold">
                {questions.length}
              </span>
            </button>

            {/* Individual Authors */}
            {authorFrequencies.map((a) => {
              const isSelected = selectedAuthor === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    onSelectAuthor(a.id);
                    hapticFeedback.light();
                  }}
                  className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? 'border border-indigo-500/80 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-semibold shadow-sm ring-1 ring-indigo-400/30'
                      : 'border border-edge bg-surface-card/60 text-content-secondary hover:border-edge-strong hover:text-content'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="whitespace-nowrap">{a.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                      isSelected
                        ? 'bg-indigo-500/30 text-white'
                        : 'bg-surface-elevated text-content-muted'
                    }`}
                  >
                    {a.count}
                  </span>
                  {isSelected && <Check className="h-3 w-3 text-indigo-500 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-edge/60" />

      {/* Row 2: Question Types */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-content-muted">
            <LayoutGrid className="h-3.5 w-3.5 text-cyan-500" />
            <span>Question Types</span>
            {selectedTypes.length > 0 && (
              <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-bold text-cyan-600 dark:text-cyan-300">
                {selectedTypes.length}
              </span>
            )}
          </div>
          {selectedTypes.length > 0 && (
            <button
              onClick={() => {
                onClearTypes();
                hapticFeedback.light();
              }}
              className="text-[11px] text-cyan-500 dark:text-cyan-400 hover:underline font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Types Chips Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap">
          {/* All Types */}
          <button
            onClick={() => {
              onClearTypes();
              hapticFeedback.light();
            }}
            className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
              isAllTypes
                ? 'border border-cyan-500/80 bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 font-semibold shadow-sm ring-1 ring-cyan-400/30'
                : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All Types</span>
          </button>

          {/* Each Type */}
          {typeFrequencies.map(({ id, meta, count }) => {
            const isSelected = selectedTypes.includes(id);
            return (
              <button
                key={id}
                onClick={() => {
                  onToggleType(id);
                  hapticFeedback.light();
                }}
                className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border border-cyan-500/80 bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 font-semibold shadow-sm ring-1 ring-cyan-400/30'
                    : 'border border-edge bg-surface-card/60 text-content-secondary hover:border-edge-strong hover:text-content'
                }`}
              >
                <IconHelper name={meta.iconName} className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{meta.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                    isSelected ? 'bg-cyan-500/30 text-white' : 'bg-surface-elevated text-content-muted'
                  }`}
                >
                  {count}
                </span>
                {isSelected && <Check className="h-3 w-3 text-cyan-500 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-edge/60" />

      {/* Row 3: Topics & Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-content-muted">
            <Tags className="h-3.5 w-3.5 text-rose-500" />
            <span>Topics & Tags</span>
            {selectedTags.length > 0 && (
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                {selectedTags.length}
              </span>
            )}
          </div>
          {selectedTags.length > 0 && (
            <button
              onClick={() => {
                onClearTags();
                hapticFeedback.light();
              }}
              className="text-[11px] text-rose-500 dark:text-rose-400 hover:underline font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tags Chips Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 sm:flex-wrap">
          {/* All Tags */}
          <button
            onClick={() => {
              onClearTags();
              hapticFeedback.light();
            }}
            className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
              isAllTags
                ? 'border border-rose-500/80 bg-rose-500/20 text-rose-700 dark:text-rose-200 font-semibold shadow-sm ring-1 ring-rose-400/30'
                : 'border border-edge bg-surface-card/60 text-content-muted hover:border-edge-strong hover:text-content'
            }`}
          >
            <Tags className="h-3.5 w-3.5" />
            <span>All Tags</span>
          </button>

          {/* Individual Tags */}
          {tagFrequencies.map(({ tag, label, count }) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  onToggleTag(tag);
                  hapticFeedback.light();
                }}
                className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border border-rose-500/80 bg-rose-500/20 text-rose-700 dark:text-rose-200 font-semibold shadow-sm ring-1 ring-rose-400/30'
                    : 'border border-edge bg-surface-card/60 text-content-secondary hover:border-edge-strong hover:text-content'
                }`}
              >
                <span className="whitespace-nowrap">{label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                    isSelected ? 'bg-rose-500/30 text-white' : 'bg-surface-elevated text-content-muted'
                  }`}
                >
                  {count}
                </span>
                {isSelected && <Check className="h-3 w-3 text-rose-500 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
