'use client';

import React, { useState } from 'react';
import { Question, CategoryMeta, TypeMeta } from '@/types/question';
import { CATEGORIES, QUESTION_TYPES, TAG_LABELS } from '@/data/metadata';
import { HoloCanvasCard } from '@/components/canvas/HoloCanvasCard';
import { IconHelper } from '@/components/ui/IconHelper';
import {
  Check,
  CheckCircle2,
  Bookmark,
  Copy,
  Maximize2,
} from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

interface QuestionCardProps {
  question: Question;
  isAsked: boolean;
  isFavorite: boolean;
  onToggleAsked: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onOpenStage: (question: Question) => void;
  categoryMeta?: CategoryMeta;
  typeMeta?: TypeMeta;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isAsked,
  isFavorite,
  onToggleAsked,
  onToggleFavorite,
  onOpenStage,
  categoryMeta,
  typeMeta,
}) => {
  const [copied, setCopied] = useState(false);
  const cat = categoryMeta || CATEGORIES[question.category] || {
    id: question.category,
    label: question.category,
    color: '#3b82f6',
    iconName: 'Users',
    description: '',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    borderGlow: 'rgba(59, 130, 246, 0.6)',
  };
  const activeTypeMeta = typeMeta || QUESTION_TYPES[question.type];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(question.text);
    hapticFeedback.light();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <HoloCanvasCard
      categoryColor={cat.color}
      className={`group flex flex-col justify-between overflow-hidden border backdrop-blur-md transition-all duration-300 ${
        isAsked
          ? 'border-edge opacity-60 hover:opacity-100 bg-surface/60 dark:bg-surface/60'
          : 'border-edge hover:border-edge-strong hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 bg-surface-card/80 dark:bg-surface-card/80'
      }`}
    >
      <div className="flex h-full flex-col justify-between p-4 sm:p-5">
        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-2 pb-3">
            {/* Category Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide shadow-sm whitespace-nowrap"
              style={{
                backgroundColor: `${cat.color}18`,
                border: `1px solid ${cat.color}44`,
                color: cat.color,
              }}
            >
              <IconHelper name={cat.iconName} className="h-3.5 w-3.5 shrink-0" />
              <span>{cat.label}</span>
            </div>

            {/* Question ID & Stage View Button */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-content-muted">
                #{question.id.toString().padStart(3, '0')}
              </span>

              <button
                onClick={() => onOpenStage(question)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-content-muted opacity-80 sm:opacity-0 transition-all hover:bg-black/5 dark:hover:bg-white/10 hover:text-content group-hover:opacity-100"
                title="Fullscreen Presentation Mode"
                aria-label="Open presentation mode"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Dedicated Question Type & Full Instruction Banner (No truncation, no awkward wraps) */}
          {activeTypeMeta && (
            <div className="mb-3.5 rounded-xl border border-edge-subtle bg-surface-elevated/50 p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300/90 whitespace-nowrap">
                <IconHelper name={activeTypeMeta.iconName} className="h-3.5 w-3.5 shrink-0 text-blue-500 dark:text-blue-400" />
                <span>{activeTypeMeta.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-content-muted">
                {activeTypeMeta.hint}
              </p>
            </div>
          )}

          {/* Question Main Text */}
          <p className="text-base font-medium leading-relaxed text-content selection:bg-blue-500/30">
            {question.text}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="mt-5 pt-3 border-t border-edge">
          {/* Tags & Author attribution */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
            {question.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {question.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface-elevated/60 px-2 py-0.5 text-[10px] font-medium text-content-muted border border-edge-subtle"
                  >
                    {TAG_LABELS[t] || t}
                  </span>
                ))}
              </div>
            ) : <div />}
            <span className="text-[10px] font-medium text-content-muted/75 shrink-0 ml-auto">
              By {question.createdBy?.name || 'System'}
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-1">
            {/* Asked Toggle Button */}
            <button
              onClick={() => {
                hapticFeedback.light();
                onToggleAsked(question.id);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                isAsked
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-black/5 dark:bg-white/5 text-content-secondary border border-edge hover:bg-black/10 dark:hover:bg-white/10 hover:text-content'
              }`}
            >
              {isAsked ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Asked</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-content-muted" />
                  <span>Mark as asked</span>
                </>
              )}
            </button>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-content"
                title={copied ? 'Copied!' : 'Copy question text'}
                aria-label="Copy question"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Bookmark / Favorite button */}
              <button
                onClick={() => {
                  hapticFeedback.light();
                  onToggleFavorite(question.id);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isFavorite
                    ? 'text-amber-500 dark:text-amber-400 hover:bg-amber-400/20'
                    : 'text-content-muted hover:bg-black/5 dark:hover:bg-white/10 hover:text-content'
                }`}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-label="Toggle favorite"
              >
                <Bookmark
                  className="h-3.5 w-3.5"
                  fill={isFavorite ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </HoloCanvasCard>
  );
};
