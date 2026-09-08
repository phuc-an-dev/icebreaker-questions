'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuestionsState } from '@/hooks/useQuestionsState';
import { Question, CategoryMeta, TypeMeta } from '@/types/question';
import { QuestionCard } from '@/components/cards/QuestionCard';
import { InlineFilters } from '@/components/filters/InlineFilters';
import { FilterBar } from '@/components/filters/FilterBar';
import { PresentationModal } from '@/components/stage/PresentationModal';
import { StatsBar } from '@/components/ui/StatsBar';
import { StageCanvasBg } from '@/components/canvas/StageCanvasBg';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { hapticFeedback } from '@/lib/haptics';
import Link from 'next/link';
import {
  Sparkles,
  HelpCircle,
  RotateCcw,
  Compass,
  ArrowUp,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface IcebreakerClientProps {
  initialQuestions?: Question[];
  initialCategories?: CategoryMeta[];
  initialTypes?: TypeMeta[];
}

export function IcebreakerClient({
  initialQuestions = [],
  initialCategories = [],
  initialTypes = [],
}: IcebreakerClientProps) {
  const {
    isClient,
    isLoading,
    isSearching,
    error,
    refetch,
    allQuestions,
    filteredQuestions,
    filters,
    categories,
    types,
    askedIds,
    favoriteIds,
    activeFiltersCount,
    authorFrequencies,
    toggleAsked,
    toggleFavorite,
    resetAsked,
    toggleCategory,
    clearCategories,
    toggleType,
    clearTypes,
    toggleTag,
    clearTags,
    setAuthor,
    setSearch,
    setHideAsked,
    setOnlyFavorites,
    resetFilters,
    getRandomQuestion,
  } = useQuestionsState(initialQuestions, initialCategories, initialTypes);

  const categoriesMap = React.useMemo(() => {
    const map: Record<string, CategoryMeta> = {};
    for (const c of categories) {
      map[c.id] = c;
    }
    return map;
  }, [categories]);

  const typesMap = React.useMemo(() => {
    const map: Record<string, TypeMeta> = {};
    for (const t of types) {
      map[t.id] = t;
    }
    return map;
  }, [types]);

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
    hapticFeedback.medium();
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
    hapticFeedback.medium();
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
    hapticFeedback.light();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="relative min-h-screen bg-surface text-content pb-28 sm:pb-32">
      {/* Ambient Hero Canvas particles */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[450px] overflow-hidden"
        style={{ opacity: 'var(--canvas-particle-opacity)' }}
      >
        <StageCanvasBg primaryColor="#3b82f6" particleCount={30} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent, var(--bg-main-faded), var(--bg-main))`,
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-3.5 py-4 sm:px-6 lg:px-8">
        {/* Top App Bar — balanced flex row */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span>
              {isLoading
                ? 'Loading...'
                : `${allQuestions.length} Icebreaker Questions`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

        {/* Hero Title Section */}
        <header className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-content sm:text-4xl lg:text-5xl">
            Icebreaker{' '}
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Question Bank
            </span>
          </h1>
        </header>

        {/* Inline Filters Panel: Categories, Authors, Question Types, Topics & Tags */}
        <InlineFilters
          selectedCategories={filters.categories}
          onToggleCategory={toggleCategory}
          onClearCategories={clearCategories}
          categories={categories}
          selectedAuthor={filters.author}
          onSelectAuthor={setAuthor}
          authorFrequencies={authorFrequencies}
          selectedTypes={filters.types}
          onToggleType={toggleType}
          onClearTypes={clearTypes}
          types={types}
          selectedTags={filters.tags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          questions={allQuestions}
          onResetAll={resetFilters}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Question Cards Grid */}
        <section className="mb-14">

          {/* Searching debounce loading banner */}
          {isSearching && (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 px-4 text-xs font-semibold text-blue-500 dark:text-blue-300 backdrop-blur-md animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 dark:text-blue-400" />
              <span>Filtering questions...</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface-card/40 px-4 py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
              <p className="mt-3 text-sm text-content-muted">Loading questions from MongoDB Atlas...</p>
            </div>
          ) : error && allQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-400/40 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-300 dark:border-rose-800/60 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-rose-700 dark:text-rose-200">
                Failed to load questions from database
              </h3>
              <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-300/80 max-w-md">
                {error}. Please check your connection or MongoDB configuration.
              </p>
              <button
                onClick={refetch}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-surface-card/40 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-edge bg-surface-elevated text-content-muted">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-content">
                No matching questions found
              </h3>
              <p className="mt-1 text-xs text-content-muted">
                Try clearing filters or searching with different keywords.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-500/20 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ${
                isSearching ? 'opacity-60 pointer-events-none' : 'opacity-100'
              }`}
            >
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
                        ? 'ring-4 ring-blue-500 scale-[1.02] shadow-2xl shadow-blue-500/50'
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
                      categoryMeta={categoriesMap[q.category]}
                      typeMeta={typesMap[q.type]}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-edge pt-6 pb-6 text-center text-xs text-content-muted">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Compass className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            <span>Icebreaker Question Bank — {allQuestions.length} Questions</span>
          </div>
          <p className="mt-1 text-content-muted/60">
            Powered by MongoDB Atlas • Mobile-First Ergonomic UX • 60fps Interactive Canvas Hologram
          </p>
          <div className="mt-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] text-content-muted hover:text-blue-500 dark:hover:text-blue-400 transition"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Management Portal</span>
            </Link>
          </div>
        </footer>
      </div>

      {/* Floating Bottom Filter & Action Bar (Optimal Thumb Reach for Mobile & Desktop) */}
      <aside className="fixed bottom-3 inset-x-3 z-40 mx-auto max-w-xl rounded-2xl border border-edge bg-[var(--bg-glass-heavy)] p-2.5 sm:p-3 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10">
        {/* Docked Back-to-top button: ALWAYS floating directly above the bottom bar */}
        <button
          onClick={scrollToTop}
          className={`absolute -top-12 right-2 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-edge-strong bg-[var(--bg-glass-heavy)] text-content shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:bg-surface-elevated hover:text-content active:scale-95 ${
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
          onSelectAuthor={setAuthor}
          authorFrequencies={authorFrequencies}
          onToggleHideAsked={setHideAsked}
          onToggleOnlyFavorites={setOnlyFavorites}
          onResetFilters={resetFilters}
          onRandomDraw={handleRandomDraw}
          onOpenStage={handleOpenStage}
          activeFiltersCount={activeFiltersCount}
          filteredCount={filteredQuestions.length}
          totalCount={allQuestions.length}
          allQuestions={allQuestions}
          isSearching={isSearching}
        />
      </aside>

      {/* Floating Compact Stats Bar (PC / Desktop only) */}
      <div className="hidden xl:flex fixed bottom-3 right-4 z-40">
        <StatsBar
          compact
          totalCount={allQuestions.length}
          askedCount={isClient ? askedIds.size : 0}
          favoriteCount={isClient ? favoriteIds.size : 0}
          onResetAsked={resetAsked}
        />
      </div>

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
        categoryMeta={currentStageQuestion ? categoriesMap[currentStageQuestion.category] : undefined}
        typeMeta={currentStageQuestion ? typesMap[currentStageQuestion.type] : undefined}
      />
    </main>
  );
}
