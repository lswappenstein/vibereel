'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useFilters } from '@/context/FilterContext';
import { useQueryFilters } from '@/hooks/useQueryFilters';
import { getUnifiedMovies, getAPIHealthStatus, type MovieFilters } from '@/lib/api';
import type { Movie } from '@/hooks/useMovies';
import MovieCard from '@/components/MovieCard';
import AttentionFilter from '@/components/AttentionFilter';
import VibeFilter from '@/components/VibeFilter';
import CategoryFilter, { type CategoryType } from '@/components/CategoryFilter';
import SearchBar from '@/components/SearchBar';

const MOVIES_PER_PAGE = 20;

export default function DiscoverPage() {
  const { filters, setAttentionLevel, setVibe, setCategory } = useFilters();
  const queryFilters = useQueryFilters();
  const [healthStatus, setHealthStatus] = useState<{ supabase: boolean; tmdb: boolean } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasInitialized = useRef(false);
  
  // Movie state - enhanced for infinite scroll
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<{ supabase: number; tmdb: number }>({ supabase: 0, tmdb: 0 });

  // Infinite scroll ref
  const loadMoreRef = useRef(null);

  // Memoize filters to prevent unnecessary re-renders
  const currentFilters = useMemo<MovieFilters>(() => ({
    search: searchQuery || undefined,
    attention_level: filters.attentionLevel || undefined,
    vibe: filters.vibe || undefined,
    category: filters.category || 'popular', // Default to popular instead of undefined
    page: 1, // Always start with page 1 for initial fetch
    limit: MOVIES_PER_PAGE
  }), [searchQuery, filters.attentionLevel, filters.vibe, filters.category]);

  // Fetch movies function - enhanced for pagination
  const fetchMovies = async (filters: MovieFilters, isLoadMore = false) => {
    if (loading || loadingMore) return; // Prevent concurrent requests
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      console.log('🔍 Fetching movies with filters:', filters);
      const response = await getUnifiedMovies(filters);
      
      console.log('✅ Movies response:', {
        movieCount: response.movies.length,
        total: response.total,
        sources: response.sources,
        page: response.page,
        hasMore: response.hasMore
      });
      
      if (isLoadMore) {
        // Append to existing movies, avoiding duplicates
        setMovies(prevMovies => {
          const existingIds = new Set(prevMovies.map(m => m.id));
          const newMovies = response.movies.filter(m => !existingIds.has(m.id));
          return [...prevMovies, ...newMovies];
        });
      } else {
        // Replace movies for new search/filter
        setMovies(response.movies);
        setCurrentPage(1);
      }
      
      setTotal(response.total);
      setHasMore(response.hasMore);
      setSources(prev => ({
        supabase: isLoadMore ? prev.supabase + response.sources.supabase : response.sources.supabase,
        tmdb: isLoadMore ? prev.tmdb + response.sources.tmdb : response.sources.tmdb
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies';
      console.error('❌ Movie fetch error:', err);
      setError(errorMessage);
      
      if (!isLoadMore) {
        setMovies([]);
        setTotal(0);
        setSources({ supabase: 0, tmdb: 0 });
        setHasMore(false);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Load more movies function
  const loadMoreMovies = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    const nextPage = currentPage + 1;
    const loadMoreFilters = { ...currentFilters, page: nextPage };
    
    await fetchMovies(loadMoreFilters, true);
    setCurrentPage(nextPage);
  }, [currentFilters, currentPage, hasMore, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !loadingMore) {
          console.log('🔄 Load more triggered by intersection');
          loadMoreMovies();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreMovies, hasMore, loading, loadingMore]);

  // Apply URL parameters to filters on mount (only once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      if (queryFilters.category) {
        setCategory(queryFilters.category);
      }
      if (queryFilters.attention_level) {
        setAttentionLevel(queryFilters.attention_level);
      }
      if (queryFilters.vibe) {
        setVibe(queryFilters.vibe);
      }
      if (queryFilters.search) {
        setSearchQuery(queryFilters.search);
      }
    }
  }, [queryFilters, setCategory, setAttentionLevel, setVibe]);

  // Check API health on mount
  useEffect(() => {
    let mounted = true;
    
    const checkHealth = async () => {
      try {
        const status = await getAPIHealthStatus();
        if (mounted) {
          setHealthStatus(status);
          console.log('🏥 API Health Status:', status);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
        if (mounted) {
          setHealthStatus({ supabase: false, tmdb: false });
        }
      }
    };

    checkHealth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch movies on filter changes (debounced) - resets pagination
  useEffect(() => {
    console.log('🎬 useEffect triggered with filters:', currentFilters);
    const timeoutId = setTimeout(() => {
      console.log('🚀 About to fetch movies with filters:', currentFilters);
      fetchMovies(currentFilters, false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(currentFilters)]); // Use JSON.stringify for deep comparison

  // Manual refetch function
  const handleRefetch = () => {
    setCurrentPage(1);
    setHasMore(true);
    fetchMovies(currentFilters, false);
  };

  // Get current category display name
  const getCategoryDisplayName = (category?: CategoryType) => {
    switch (category) {
      case 'popular': return 'Popular Movies';
      case 'now-playing': return 'Now Playing';
      case 'upcoming': return 'Upcoming Movies';
      case 'top-rated': return 'Top Rated Movies';
      case null:
      default: 
        return 'Popular Movies';
    }
  };

  console.log('🎬 DiscoverPage render:', {
    moviesCount: movies.length,
    loading,
    loadingMore,
    error,
    total,
    sources,
    filters: currentFilters,
    healthStatus,
    currentPage,
    hasMore
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Discover Movies
          </h1>
          <p className="text-gray-600 mb-6">
            Find your perfect movie based on attention level and vibe
          </p>

          {/* API Health Status */}
          {healthStatus && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Data Sources:</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${healthStatus.supabase ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-700">Supabase</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${healthStatus.tmdb ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-700">TMDb</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Info
                </button>
              </div>
              
              {showDebug && (
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <div>Movies loaded: {movies.length}</div>
                  <div>Total available: {total}</div>
                  <div>From Supabase: {sources.supabase}</div>
                  <div>From TMDb: {sources.tmdb}</div>
                  <div>Loading: {loading ? 'Yes' : 'No'}</div>
                  <div>Loading more: {loadingMore ? 'Yes' : 'No'}</div>
                  <div>Current page: {currentPage}</div>
                  <div>Has more: {hasMore ? 'Yes' : 'No'}</div>
                  {error && <div className="text-red-500">Error: {error}</div>}
                  <div>Filters: {JSON.stringify(currentFilters)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <SearchBar 
            onSearch={setSearchQuery}
            placeholder="Search for movies..."
            initialValue={searchQuery}
          />
          
          {/* Three Column Filter Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CategoryFilter 
              selectedCategory={filters.category}
              onSelect={setCategory}
            />
            <AttentionFilter 
              selectedLevel={filters.attentionLevel}
              onSelect={setAttentionLevel}
            />
            <VibeFilter 
              selectedVibe={filters.vibe}
              onSelect={setVibe}
            />
          </div>

          {/* Active Filters Display */}
          {(searchQuery || filters.category || filters.attentionLevel || filters.vibe) && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchQuery && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                  Search: &quot;{searchQuery}&quot;
                </span>
              )}
              
              {filters.category && (
                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                  Category: {filters.category.replace('-', ' ')}
                </span>
              )}
              
              {filters.attentionLevel && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                  Attention: {filters.attentionLevel.replace('-', ' ')}
                </span>
              )}
              
              {filters.vibe && (
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                  Vibe: {filters.vibe.replace('-', ' ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mb-8">
          {loading && movies.length === 0 ? (
            // Initial loading state
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Discovering amazing movies for you...</p>
              </div>
            </div>
          ) : error && movies.length === 0 ? (
            // Error state with retry
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRefetch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : movies.length === 0 ? (
            // No results state
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No movies found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
              </div>
            </div>
          ) : (
            // Movies grid with results info
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-1 text-gray-900">
                    {searchQuery ? `Search Results for &quot;${searchQuery}&quot;` : getCategoryDisplayName(filters.category)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Showing {movies.length.toLocaleString()} of {total.toLocaleString()} movies
                    {sources.supabase > 0 || sources.tmdb > 0 ? (
                      <span> • From your library: {sources.supabase} • From TMDb: {sources.tmdb}</span>
                    ) : null}
                  </p>
                </div>
                
                {error && (
                  <div className="text-amber-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Partial results shown
                  </div>
                )}
              </div>

              {/* Movies Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie) => (
                  <MovieCard 
                    key={movie.id} 
                    movie={movie}
                    showCollectionActions={true}
                  />
                ))}
              </div>

              {/* Infinite Scroll Loading Indicator */}
              {hasMore && (
                <div 
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-8 mt-8"
                >
                  {loadingMore ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading more movies...</p>
                    </div>
                  ) : (
                    <button
                      onClick={loadMoreMovies}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Load More Movies
                    </button>
                  )}
                </div>
              )}

              {/* End of Results */}
              {!hasMore && movies.length > 0 && (
                <div className="text-center py-8 mt-8">
                  <p className="text-gray-500 text-sm">
                    🎬 You&apos;ve seen all {total.toLocaleString()} movies!
                  </p>
                  <button
                    onClick={handleRefetch}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Refresh Movies
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 