// TMDb API Integration
// Documentation: https://developer.themoviedb.org/docs

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.warn('TMDB_API_KEY not found. TMDb features will be disabled.');
}

// TypeScript interfaces for TMDb responses
export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  vote_count: number;
  video: boolean;
  vote_average: number;
  runtime?: number; // Only available in detailed responses
  genres?: TmdbGenre[]; // Only available in detailed responses
  budget?: number;
  revenue?: number;
  production_countries?: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages?: Array<{ iso_639_1: string; name: string }>;
  status?: string;
  tagline?: string;
}

export interface TmdbResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieDetails extends TmdbMovie {
  runtime: number;
  genres: TmdbGenre[];
  budget: number;
  revenue: number;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  status: string;
  tagline: string;
}

// TMDb Genre mapping for classification
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Rate limiting and caching
class TmdbApiClient {
  private lastRequestTime = 0;
  private minRequestInterval = 250; // 4 requests per second limit
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!TMDB_API_KEY) {
      throw new Error('TMDb API key not configured');
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }

    // Check cache
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.cacheTimeout) {
      console.log(`TMDb cache hit: ${cacheKey}`);
      return cached.data;
    }

    try {
      const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
      url.searchParams.append('api_key', TMDB_API_KEY);
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`TMDb API request: ${url.toString()}`);
      this.lastRequestTime = Date.now();

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`TMDb API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: now });

      return data;
    } catch (error) {
      console.error('TMDb API request failed:', error);
      throw error;
    }
  }

  // Get popular movies
  async getPopular(page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/movie/popular', { page: page.toString() });
  }

  // Get top rated movies
  async getTopRated(page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/movie/top_rated', { page: page.toString() });
  }

  // Get trending movies
  async getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>(`/trending/movie/${timeWindow}`);
  }

  // Get movie by ID with full details
  async getMovieById(id: number): Promise<TmdbMovieDetails> {
    return this.makeRequest<TmdbMovieDetails>(`/movie/${id}`);
  }

  // Search movies
  async searchMovies(query: string, page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/search/movie', { 
      query: encodeURIComponent(query),
      page: page.toString()
    });
  }

  // Get movies by genre
  async getMoviesByGenre(genreId: number, page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/discover/movie', {
      with_genres: genreId.toString(),
      page: page.toString(),
      sort_by: 'popularity.desc'
    });
  }

  // Get upcoming movies
  async getUpcoming(page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/movie/upcoming', { page: page.toString() });
  }

  // Get now playing movies
  async getNowPlaying(page = 1): Promise<TmdbResponse> {
    return this.makeRequest<TmdbResponse>('/movie/now_playing', { page: page.toString() });
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const tmdbClient = new TmdbApiClient();

// Utility functions
export const getTmdbImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'original' = 'w500'): string | null => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const formatTmdbDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Export main functions for backwards compatibility
export const getPopular = (page = 1) => tmdbClient.getPopular(page);
export const getTopRated = (page = 1) => tmdbClient.getTopRated(page);
export const getTrending = (timeWindow: 'day' | 'week' = 'week') => tmdbClient.getTrending(timeWindow);
export const getMovieById = (id: number) => tmdbClient.getMovieById(id);
export const searchMovies = (query: string, page = 1) => tmdbClient.searchMovies(query, page);
export const getMoviesByGenre = (genreId: number, page = 1) => tmdbClient.getMoviesByGenre(genreId, page);
export const getUpcoming = (page = 1) => tmdbClient.getUpcoming(page);
export const getNowPlaying = (page = 1) => tmdbClient.getNowPlaying(page); 