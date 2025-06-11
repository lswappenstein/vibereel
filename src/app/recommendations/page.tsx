'use client';

import { useRecommendations } from '@/context/RecommendationContext';
import { useAuth } from '@/context/AuthContext';
import MovieCard from '@/components/MovieCard';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { recommendedMovies, loading, error, refreshRecommendations } = useRecommendations();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in for Personalized Recommendations</h1>
          <p className="text-gray-600 mb-6">
            Create an account or sign in to get movie recommendations tailored to your taste.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Recommendations</h1>
          <p className="text-gray-600 mt-2">
            Movies and shows picked just for you based on your preferences and collections.
          </p>
        </div>
        <button
          onClick={() => refreshRecommendations()}
          className="text-blue-500 hover:text-blue-600"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading recommendations</p>
          <button
            onClick={() => refreshRecommendations()}
            className="text-blue-500 hover:text-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : recommendedMovies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Add some movies to your collections to get personalized recommendations.
          </p>
          <Link
            href="/discover"
            className="text-blue-500 hover:text-blue-600"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              showCollectionActions={true}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How Recommendations Work</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-4">
            Your recommendations are based on:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Movies in your collections</li>
            <li>Your preferred attention levels</li>
            <li>Your favorite vibes and moods</li>
            <li>Viewing patterns and interactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 