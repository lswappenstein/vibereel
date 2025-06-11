import { getUnifiedMovies } from './api';
import type { Movie } from '@/hooks/useMovies';

export interface RecommendationFilters {
  excludeMovieId: string;
  genres?: string[];
  attention_level?: Movie['attention_level'];
  vibe?: Movie['vibe'];
  limit?: number;
}

export async function getSimilarMovies(movie: Movie, limit: number = 6): Promise<Movie[]> {
  const similarMovies: Movie[] = [];
  const seenMovieIds = new Set<string>([movie.id]);

  try {
    // Strategy 1: Same genre movies
    if (movie.genres && movie.genres.length > 0) {
      console.log(`🎯 Finding movies with similar genres: ${movie.genres.join(', ')}`);
      
      // Try to find movies from popular/top-rated categories that might share genres
      const genreResults = await getUnifiedMovies({
        category: 'popular',
        limit: 20
      });

      // Filter for movies that share at least one genre
      const genreMatches = genreResults.movies.filter(m => {
        if (seenMovieIds.has(m.id)) return false;
        if (!m.genres || m.genres.length === 0) return false;
        
        // Check if there's any overlap in genres
        const hasSharedGenre = m.genres.some(genre => movie.genres?.includes(genre));
        return hasSharedGenre;
      });

      // Add genre matches with preference for more shared genres
      genreMatches
        .sort((a, b) => {
          const aSharedGenres = a.genres?.filter(g => movie.genres?.includes(g)).length || 0;
          const bSharedGenres = b.genres?.filter(g => movie.genres?.includes(g)).length || 0;
          return bSharedGenres - aSharedGenres;
        })
        .slice(0, 3)
        .forEach(m => {
          similarMovies.push(m);
          seenMovieIds.add(m.id);
        });
    }

    // Strategy 2: Same attention level
    if (similarMovies.length < limit) {
      console.log(`🎯 Finding movies with same attention level: ${movie.attention_level}`);
      
      const attentionResults = await getUnifiedMovies({
        attention_level: movie.attention_level,
        category: 'top-rated',
        limit: 15
      });

      attentionResults.movies
        .filter(m => !seenMovieIds.has(m.id))
        .slice(0, limit - similarMovies.length)
        .forEach(m => {
          similarMovies.push(m);
          seenMovieIds.add(m.id);
        });
    }

    // Strategy 3: Same vibe
    if (similarMovies.length < limit) {
      console.log(`🎯 Finding movies with same vibe: ${movie.vibe}`);
      
      const vibeResults = await getUnifiedMovies({
        vibe: movie.vibe,
        category: 'popular',
        limit: 15
      });

      vibeResults.movies
        .filter(m => !seenMovieIds.has(m.id))
        .slice(0, limit - similarMovies.length)
        .forEach(m => {
          similarMovies.push(m);
          seenMovieIds.add(m.id);
        });
    }

    // Strategy 4: Fill remaining with popular movies if needed
    if (similarMovies.length < limit) {
      console.log('🎯 Filling remaining slots with popular movies');
      
      const popularResults = await getUnifiedMovies({
        category: 'popular',
        limit: 20
      });

      popularResults.movies
        .filter(m => !seenMovieIds.has(m.id))
        .slice(0, limit - similarMovies.length)
        .forEach(m => {
          similarMovies.push(m);
          seenMovieIds.add(m.id);
        });
    }

    console.log(`✅ Found ${similarMovies.length} similar movies for "${movie.title}"`);
    return similarMovies.slice(0, limit);

  } catch (error) {
    console.error('❌ Error fetching similar movies:', error);
    return [];
  }
}

export function getRecommendationReason(originalMovie: Movie, recommendedMovie: Movie): string {
  const reasons: string[] = [];

  // Check for shared genres
  if (originalMovie.genres && recommendedMovie.genres) {
    const sharedGenres = originalMovie.genres.filter(g => recommendedMovie.genres?.includes(g));
    if (sharedGenres.length > 0) {
      reasons.push(`Shared genres: ${sharedGenres.slice(0, 2).join(', ')}`);
    }
  }

  // Check for same attention level
  if (originalMovie.attention_level === recommendedMovie.attention_level) {
    const attentionLabel = originalMovie.attention_level
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    reasons.push(`Same attention level: ${attentionLabel}`);
  }

  // Check for same vibe
  if (originalMovie.vibe === recommendedMovie.vibe) {
    reasons.push(`Same vibe: ${originalMovie.vibe}`);
  }

  return reasons.length > 0 ? reasons[0] : 'Popular pick';
} 