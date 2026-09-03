'use client';

import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import rawQuestions from '@/data/questions.json';
import { Question, CategoryId, QuestionTypeId, FilterState } from '@/types/question';
import { stripAccents } from '@/lib/utils';

const STORAGE_KEY_ASKED = 'icebreaker_asked_v2';
const STORAGE_KEY_FAVORITES = 'icebreaker_favorites_v2';

const allQuestions: Question[] = rawQuestions as Question[];

const emptySubscribe = () => () => {};

function getInitialSet(key: string): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

export function useQuestionsState() {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [askedIds, setAskedIds] = useState<Set<number>>(() => getInitialSet(STORAGE_KEY_ASKED));
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => getInitialSet(STORAGE_KEY_FAVORITES));

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    types: [],
    tags: [],
    search: '',
    hideAsked: false,
    onlyFavorites: false,
  });

  // Save to localStorage when state updates
  const updateAskedIds = useCallback((newSet: Set<number>) => {
    setAskedIds(newSet);
    try {
      localStorage.setItem(STORAGE_KEY_ASKED, JSON.stringify(Array.from(newSet)));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const updateFavoriteIds = useCallback((newSet: Set<number>) => {
    setFavoriteIds(newSet);
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(newSet)));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const toggleAsked = useCallback(
    (id: number) => {
      const next = new Set(askedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      updateAskedIds(next);
    },
    [askedIds, updateAskedIds]
  );

  const toggleFavorite = useCallback(
    (id: number) => {
      const next = new Set(favoriteIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      updateFavoriteIds(next);
    },
    [favoriteIds, updateFavoriteIds]
  );

  const resetAsked = useCallback(() => {
    updateAskedIds(new Set());
  }, [updateAskedIds]);

  const toggleCategory = useCallback((cat: CategoryId) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  }, []);

  const toggleType = useCallback((typeId: QuestionTypeId) => {
    setFilters((prev) => {
      const exists = prev.types.includes(typeId);
      return {
        ...prev,
        types: exists
          ? prev.types.filter((t) => t !== typeId)
          : [...prev.types, typeId],
      };
    });
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      };
    });
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setHideAsked = useCallback((hideAsked: boolean) => {
    setFilters((prev) => ({ ...prev, hideAsked }));
  }, []);

  const setOnlyFavorites = useCallback((onlyFavorites: boolean) => {
    setFilters((prev) => ({ ...prev, onlyFavorites }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      types: [],
      tags: [],
      search: '',
      hideAsked: false,
      onlyFavorites: false,
    });
  }, []);

  // Filter logic
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = stripAccents(filters.search);

    return allQuestions.filter((q) => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(q.category)) {
        return false;
      }
      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(q.type)) {
        return false;
      }
      // Tag filter
      if (filters.tags.length > 0 && !q.tags.some((t) => filters.tags.includes(t))) {
        return false;
      }
      // Hide asked
      if (filters.hideAsked && askedIds.has(q.id)) {
        return false;
      }
      // Only favorites
      if (filters.onlyFavorites && !favoriteIds.has(q.id)) {
        return false;
      }
      // Search term
      if (normalizedSearch) {
        const textNorm = stripAccents(q.text);
        if (!textNorm.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    });
  }, [filters, askedIds, favoriteIds]);

  // Pick a random question
  const getRandomQuestion = useCallback((): Question | null => {
    if (filteredQuestions.length === 0) return null;
    const unaskedPool = filteredQuestions.filter((q) => !askedIds.has(q.id));
    const pool = unaskedPool.length > 0 ? unaskedPool : filteredQuestions;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [filteredQuestions, askedIds]);

  // Stats
  const activeFiltersCount =
    filters.categories.length +
    filters.types.length +
    filters.tags.length +
    (filters.hideAsked ? 1 : 0) +
    (filters.onlyFavorites ? 1 : 0) +
    (filters.search.trim().length > 0 ? 1 : 0);

  return {
    isClient,
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
  };
}
