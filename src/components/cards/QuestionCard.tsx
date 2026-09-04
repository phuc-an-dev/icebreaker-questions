'use client';

import React, { useState } from 'react';
import { Question } from '@/types/question';
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

interface QuestionCardProps {
  question: Question;
  isAsked: boolean;
  isFavorite: boolean;
  onToggleAsked: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  onOpenStage: (question: Question) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isAsked,
  isFavorite,
  onToggleAsked,
  onToggleFavorite,
  onOpenStage,
}) => {
  const [copied, setCopied] = useState(false);
  const cat = CATEGORIES[question.category] || CATEGORIES.group;
  const typeMeta = QUESTION_TYPES[question.type];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <HoloCanvasCard
      categoryColor={cat.color}
      className={`group flex flex-col justify-between overflow-hidden border backdrop-blur-md transition-all duration-300 ${
        isAsked
          ? 'border-slate-800/80 bg-slate-950/60 opacity-60 hover:opacity-100'
          : 'border-slate-800/90 bg-slate-900/80 hover:border-slate-700/90 hover:shadow-xl hover:shadow-black/40'
      }`}
    >
      <div className="flex h-full flex-col justify-between p-4 sm:p-5">
        {/* Top Header Row */}
        <div>
          <div className="flex items-center justify-between gap-2 pb-3">
            {/* Category Badge */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide text-white shadow-sm whitespace-nowrap"
              style={{
                backgroundColor: `${cat.color}28`,
                border: `1px solid ${cat.color}66`,
                color: cat.color,
              }}
            >
              <IconHelper name={cat.iconName} className="h-3.5 w-3.5 shrink-0" />
              <span>{cat.label}</span>
            </div>

            {/* Question ID & Stage View Button */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs font-semibold text-slate-500">
                #{question.id.toString().padStart(3, '0')}
              </span>

              <button
                onClick={() => onOpenStage(question)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-80 sm:opacity-0 transition-all hover:bg-white/10 hover:text-slate-200 group-hover:opacity-100"
                title="Fullscreen Presentation Mode"
                aria-label="Open presentation mode"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Dedicated Question Type & Full Instruction Banner (No truncation, no awkward wraps) */}
          {typeMeta && (
            <div className="mb-3.5 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300/90 whitespace-nowrap">
                <IconHelper name={typeMeta.iconName} className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span>{typeMeta.label}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {typeMeta.hint}
              </p>
            </div>
          )}

          {/* Question Main Text */}
          <p className="text-base font-medium leading-relaxed text-slate-100 selection:bg-blue-500/30">
            {question.text}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="mt-5 pt-3 border-t border-slate-800/60">
          {/* Tags */}
          {question.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {question.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/40"
                >
                  {TAG_LABELS[t] || t}
                </span>
              ))}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-1">
            {/* Asked Toggle Button */}
            <button
              onClick={() => onToggleAsked(question.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                isAsked
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isAsked ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Asked</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-slate-400" />
                  <span>Mark as asked</span>
                </>
              )}
            </button>

            {/* Quick Action Icons */}
            <div className="flex items-center gap-1">
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
                title={copied ? 'Copied!' : 'Copy question text'}
                aria-label="Copy question"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Bookmark / Favorite button */}
              <button
                onClick={() => onToggleFavorite(question.id)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  isFavorite
                    ? 'text-amber-400 hover:bg-amber-400/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
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
