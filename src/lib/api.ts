import { createClient } from './supabase/client';

const supabase = createClient();
import { tmdbClient, type TmdbMovie } from './tmdb';
import { classifyMovie, convertTmdbToVibeReelMovie } from './classify';
import type { Movie } from '@/hooks/useMovies';
import type { Database } from './supabase';

type Collection = Database['public']['Tables']['collections']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

export interface MovieFilters {
  search?: string;
  attention_level?: Movie['attention_level'] | null;
  vibe?: Movie['vibe'] | null;
  category?: 'popular' | 'now-playing' | 'upcoming' | 'top-rated' | null;
  release_year?: number;
  language?: string;
  page?: number;
  limit?: number;
}

export interface UnifiedMovieResponse {
  movies: Movie[];
  total: number;
  page: number;
  hasMore: boolean;
  sources: {
    supabase: number;
    tmdb: number;
  };
}

export interface MovieSource {
  type: 'supabase' | 'tmdb';
  movie: Movie;
  confidence?: number;
}

class UnifiedMovieAPI {
  private cache = new Map<string, { data: UnifiedMovieResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getUnifiedMovies(filters: MovieFilters = {}): Promise<UnifiedMovieResponse> {
    const cacheKey = this.generateCacheKey(filters);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log('🎯 Cache hit for unified movies');
      return cached.data;
    }

    const result = await this.fetchUnifiedMovies(filters);
    
    // Cache the result
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  }

  private async fetchUnifiedMovies(filters: MovieFilters): Promise<UnifiedMovieResponse> {
    const { limit = 20 } = filters;
    
    console.log('🔍 Fetching movies from TMDb with filters:', filters);

    // Fetch directly from TMDb only
    try {
      const tmdbResults = await this.getTmdbMovies(filters, limit);
      
      console.log('✅ TMDb movies fetched:', {
        total: tmdbResults.movies.length,
        sources: tmdbResults.sources
      });

      return tmdbResults;
    } catch (error) {
      console.error('❌ TMDb fetch failed:', error);
      throw error;
    }
  }



  private async getTmdbMovies(filters: MovieFilters): Promise<UnifiedMovieResponse> {
    const { search, category, page = 1, limit = 20 } = filters;
    
    try {
      let tmdbResponse: any = null;
      let tmdbMovies: TmdbMovie[] = [];
      
      if (search) {
        // Search TMDb for specific query
        tmdbResponse = await tmdbClient.searchMovies(search, page);
        tmdbMovies = tmdbResponse.results || [];
      } else if (category) {
        // Get movies by category
        switch (category) {
          case 'popular':
            tmdbResponse = await tmdbClient.getPopular(page);
            tmdbMovies = tmdbResponse.results || [];
            break;
          case 'now-playing':
            tmdbResponse = await tmdbClient.getNowPlaying(page);
            tmdbMovies = tmdbResponse.results || [];
            break;
          case 'upcoming':
            tmdbResponse = await tmdbClient.getUpcoming(page);
            tmdbMovies = tmdbResponse.results || [];
            break;
          case 'top-rated':
            tmdbResponse = await tmdbClient.getTopRated(page);
            tmdbMovies = tmdbResponse.results || [];
            break;
          default:
            // Fallback to popular
            tmdbResponse = await tmdbClient.getPopular(page);
            tmdbMovies = tmdbResponse.results || [];
        }
      } else {
        // Get popular movies as fallback
        tmdbResponse = await tmdbClient.getPopular(page);
        tmdbMovies = tmdbResponse.results || [];
      }

      // Take only what we need for this page
      const moviesToProcess = tmdbMovies.slice(0, limit);
      
      // Convert and classify TMDb movies
      const convertedMovies = await this.convertTmdbMovies(moviesToProcess);
      
      // Apply filters to converted movies
      const filteredMovies = this.filterTmdbMovies(convertedMovies, filters);

      console.log(`📡 TMDb returned ${filteredMovies.length} movies`);

      return {
        movies: filteredMovies,
        total: tmdbResponse?.total_results || filteredMovies.length,
        page,
        hasMore: tmdbResponse ? page < tmdbResponse.total_pages : false,
        sources: { supabase: 0, tmdb: filteredMovies.length }
      };
    } catch (error) {
      console.error('❌ TMDb fetch failed:', error);
      throw error;
    }
  }

  private async convertTmdbMovies(tmdbMovies: TmdbMovie[]): Promise<Movie[]> {
    const convertedMovies: Movie[] = [];
    
    for (const tmdbMovie of tmdbMovies) {
      try {
        // Get detailed info if needed
        let detailedMovie = tmdbMovie;
        if (!tmdbMovie.runtime) {
          try {
            detailedMovie = await tmdbClient.getMovieById(tmdbMovie.id);
          } catch (error) {
            console.log(`⚠️  Using basic info for ${tmdbMovie.title}`);
          }
        }

        // Classify and convert
        const classification = classifyMovie(detailedMovie);
        const vibeReelData = convertTmdbToVibeReelMovie(detailedMovie, classification);
        
        // Create movie object with generated UUID
        const movie: Movie = {
          id: `tmdb-${tmdbMovie.id}`, // Temporary ID for display
          created_at: new Date().toISOString(),
          ...vibeReelData
        };

        convertedMovies.push(movie);
      } catch (error) {
        console.error(`❌ Failed to convert TMDb movie ${tmdbMovie.title}:`, error);
      }
    }

    return convertedMovies;
  }

  private filterTmdbMovies(movies: Movie[], filters: MovieFilters): Movie[] {
    return movies.filter(movie => {
      if (filters.attention_level && movie.attention_level !== filters.attention_level) {
        return false;
      }
      
      if (filters.vibe && movie.vibe !== filters.vibe) {
        return false;
      }
      
      if (filters.release_year && movie.release_year !== filters.release_year) {
        return false;
      }
      
      if (filters.language && movie.language !== filters.language) {
        return false;
      }

      return true;
    });
  }



  private generateCacheKey(filters: MovieFilters): string {
    return JSON.stringify(filters);
  }

  // Get movie by ID (TMDb only)
  async getMovieById(id: string): Promise<Movie | null> {
    // Check if it's a TMDb ID
    if (id.startsWith('tmdb-')) {
      const tmdbId = parseInt(id.replace('tmdb-', ''));
      try {
        const tmdbMovie = await tmdbClient.getMovieById(tmdbId);
        const classification = classifyMovie(tmdbMovie);
        const vibeReelData = convertTmdbToVibeReelMovie(tmdbMovie, classification);
        
        return {
          id,
          created_at: new Date().toISOString(),
          ...vibeReelData
        };
      } catch (error) {
        console.error('❌ Failed to fetch TMDb movie:', error);
        return null;
      }
    }

    // Return null for non-TMDb IDs since we're TMDb-only now
    console.log('⚠️  Non-TMDb movie ID requested:', id);
    return null;
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear();
  }

  // Get health status
  async getHealthStatus(): Promise<{ supabase: boolean; tmdb: boolean }> {
    const status = { supabase: true, tmdb: false }; // Supabase still used for collections/preferences

    // Test TMDb
    try {
      await tmdbClient.getPopular(1);
      status.tmdb = true;
    } catch (error) {
      console.error('❌ TMDb health check failed:', error);
    }

    return status;
  }
}

// Singleton instance
export const unifiedMovieAPI = new UnifiedMovieAPI();

// Export main function for easy usage
export const getUnifiedMovies = (filters: MovieFilters = {}) => 
  unifiedMovieAPI.getUnifiedMovies(filters);

export const getMovieById = (id: string) => 
  unifiedMovieAPI.getMovieById(id);

export const getAPIHealthStatus = () => 
  unifiedMovieAPI.getHealthStatus();

export const api = {
  collections: {
    async getAll(userId: string) {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as Collection[];
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_movies (
            movie_id,
            movies (*)
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as Collection & {
        collection_movies: Array<{
          movie_id: string;
          movies: Movie;
        }>;
      };
    },

    async create(collection: Database['public']['Tables']['collections']['Insert']) {
      const { data, error } = await supabase
        .from('collections')
        .insert(collection)
        .select()
        .single();
      if (error) throw error;
      return data as Collection;
    },

    async addMovie(collectionId: string, movieId: string) {
      const { error } = await supabase
        .from('collection_movies')
        .insert({ collection_id: collectionId, movie_id: movieId });
      if (error) throw error;
    }
  },

  preferences: {
    async get(userId: string) {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserPreferences | null;
    },

    async update(userId: string, preferences: Partial<Database['public']['Tables']['user_preferences']['Update']>) {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...preferences })
        .select()
        .single();
      if (error) throw error;
      return data as UserPreferences;
    }
  }
}; 