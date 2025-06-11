'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCollections } from '@/hooks/useCollections';
import { useAuth } from '@/context/AuthContext';
import { getMovieById } from '@/lib/api';
import type { Movie } from '@/hooks/useMovies';
import { getAttentionLevelIcon } from '@/lib/attentionLevels';
import { VIBES } from '@/lib/filters';
import RecommendationsSection from '@/components/RecommendationsSection';

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { collections, addMovieToCollection } = useCollections();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const movieData = await getMovieById(params.id as string);
        if (!movieData) {
          throw new Error('Movie not found');
        }
        
        setMovie(movieData);
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch movie');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMovie();
    }
  }, [params.id]);

  const handleAddToCollection = async (collectionId: string) => {
    if (!movie || !user) return;
    
    try {
      setIsAdding(true);
      await addMovieToCollection(collectionId, movie.id);
      setIsDropdownOpen(false);
      // Could add a success toast notification here
    } catch (error) {
      console.error('Failed to add movie to collection:', error);
      // Could add an error toast notification here
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="aspect-[2/3] bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || 'Movie not found'}
            </h1>
            <p className="text-gray-600 mb-4">
              The movie you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="text-blue-500 hover:text-blue-600"
            >
              Browse other movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vibeInfo = VIBES.find(v => v.id === movie.vibe);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Movie Poster */}
        <div className="lg:col-span-1">
          <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
            {movie.image_url ? (
              <img
                src={movie.image_url}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                🎬
              </div>
            )}
          </div>
        </div>

        {/* Movie Details */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold flex-1">{movie.title}</h1>
            <button
              onClick={() => router.back()}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* VibeReel Classification */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">VibeReel Classification</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {getAttentionLevelIcon(movie.attention_level)} {movie.attention_level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {vibeInfo?.icon} {vibeInfo?.name}
              </span>
            </div>
          </div>

          {/* Movie Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {movie.release_year && (
              <div>
                <span className="text-sm font-medium text-gray-500">Release Year</span>
                <p className="text-gray-900">{movie.release_year}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-500">Runtime</span>
              <p className="text-gray-900">{movie.runtime} minutes</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Language</span>
              <p className="text-gray-900">{movie.language}</p>
            </div>
          </div>

          {/* Description */}
          {movie.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Overview</h2>
              <p className="text-gray-600 leading-relaxed">{movie.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isAdding}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isAdding ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Collection
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 py-2 border">
                    <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                      Add to Collection
                    </div>
                    {collections.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No collections yet.{' '}
                        <button
                          onClick={() => router.push('/collections')}
                          className="text-blue-500 hover:text-blue-600 underline"
                        >
                          Create one
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        {collections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => handleAddToCollection(collection.id)}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">{collection.title}</div>
                              <div className="text-xs text-gray-500 capitalize">{collection.type}</div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {collection.movies?.length || 0} movies
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!user && (
              <button
                onClick={() => router.push('/auth/signin')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in to Add to Collection
              </button>
            )}

            <button
              onClick={() => navigator.share ? navigator.share({
                title: movie.title,
                text: movie.description,
                url: window.location.href
              }) : navigator.clipboard.writeText(window.location.href)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Recommendations Section */}
      <div className="border-t border-gray-200 mt-12 pt-8">
        <RecommendationsSection movie={movie} />
      </div>
    </div>
  );
} 