'use client';

import { useState, useMemo, useCallback, useSyncExternalStore, useEffect } from 'react';
import { Question, CategoryId, QuestionTypeId, FilterState } from '@/types/question';
import { stripAccents } from '@/lib/utils';

const STORAGE_KEY_ASKED = 'icebreaker_asked_v2';
const STORAGE_KEY_FAVORITES = 'icebreaker_favorites_v2';

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

export function useQuestionsState(initialQuestions: Question[] = []) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const hasInitialQuestions = initialQuestions && initialQuestions.length > 0;
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(!hasInitialQuestions);
  const [error, setError] = useState<string | null>(null);

  // Debounced search state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const allQuestions = hasInitialQuestions ? initialQuestions : fetchedQuestions;
  const isLoading = !hasInitialQuestions && isFetching;

  const refetch = useCallback(() => {
    setIsFetching(true);
    setError(null);
    fetch('/api/questions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load questions from server');
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setFetchedQuestions(data.data);
          setError(null);
        } else {
          throw new Error(data.error || 'Invalid response data');
        }
      })
      .catch((err) => {
        setError(err.message || 'Database connection error');
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  // Only fetch client-side if initialQuestions was not provided
  useEffect(() => {
    if (hasInitialQuestions) {
      return;
    }

    let isMounted = true;
    fetch('/api/questions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load questions from server');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.data)) {
          setFetchedQuestions(data.data);
          setError(null);
        } else if (isMounted) {
          throw new Error(data.error || 'Invalid response data');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Database connection error');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsFetching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasInitialQuestions]);

  // Debounce search input (400ms)
  useEffect(() => {
    if (!searchInput) return;

    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

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
    setSearchInput(search);
    setFilters((prev) => ({ ...prev, search }));
    if (!search) {
      setDebouncedSearch('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  }, []);

  const setHideAsked = useCallback((hideAsked: boolean) => {
    setFilters((prev) => ({ ...prev, hideAsked }));
  }, []);

  const setOnlyFavorites = useCallback((onlyFavorites: boolean) => {
    setFilters((prev) => ({ ...prev, onlyFavorites }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setIsSearching(false);
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
    const normalizedSearch = stripAccents(debouncedSearch);

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
  }, [
    allQuestions,
    filters.categories,
    filters.types,
    filters.tags,
    filters.hideAsked,
    filters.onlyFavorites,
    debouncedSearch,
    askedIds,
    favoriteIds,
  ]);

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
    isLoading,
    isSearching,
    debouncedSearch,
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
  };
}
