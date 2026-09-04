'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/types/question';
import { CATEGORIES, QUESTION_TYPES, TAG_LABELS } from '@/data/metadata';
import { HoloCanvasCard } from '@/components/canvas/HoloCanvasCard';
import { StageCanvasBg } from '@/components/canvas/StageCanvasBg';
import { TimerWidget } from '@/components/ui/TimerWidget';
import { IconHelper } from '@/components/ui/IconHelper';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  Check,
  Bookmark,
  Copy,
} from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onRandom: () => void;
  isAsked: boolean;
  isFavorite: boolean;
  onToggleAsked: (id: number) => void;
  onToggleFavorite: (id: number) => void;
  currentIndex: number;
  totalCount: number;
}

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.94,
    rotateY: direction > 0 ? 12 : -12,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 26,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.94,
    rotateY: direction < 0 ? 12 : -12,
    transition: {
      duration: 0.18,
      ease: 'easeIn' as const,
    },
  }),
};

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  question,
  onClose,
  onNext,
  onPrev,
  onRandom,
  isAsked,
  isFavorite,
  onToggleAsked,
  onToggleFavorite,
  currentIndex,
  totalCount,
}) => {
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState(1);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setDirection(1);
        onNext();
      }
      if (e.key === 'ArrowLeft') {
        setDirection(-1);
        onPrev();
      }
      if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        setDirection(1);
        onRandom();
      }
    },
    [isOpen, onClose, onNext, onPrev, onRandom]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !question) return null;

  const cat = CATEGORIES[question.category] || CATEGORIES.group;
  const typeMeta = QUESTION_TYPES[question.type];

  const handleCopy = () => {
    navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRandomDraw = () => {
    setDirection(1);
    onRandom();
  };

  const handleNextClick = () => {
    setDirection(1);
    onNext();
  };

  const handlePrevClick = () => {
    setDirection(-1);
    onPrev();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-slate-950/95 backdrop-blur-2xl p-3 sm:p-5">
      {/* Ambient particle background */}
      <StageCanvasBg primaryColor={cat.color} particleCount={40} />

      {/* Top Bar - Mobile Responsive & Never Cut Off */}
      <div className="relative z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-2 pb-3 border-b border-white/10">
        {/* Left: Category Icon & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${cat.color}66`,
              backgroundColor: `${cat.color}22`,
              color: cat.color,
            }}
          >
            <IconHelper name={cat.iconName} className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[120px] sm:max-w-none">
                {cat.label}
              </span>
              <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
                {currentIndex + 1}/{totalCount}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400">
              Shortcuts: [←] [→] or [Space]
            </p>
          </div>
        </div>

        {/* Right: Compact Timer & Guaranteed Visible Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <TimerWidget initialSeconds={60} compact={true} className="py-1 px-2" />
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-slate-200 transition-colors hover:bg-white/20 hover:text-white active:scale-95"
            title="Close (Esc)"
            aria-label="Close presentation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Center Stage Card with Framer Motion Animation */}
      <div className="relative z-20 my-auto flex w-full max-w-2xl mx-auto flex-col items-center py-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={question.id}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            <HoloCanvasCard
              categoryColor={cat.color}
              intensity={1.2}
              className="w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl backdrop-blur-2xl transition-all"
            >
              <div className="flex flex-col justify-between p-5 sm:p-8">
                {/* Header row inside card */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      Question #{question.id.toString().padStart(3, '0')}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${cat.color}22`,
                        color: cat.color,
                        border: `1px solid ${cat.color}55`,
                      }}
                    >
                      {cat.label}
                    </span>
                  </div>

                  {/* Dedicated Question Type & Instruction Banner */}
                  {typeMeta && (
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-300">
                        <IconHelper name={typeMeta.iconName} className="h-4 w-4 shrink-0 text-blue-400" />
                        <span>{typeMeta.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        {typeMeta.hint}
                      </p>
                    </div>
                  )}

                  {/* Main Question Text */}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed tracking-tight text-white selection:bg-blue-500/30">
                    {question.text}
                  </h2>
                </div>

                {/* Bottom row inside card */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {question.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-300 border border-slate-700/60"
                      >
                        {TAG_LABELS[t] || t}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Asked Toggle */}
                    <button
                      onClick={() => onToggleAsked(question.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isAsked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-white/10 text-slate-200 border border-white/15 hover:bg-white/20'
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
                          <span className="hidden xs:inline">Mark as asked</span>
                        </>
                      )}
                    </button>

                    {/* Favorite */}
                    <button
                      onClick={() => onToggleFavorite(question.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 transition-colors ${
                        isFavorite
                          ? 'bg-amber-400/20 text-amber-400 border-amber-400/40'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                      aria-label="Toggle favorite"
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:text-white"
                      aria-label="Copy question"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </HoloCanvasCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Controls */}
      <div className="relative z-30 flex items-center justify-center gap-3 pt-3 pb-2">
        <button
          onClick={handlePrevClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-slate-900/90 text-white backdrop-blur-md transition-all active:scale-95 shadow-md hover:bg-slate-800"
          title="Previous question"
          aria-label="Previous question"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={handleRandomDraw}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-5 font-semibold text-xs sm:text-sm text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95 hover:brightness-110"
          title="Draw random question"
        >
          <Shuffle className="h-4 w-4" />
          <span>Random Draw</span>
        </button>

        <button
          onClick={handleNextClick}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-slate-900/90 text-white backdrop-blur-md transition-all active:scale-95 shadow-md hover:bg-slate-800"
          title="Next question"
          aria-label="Next question"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
