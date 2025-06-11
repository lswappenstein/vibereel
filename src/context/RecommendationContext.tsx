'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useCollections } from './CollectionContext';
import type { Movie } from '@/hooks/useMovies';
import { createClient } from '@/lib/supabase/client';

interface RecommendationContextType {
  recommendedMovies: Movie[];
  loading: boolean;
  error: Error | null;
  refreshRecommendations: () => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(undefined);

export function RecommendationProvider({ children }: { children: ReactNode }) {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { collections } = useCollections();
  const supabase = createClient();

  const calculateMovieScore = (movie: Movie, userPreferences: {
    attentionLevels: { [key: string]: number },
    vibes: { [key: string]: number }
  }) => {
    let score = 0;

    // Score based on attention level preference
    if (userPreferences.attentionLevels[movie.attention_level]) {
      score += userPreferences.attentionLevels[movie.attention_level];
    }

    // Score based on vibe preference
    if (userPreferences.vibes[movie.vibe]) {
      score += userPreferences.vibes[movie.vibe];
    }

    return score;
  };

  const analyzeUserPreferences = () => {
    const preferences = {
      attentionLevels: {} as { [key: string]: number },
      vibes: {} as { [key: string]: number }
    };

    // Analyze movies in user's collections
    collections.forEach(collection => {
      collection.movies?.forEach(movie => {
        // Count attention level preferences
        preferences.attentionLevels[movie.attention_level] = 
          (preferences.attentionLevels[movie.attention_level] || 0) + 1;

        // Count vibe preferences
        preferences.vibes[movie.vibe] = 
          (preferences.vibes[movie.vibe] || 0) + 1;
      });
    });

    return preferences;
  };

  const fetchRecommendations = async () => {
    if (!user) {
      setRecommendedMovies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all available movies
      const { data: allMovies, error: moviesError } = await supabase
        .from('movies')
        .select('*');

      if (moviesError) throw moviesError;

      // Get user's watched/saved movies
      const { data: userMovies, error: userMoviesError } = await supabase
        .from('user_movies')
        .select('movie_id')
        .eq('user_id', user.id);

      if (userMoviesError) throw userMoviesError;

      // Filter out movies the user has already interacted with
      const watchedMovieIds = new Set(userMovies.map(um => um.movie_id));
      const unwatchedMovies = allMovies.filter(movie => !watchedMovieIds.has(movie.id));

      // Analyze user preferences
      const userPreferences = analyzeUserPreferences();

      // Score and sort movies
      const scoredMovies = unwatchedMovies.map(movie => ({
        movie,
        score: calculateMovieScore(movie, userPreferences)
      }));

      scoredMovies.sort((a, b) => b.score - a.score);

      // Take top 10 recommendations
      setRecommendedMovies(scoredMovies.slice(0, 10).map(sm => sm.movie));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user, collections]);

  const refreshRecommendations = async () => {
    await fetchRecommendations();
  };

  return (
    <RecommendationContext.Provider
      value={{
        recommendedMovies,
        loading,
        error,
        refreshRecommendations
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationProvider');
  }
  return context;
} 