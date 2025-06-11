// Custom hook for unified movie fetching (Supabase + TMDb)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnifiedMovies, type MovieFilters, type UnifiedMovieResponse } from '@/lib/api';
import type { Movie } from './useMovies';

export interface UseUnifiedMoviesOptions {
  filters?: MovieFilters;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export interface UseUnifiedMoviesReturn {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  sources: { supabase: number; tmdb: number };
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilters: (newFilters: Partial<MovieFilters>) => void;
  clearCache: () => void;
}

export function useUnifiedMovies(options: UseUnifiedMoviesOptions = {}): UseUnifiedMoviesReturn {
  const { filters = {}, enabled = true, refetchOnMount = true } = options;
  
  // State management
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sources, setSources] = useState<{ supabase: number; tmdb: number }>({ supabase: 0, tmdb: 0 });
  const [currentFilters, setCurrentFilters] = useState<MovieFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs for tracking
  const mounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Fetch movies function
  const fetchMovies = useCallback(async (
    fetchFilters: MovieFilters = currentFilters,
    append = false
  ): Promise<void> => {
    if (!enabled || !mounted.current) return;

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching unified movies:', { fetchFilters, append });

      const response: UnifiedMovieResponse = await getUnifiedMovies(fetchFilters);

      if (!mounted.current) return;

      console.log('✅ Unified movies response:', {
        movieCount: response.movies.length,
        total: response.total,
        sources: response.sources
      });

      if (append) {
        setMovies(prev => [...prev, ...response.movies]);
      } else {
        setMovies(response.movies);
      }

      setTotal(response.total);
      setHasMore(response.hasMore);
      setSources(response.sources);

    } catch (err) {
      if (!mounted.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies';
      console.error('❌ Unified movies fetch error:', err);
      setError(errorMessage);
      
      // Don't clear movies on error, keep previous data
      if (!append) {
        setMovies([]);
        setTotal(0);
        setHasMore(false);
        setSources({ supabase: 0, tmdb: 0 });
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [enabled]); // Removed currentFilters dependency to prevent loops

  // Update filters when filters prop changes
  useEffect(() => {
    setCurrentFilters(filters);
  }, [filters]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    if (enabled && refetchOnMount) {
      setCurrentPage(1);
      fetchMovies({ ...currentFilters, page: 1 }, false);
    }
  }, [enabled, refetchOnMount]); // Removed problematic dependencies

  // Separate effect for filter changes
  useEffect(() => {
    if (enabled) {
      setCurrentPage(1);
      fetchMovies({ ...currentFilters, page: 1 }, false);
    }
  }, [JSON.stringify(currentFilters), enabled]); // Use JSON.stringify for deep comparison

  // Refetch function
  const refetch = useCallback(async (): Promise<void> => {
    setCurrentPage(1);
    await fetchMovies({ ...currentFilters, page: 1 }, false);
  }, [fetchMovies, currentFilters]);

  // Load more function for pagination
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    await fetchMovies({ ...currentFilters, page: nextPage }, true);
  }, [hasMore, loading, currentPage, currentFilters, fetchMovies]);

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<MovieFilters>): void => {
    const updatedFilters = { ...currentFilters, ...newFilters };
    setCurrentFilters(updatedFilters);
    setCurrentPage(1);
  }, [currentFilters]);

  // Clear cache function
  const clearCache = useCallback((): void => {
    // This would need to call the unified API's clearCache method
    console.log('🗑️  Clearing unified movies cache');
    // Note: The actual cache clearing would be handled by the API
  }, []);

  return {
    movies,
    loading,
    error,
    total,
    hasMore,
    sources,
    refetch,
    loadMore,
    updateFilters,
    clearCache
  };
}

// Specialized hooks for common use cases
export function usePopularMovies(options: Omit<UseUnifiedMoviesOptions, 'filters'> = {}) {
  return useUnifiedMovies({
    ...options,
    filters: { page: 1, limit: 20 }
  });
}

export function useMovieSearch(query: string, options: Omit<UseUnifiedMoviesOptions, 'filters'> = {}) {
  return useUnifiedMovies({
    ...options,
    filters: { search: query, page: 1, limit: 20 },
    enabled: Boolean(query && query.length > 2)
  });
}

export function useFilteredMovies(
  attentionLevel?: Movie['attention_level'],
  vibe?: Movie['vibe'],
  options: Omit<UseUnifiedMoviesOptions, 'filters'> = {}
) {
  return useUnifiedMovies({
    ...options,
    filters: {
      attention_level: attentionLevel || null,
      vibe: vibe || null,
      page: 1,
      limit: 20
    }
  });
}

// Hook for infinite scroll implementation
export function useInfiniteMovies(filters: MovieFilters = {}) {
  const {
    movies,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    sources,
    total
  } = useUnifiedMovies({ filters });

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await loadMore();
    } finally {
      setLoadingMore(false);
    }
  }, [loadMore, loadingMore, hasMore]);

  return {
    movies,
    loading,
    error,
    hasMore,
    loadingMore,
    sources,
    total,
    loadMore: handleLoadMore,
    refetch
  };
} 