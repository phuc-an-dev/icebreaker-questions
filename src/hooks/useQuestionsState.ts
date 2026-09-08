'use client';

import { useState, useMemo, useCallback, useSyncExternalStore, useEffect } from 'react';
import {
  useQueryState,
  parseAsString,
  parseAsArrayOf,
  debounce,
} from 'nuqs';
import { Question, CategoryId, QuestionTypeId, FilterState, CategoryMeta, TypeMeta } from '@/types/question';
import { CATEGORIES, QUESTION_TYPES } from '@/data/metadata';
import { stripAccents, slugify } from '@/lib/utils';

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

// nuqs Parsers for URL search params
const qParser = parseAsString.withDefault('').withOptions({
  history: 'replace',
  limitUrlUpdates: debounce(300),
  clearOnDefault: true,
});

const categoryParser = parseAsArrayOf(parseAsString, ',')
  .withDefault([])
  .withOptions({
    history: 'replace',
    clearOnDefault: true,
  });

const typeParser = parseAsArrayOf(parseAsString, ',')
  .withDefault([])
  .withOptions({
    history: 'replace',
    clearOnDefault: true,
  });

const tagParser = parseAsArrayOf(parseAsString, ',')
  .withDefault([])
  .withOptions({
    history: 'replace',
    clearOnDefault: true,
  });

const authorParser = parseAsString.withDefault('all').withOptions({
  history: 'replace',
  clearOnDefault: true,
});

export function useQuestionsState(
  initialQuestions: Question[] = [],
  initialCategories: CategoryMeta[] = [],
  initialTypes: TypeMeta[] = []
) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const hasInitialQuestions = initialQuestions && initialQuestions.length > 0;
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);
  const [fetchedCategories, setFetchedCategories] = useState<CategoryMeta[]>([]);
  const [fetchedTypes, setFetchedTypes] = useState<TypeMeta[]>([]);

  // Derived categories: SSR initialCategories > fetchedCategories > default CATEGORIES
  const categories: CategoryMeta[] = useMemo(() => {
    const map = new Map<string, CategoryMeta>();
    for (const c of Object.values(CATEGORIES)) {
      map.set(c.id, c);
    }
    const sourceList = initialCategories.length > 0 ? initialCategories : fetchedCategories;
    for (const c of sourceList) {
      map.set(c.id, c);
    }
    return Array.from(map.values());
  }, [initialCategories, fetchedCategories]);

  // Derived types: SSR initialTypes > fetchedTypes > default QUESTION_TYPES
  const types: TypeMeta[] = useMemo(() => {
    const map = new Map<string, TypeMeta>();
    for (const t of Object.values(QUESTION_TYPES)) {
      map.set(t.id, t);
    }
    const sourceList = initialTypes.length > 0 ? initialTypes : fetchedTypes;
    for (const t of sourceList) {
      map.set(t.id, t);
    }
    return Array.from(map.values());
  }, [initialTypes, fetchedTypes]);

  const [isFetching, setIsFetching] = useState<boolean>(!hasInitialQuestions);
  const [error, setError] = useState<string | null>(null);

  // URL Query State - Single Source of Truth for filters
  const [search, setSearchState] = useQueryState('q', qParser);
  const [urlCategory, setUrlCategory] = useQueryState('category', categoryParser);
  const [urlType, setUrlType] = useQueryState('type', typeParser);
  const [urlTag, setUrlTag] = useQueryState('tag', tagParser);
  const [urlAuthor, setUrlAuthor] = useQueryState('author', authorParser);

  // Debounced search for questions filtering (300ms)
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const isSearching = search !== debouncedSearch;

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
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setFetchedCategories(data.categories);
          }
          if (Array.isArray(data.types) && data.types.length > 0) {
            setFetchedTypes(data.types);
          }
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

  // Fetch client-side if questions or categories are missing
  useEffect(() => {
    if (hasInitialQuestions && initialCategories.length > 0) {
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
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setFetchedCategories(data.categories);
          }
          if (Array.isArray(data.types) && data.types.length > 0) {
            setFetchedTypes(data.types);
          }
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
  }, [hasInitialQuestions, initialCategories.length]);

  const [askedIds, setAskedIds] = useState<Set<number>>(() => getInitialSet(STORAGE_KEY_ASKED));
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => getInitialSet(STORAGE_KEY_FAVORITES));

  const [hideAsked, setHideAsked] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Derived FilterState: URL search params is the Single Source of Truth
  const filters: FilterState = useMemo(() => ({
    categories: urlCategory as CategoryId[],
    types: urlType as QuestionTypeId[],
    tags: urlTag,
    author: urlAuthor,
    search: search,
    hideAsked,
    onlyFavorites,
  }), [urlCategory, urlType, urlTag, urlAuthor, search, hideAsked, onlyFavorites]);

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
    setUrlCategory((prev) => {
      const exists = prev.includes(cat);
      const next = exists ? prev.filter((c) => c !== cat) : [...prev, cat];
      return next.length === 0 ? null : next;
    });
  }, [setUrlCategory]);

  const toggleType = useCallback((typeId: QuestionTypeId) => {
    setUrlType((prev) => {
      const exists = prev.includes(typeId);
      const next = exists ? prev.filter((t) => t !== typeId) : [...prev, typeId];
      return next.length === 0 ? null : next;
    });
  }, [setUrlType]);

  const toggleTag = useCallback((tag: string) => {
    setUrlTag((prev) => {
      const exists = prev.includes(tag);
      const next = exists ? prev.filter((t) => t !== tag) : [...prev, tag];
      return next.length === 0 ? null : next;
    });
  }, [setUrlTag]);

  const setSearch = useCallback((val: string) => {
    const clean = val.trim() ? val : null;
    setSearchState(clean);
  }, [setSearchState]);

  const setAuthor = useCallback((author?: string) => {
    setUrlAuthor((prev) => {
      if (!author || author === 'all' || prev === author) {
        return null;
      }
      return author;
    });
  }, [setUrlAuthor]);

  const clearCategories = useCallback(() => {
    setUrlCategory(null);
  }, [setUrlCategory]);

  const clearTypes = useCallback(() => {
    setUrlType(null);
  }, [setUrlType]);

  const clearTags = useCallback(() => {
    setUrlTag(null);
  }, [setUrlTag]);

  const resetFilters = useCallback(() => {
    setSearchState(null);
    setUrlCategory(null);
    setUrlType(null);
    setUrlTag(null);
    setUrlAuthor(null);
    setHideAsked(false);
    setOnlyFavorites(false);
  }, [setSearchState, setUrlCategory, setUrlType, setUrlTag, setUrlAuthor]);

  // Compute question count by author
  const authorFrequencies = useMemo(() => {
    const counts: Record<string, { id: string; slug: string; name: string; count: number }> = {};
    for (const q of allQuestions) {
      const authorId = q.createdBy?.adminId || 'system';
      const authorName = q.createdBy?.name || 'System';
      const authorSlug = authorId === 'system' ? 'system' : slugify(authorName);
      if (!counts[authorSlug]) {
        counts[authorSlug] = { id: authorId, slug: authorSlug, name: authorName, count: 0 };
      }
      counts[authorSlug].count++;
    }
    return Object.values(counts).sort((a, b) => {
      if (a.slug === 'system') return -1;
      if (b.slug === 'system') return 1;
      return b.count - a.count;
    });
  }, [allQuestions]);

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
      // Author filter: supports clean slug (e.g. 'kieu-linh') and id fallback
      if (filters.author && filters.author !== 'all') {
        const qAuthorId = q.createdBy?.adminId || 'system';
        const qAuthorName = q.createdBy?.name || 'System';
        const qAuthorSlug = qAuthorId === 'system' ? 'system' : slugify(qAuthorName);
        if (filters.author !== qAuthorSlug && filters.author !== qAuthorId) {
          return false;
        }
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
    filters.author,
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
    (filters.author && filters.author !== 'all' ? 1 : 0) +
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
  };
}
