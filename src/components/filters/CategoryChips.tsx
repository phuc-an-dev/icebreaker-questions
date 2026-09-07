'use client';

import React from 'react';
import { CategoryId, Question } from '@/types/question';
import { CATEGORIES } from '@/data/metadata';
import { IconHelper } from '@/components/ui/IconHelper';
import { Layers } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface CategoryChipsProps {
  selectedCategories: CategoryId[];
  onToggleCategory: (cat: CategoryId) => void;
  onClearCategories?: () => void;
  questions: Question[];
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  questions,
}) => {
  const categoryIds = Object.keys(CATEGORIES) as CategoryId[];

  // Calculate count per category
  const countMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of questions) {
      map[q.category] = (map[q.category] || 0) + 1;
    }
    return map;
  }, [questions]);

  const isAllSelected = selectedCategories.length === 0;

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {/* "All" chip */}
      <button
        onClick={() => {
          hapticFeedback.light();
          if (onClearCategories) onClearCategories();
        }}
        className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          isAllSelected
            ? 'border border-blue-500/80 bg-blue-500/20 text-blue-700 dark:text-white shadow-sm ring-1 ring-blue-400/40'
            : 'border border-edge bg-surface-card/70 text-content-muted hover:border-edge-strong hover:text-content'
        }`}
      >
        <Layers className="h-3.5 w-3.5" />
        <span>All</span>
        <span
          className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
            isAllSelected ? 'bg-blue-500/20 dark:bg-white/20 text-blue-700 dark:text-white' : 'bg-surface-elevated text-content-muted'
          }`}
        >
          {questions.length}
        </span>
      </button>

      {/* Individual Categories */}
      {categoryIds.map((id) => {
        const cat = CATEGORIES[id];
        const isSelected = selectedCategories.includes(id);
        const count = countMap[id] || 0;

        return (
          <button
            key={id}
            onClick={() => {
              hapticFeedback.light();
              onToggleCategory(id);
            }}
            className={`group shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
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
            {/* Color Swatch Dot */}
            <span
              className="h-2 w-2 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ backgroundColor: cat.color }}
            />

            {/* Icon */}
            <IconHelper
              name={cat.iconName}
              className="h-3.5 w-3.5"
              style={{ color: isSelected ? cat.color : 'inherit' }}
            />

            {/* Label */}
            <span>{cat.label}</span>

            {/* Question count */}
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold transition-colors ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-elevated text-content-muted group-hover:text-content-secondary'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
