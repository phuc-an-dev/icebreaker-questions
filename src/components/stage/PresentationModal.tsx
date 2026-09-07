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
import { SPRING_PHYSICS } from '@/lib/motion';
import { hapticFeedback } from '@/lib/haptics';

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
    transition: SPRING_PHYSICS.modal,
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

  // Lock body scroll while stage presentation is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !question) return null;

  const cat = CATEGORIES[question.category] || CATEGORIES.group;
  const typeMeta = QUESTION_TYPES[question.type];

  const handleClose = () => {
    hapticFeedback.medium();
    onClose();
  };

  const handleCopy = () => {
    hapticFeedback.light();
    navigator.clipboard.writeText(question.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRandomDraw = () => {
    hapticFeedback.light();
    setDirection(1);
    onRandom();
  };

  const handleNextClick = () => {
    hapticFeedback.light();
    setDirection(1);
    onNext();
  };

  const handlePrevClick = () => {
    hapticFeedback.light();
    setDirection(-1);
    onPrev();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-surface/95 backdrop-blur-2xl p-3 sm:p-5">
      {/* Ambient particle background */}
      <StageCanvasBg primaryColor={cat.color} particleCount={40} />

      {/* Top Bar - Mobile Responsive & Never Cut Off */}
      <div className="relative z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-2 pb-3 border-b border-edge-strong">
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
              <span className="text-xs sm:text-sm font-bold text-content tracking-wide truncate max-w-[120px] sm:max-w-none">
                {cat.label}
              </span>
              <span className="shrink-0 rounded-md bg-black/10 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-content-secondary">
                {currentIndex + 1}/{totalCount}
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-content-muted">
              Shortcuts: [←] [→] or [Space]
            </p>
          </div>
        </div>

        {/* Right: Compact Timer & Guaranteed Visible Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <TimerWidget initialSeconds={60} compact={true} className="py-1 px-2" />
          <button
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge-strong bg-black/10 dark:bg-white/10 text-content transition-colors hover:bg-black/20 dark:hover:bg-white/20 active:scale-95"
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
              className="w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-edge-strong bg-surface-card/90 shadow-2xl backdrop-blur-2xl transition-all"
            >
              <div className="flex flex-col justify-between p-5 sm:p-8">
                {/* Header row inside card */}
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3">
                    <span className="font-mono text-xs font-semibold text-content-muted">
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
                    <div className="mb-4 rounded-xl border border-edge bg-surface-elevated/50 p-3">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-300">
                        <IconHelper name={typeMeta.iconName} className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                        <span>{typeMeta.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-content-secondary leading-relaxed">
                        {typeMeta.hint}
                      </p>
                    </div>
                  )}

                  {/* Main Question Text */}
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed tracking-tight text-content selection:bg-blue-500/30">
                    {question.text}
                  </h2>
                </div>

                {/* Bottom row inside card */}
                <div className="mt-6 pt-4 border-t border-edge flex flex-wrap items-center justify-between gap-2.5">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {question.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-surface-elevated/80 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-content-secondary border border-edge-subtle"
                      >
                        {TAG_LABELS[t] || t}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Asked Toggle */}
                    <button
                      onClick={() => {
                        hapticFeedback.medium();
                        onToggleAsked(question.id);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isAsked
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/50'
                          : 'bg-black/10 dark:bg-white/10 text-content border border-edge hover:bg-black/20 dark:hover:bg-white/20'
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
                          <span className="hidden xs:inline">Mark as asked</span>
                        </>
                      )}
                    </button>

                    {/* Favorite */}
                    <button
                      onClick={() => {
                        hapticFeedback.medium();
                        onToggleFavorite(question.id);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-edge transition-colors ${
                        isFavorite
                          ? 'bg-amber-400/20 text-amber-500 dark:text-amber-400 border-amber-400/40'
                          : 'bg-black/5 dark:bg-white/5 text-content-muted hover:text-content'
                      }`}
                      aria-label="Toggle favorite"
                    >
                      <Bookmark className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    {/* Copy */}
                    <button
                      onClick={handleCopy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-black/5 dark:bg-white/5 text-content-muted transition-colors hover:text-content"
                      aria-label="Copy question"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
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
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-edge-strong bg-surface-card/90 text-content backdrop-blur-md transition-all active:scale-95 shadow-md hover:bg-surface-elevated"
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
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-edge-strong bg-surface-card/90 text-content backdrop-blur-md transition-all active:scale-95 shadow-md hover:bg-surface-elevated"
          title="Next question"
          aria-label="Next question"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
