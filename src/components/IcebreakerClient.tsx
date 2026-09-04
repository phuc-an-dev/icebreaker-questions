'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuestionsState } from '@/hooks/useQuestionsState';
import { Question } from '@/types/question';
import { QuestionCard } from '@/components/cards/QuestionCard';
import { CategoryChips } from '@/components/filters/CategoryChips';
import { FilterBar } from '@/components/filters/FilterBar';
import { PresentationModal } from '@/components/stage/PresentationModal';
import { StatsBar } from '@/components/ui/StatsBar';
import { StageCanvasBg } from '@/components/canvas/StageCanvasBg';
import {
  Sparkles,
  HelpCircle,
  RotateCcw,
  Compass,
  ArrowUp,
  Loader2,
} from 'lucide-react';

interface IcebreakerClientProps {
  initialQuestions?: Question[];
}

export function IcebreakerClient({ initialQuestions = [] }: IcebreakerClientProps) {
  const {
    isClient,
    isLoading,
    error,
    refetch,
    allQuestions,
    filteredQuestions,
    filters,
    askedIds,
    favoriteIds,
    activeFiltersCount,
    toggleAsked,
    toggleFavorite,
    resetAsked,
    toggleCategory,
    toggleType,
    toggleTag,
    setSearch,
    setHideAsked,
    setOnlyFavorites,
    resetFilters,
    getRandomQuestion,
  } = useQuestionsState(initialQuestions);

  // Stage presentation mode state
  const [stageOpen, setStageOpen] = useState(false);
  const [currentStageQuestion, setCurrentStageQuestion] = useState<Question | null>(null);

  // Card highlight animation state
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Show scroll to top only after scrolling down
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle open stage
  const handleOpenStage = (targetQuestion?: Question) => {
    if (targetQuestion) {
      setCurrentStageQuestion(targetQuestion);
    } else if (filteredQuestions.length > 0) {
      const q = getRandomQuestion() || filteredQuestions[0];
      setCurrentStageQuestion(q);
    }
    setStageOpen(true);
  };

  // Stage next / prev / random
  const handleStageNext = () => {
    if (!currentStageQuestion || filteredQuestions.length === 0) return;
    const currentIndex = filteredQuestions.findIndex((q) => q.id === currentStageQuestion.id);
    const nextIndex = (currentIndex + 1) % filteredQuestions.length;
    setCurrentStageQuestion(filteredQuestions[nextIndex]);
  };

  const handleStagePrev = () => {
    if (!currentStageQuestion || filteredQuestions.length === 0) return;
    const currentIndex = filteredQuestions.findIndex((q) => q.id === currentStageQuestion.id);
    const prevIndex = (currentIndex - 1 + filteredQuestions.length) % filteredQuestions.length;
    setCurrentStageQuestion(filteredQuestions[prevIndex]);
  };

  const handleStageRandom = () => {
    const q = getRandomQuestion();
    if (q) setCurrentStageQuestion(q);
  };

  // Handle random draw on Grid View
  const handleRandomDraw = () => {
    const pick = getRandomQuestion();
    if (!pick) return;

    setHighlightedId(pick.id);
    const el = cardRefs.current.get(pick.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedId(null);
    }, 2500);
  };

  const currentStageIndex = currentStageQuestion
    ? filteredQuestions.findIndex((q) => q.id === currentStageQuestion.id)
    : 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllCategories = () => {
    filters.categories.forEach((c) => toggleCategory(c));
  };

  return (
    <main className="relative min-h-screen bg-[#070b12] text-slate-100 pb-28 sm:pb-32">
      {/* Ambient Hero Canvas particles */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[450px] overflow-hidden opacity-40">
        <StageCanvasBg primaryColor="#f59e0b" particleCount={30} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070b12]/80 to-[#070b12]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-3.5 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-5 sm:mb-8 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-amber-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {isLoading
                ? 'Loading...'
                : `${allQuestions.length} Icebreaker Questions`}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Icebreaker{' '}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
              Question Bank
            </span>
          </h1>
        </header>

        {/* Stats bar */}
        <section className="mb-5 sm:mb-6">
          <StatsBar
            totalCount={allQuestions.length}
            askedCount={isClient ? askedIds.size : 0}
            favoriteCount={isClient ? favoriteIds.size : 0}
            onResetAsked={resetAsked}
          />
        </section>

        {/* Category Chips section (Swipeable on Mobile) */}
        <section className="mb-5 sm:mb-6">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
            </span>
            {filters.categories.length > 0 && (
              <button
                onClick={handleClearAllCategories}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <CategoryChips
            selectedCategories={filters.categories}
            onToggleCategory={toggleCategory}
            onClearCategories={handleClearAllCategories}
            questions={allQuestions}
          />
        </section>

        {/* Question Cards Grid */}
        <section className="mb-14">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
              <p className="mt-3 text-sm text-slate-400">Loading questions from MongoDB Atlas...</p>
            </div>
          ) : error && allQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-900/40 bg-rose-950/20 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-800/60 bg-rose-900/30 text-rose-400">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-rose-200">
                Failed to load questions from database
              </h3>
              <p className="mt-1 text-xs text-rose-300/80 max-w-md">
                {error}. Please check your connection or MongoDB configuration.
              </p>
              <button
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-200">
                No matching questions found
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Try clearing filters or searching with different keywords.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuestions.map((q) => {
                const isHighlight = highlightedId === q.id;
                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(q.id, el);
                      else cardRefs.current.delete(q.id);
                    }}
                    className={`transition-all duration-500 rounded-2xl ${
                      isHighlight
                        ? 'ring-4 ring-amber-400 scale-[1.02] shadow-2xl shadow-amber-500/50'
                        : ''
                    }`}
                  >
                    <QuestionCard
                      question={q}
                      isAsked={isClient && askedIds.has(q.id)}
                      isFavorite={isClient && favoriteIds.has(q.id)}
                      onToggleAsked={toggleAsked}
                      onToggleFavorite={toggleFavorite}
                      onOpenStage={(target) => handleOpenStage(target)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 pt-6 pb-6 text-center text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>Icebreaker Question Bank — {allQuestions.length} Questions</span>
          </div>
          <p className="mt-1 text-slate-600">
            Powered by MongoDB Atlas • Mobile-First Ergonomic UX • 60fps Interactive Canvas Hologram
          </p>
        </footer>
      </div>

      {/* Floating Bottom Filter & Action Bar (Optimal Thumb Reach for Mobile & Desktop) */}
      <aside className="fixed bottom-3 inset-x-3 z-40 mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-950/90 p-2.5 sm:p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
        {/* Docked Back-to-top button: ALWAYS floating directly above the bottom bar */}
        <button
          onClick={scrollToTop}
          className={`absolute -top-12 right-2 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-slate-900/95 text-slate-200 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:bg-slate-800 hover:text-white active:scale-95 ${
            showScrollTop
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>

        <FilterBar
          filters={filters}
          onSearchChange={setSearch}
          onToggleType={toggleType}
          onToggleTag={toggleTag}
          onToggleHideAsked={setHideAsked}
          onToggleOnlyFavorites={setOnlyFavorites}
          onResetFilters={resetFilters}
          onRandomDraw={handleRandomDraw}
          onOpenStage={handleOpenStage}
          activeFiltersCount={activeFiltersCount}
          filteredCount={filteredQuestions.length}
          totalCount={allQuestions.length}
          allQuestions={allQuestions}
        />
      </aside>

      {/* Fullscreen Stage Presentation Mode Modal */}
      <PresentationModal
        isOpen={stageOpen}
        question={currentStageQuestion}
        onClose={() => setStageOpen(false)}
        onNext={handleStageNext}
        onPrev={handleStagePrev}
        onRandom={handleStageRandom}
        isAsked={
          isClient && currentStageQuestion
            ? askedIds.has(currentStageQuestion.id)
            : false
        }
        isFavorite={
          isClient && currentStageQuestion
            ? favoriteIds.has(currentStageQuestion.id)
            : false
        }
        onToggleAsked={toggleAsked}
        onToggleFavorite={toggleFavorite}
        currentIndex={currentStageIndex}
        totalCount={filteredQuestions.length}
      />
    </main>
  );
}
