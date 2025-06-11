'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Movie } from '@/hooks/useMovies';
import { getAttentionLevelIcon } from '@/lib/attentionLevels';
import { VIBES } from '@/lib/filters';
import { useCollections } from '@/hooks/useCollections';

interface MovieCardProps {
  movie: Movie;
  showCollectionActions?: boolean;
}

export default function MovieCard({ movie, showCollectionActions = false }: MovieCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { collections, addMovieToCollection } = useCollections();
  const vibeInfo = VIBES.find(v => v.id === movie.vibe);

  const handleAddToCollection = async (collectionId: string) => {
    try {
      setIsAdding(true);
      await addMovieToCollection(collectionId, movie.id);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to add movie to collection:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative">
      <Link 
        href={`/movies/${movie.id}`}
        className="block rounded-lg shadow-md overflow-hidden bg-white hover:shadow-lg transition-shadow"
      >
        <div className="relative aspect-[2/3] bg-gray-200">
          {movie.image_url ? (
            <img
              src={movie.image_url}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">
              🎬
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-3">{movie.title}</h3>
          
          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {movie.genres.slice(0, 3).map((genre, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {genre}
                </span>
              ))}
              {movie.genres.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                  +{movie.genres.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* VibeReel Classifications */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
              {getAttentionLevelIcon(movie.attention_level)} {movie.attention_level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            <span className="inline-flex items-center px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded">
              {vibeInfo?.icon} {vibeInfo?.name}
            </span>
          </div>
        </div>
      </Link>

      {showCollectionActions && (
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isAdding}
              className={`p-2 bg-white rounded-full shadow-md hover:bg-gray-50 ${
                isAdding ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 py-2">
                <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                  Add to Collection
                </div>
                {collections.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No collections yet.{' '}
                    <Link href="/collections/new" className="text-blue-500 hover:text-blue-600">
                      Create one
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {collections.map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => handleAddToCollection(collection.id)}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 focus:outline-none"
                      >
                        {collection.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 