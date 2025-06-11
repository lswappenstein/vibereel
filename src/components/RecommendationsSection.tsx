'use client';

import { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { getSimilarMovies, getRecommendationReason } from '@/lib/recommendations';
import type { Movie } from '@/hooks/useMovies';

interface RecommendationsSectionProps {
  movie: Movie;
}

export default function RecommendationsSection({ movie }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!movie) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 Fetching recommendations for: ${movie.title}`);
        const similarMovies = await getSimilarMovies(movie, 6);
        
        setRecommendations(similarMovies);
        console.log(`✅ Loaded ${similarMovies.length} recommendations`);
      } catch (err) {
        console.error('❌ Error fetching recommendations:', err);
        setError('Failed to load recommendations');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [movie]);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">You might also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">You might also like</h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a1 1 0 011-1h6a1 1 0 011 1v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-600">
            {error || 'No recommendations available at the moment'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">You might also like</h2>
        <p className="text-sm text-gray-500">
          Based on genres, vibe, and attention level
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {recommendations.map((recommendedMovie) => {
          const reason = getRecommendationReason(movie, recommendedMovie);
          
          return (
            <div key={recommendedMovie.id} className="group">
              <MovieCard 
                movie={recommendedMovie} 
                showCollectionActions={true}
              />
              
              {/* Recommendation reason tooltip */}
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-gray-500 text-center px-2">
                  {reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Refresh recommendations
          </button>
        </div>
      )}
    </div>
  );
} 