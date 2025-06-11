'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCollections, Collection, CollectionMovie } from '@/hooks/useCollections';
import { useAuth } from '@/context/AuthContext';
import MovieCollectionCard from '@/components/MovieCollectionCard';
import CollectionFilter from '@/components/CollectionFilter';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCollectionById, updateOverrides, removeMovieFromCollection } = useCollections();
  const { user } = useAuth();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [showOriginalTags, setShowOriginalTags] = useState(false);
  const [selectedAttention, setSelectedAttention] = useState<string[]>([]);
  const [selectedVibe, setSelectedVibe] = useState<string[]>([]);

  useEffect(() => {
    const loadCollection = async () => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }
      
      if (!params.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Loading collection:', params.id);
        const collectionData = await getCollectionById(params.id as string);
        console.log('📦 Collection data:', collectionData);
        setCollection(collectionData);
      } catch (err) {
        console.error('❌ Collection load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [user, params.id, router]);

  const handleOverrideUpdate = async (movieId: string, overrides: { attention?: string; vibe?: string[] }) => {
    if (!collection) return;
    
    try {
      await updateOverrides(collection.id, movieId, overrides);
      // Reload collection to get updated data
      const updatedCollection = await getCollectionById(collection.id);
      setCollection(updatedCollection);
    } catch (error) {
      console.error('Failed to update overrides:', error);
      throw error;
    }
  };

  // Filter movies based on current filter settings
  const getFilteredMovies = (): CollectionMovie[] => {
    if (!collection?.movies) return [];

    return collection.movies.filter((collectionMovie) => {
      const movie = collectionMovie.movies;
      
      // Get the relevant attention and vibe values based on toggle
      const relevantAttention = showOriginalTags 
        ? movie.attention_level 
        : (collectionMovie.override_attention || movie.attention_level);
      
      const relevantVibes = showOriginalTags 
        ? [movie.vibe] 
        : (collectionMovie.override_vibe?.length ? collectionMovie.override_vibe : [movie.vibe]);

      // Apply attention filter
      if (selectedAttention.length > 0 && !selectedAttention.includes(relevantAttention)) {
        return false;
      }

      // Apply vibe filter
      if (selectedVibe.length > 0 && !relevantVibes.some(vibe => selectedVibe.includes(vibe))) {
        return false;
      }

      return true;
    });
  };

  if (!user) {
    return null; // Navigation is handled in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md">
                  <div className="aspect-[2/3] bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h1 className="text-xl font-semibold text-gray-700 mb-2">Collection Not Found</h1>
              <p className="text-gray-600 mb-6">{error || "The collection you're looking for doesn't exist."}</p>
              <button
                onClick={() => router.push('/collections')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go back to collections
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredMovies = getFilteredMovies();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/collections" className="hover:text-gray-900 transition-colors">
              Collections
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900">{collection.title}</span>
          </nav>
        </div>

        {/* Collection Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{collection.title}</h1>
              {collection.description && (
                <p className="text-xl text-gray-600 mb-3">{collection.description}</p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              collection.type === 'occasion' ? 'bg-blue-100 text-blue-800' :
              collection.type === 'mood' ? 'bg-green-100 text-green-800' :
              collection.type === 'project' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {collection.type}
            </span>
          </div>
          
          {/* Collection Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l.938 10.36a1 1 0 01-.992 1.14H7.054a1 1 0 01-.992-1.14L7 4z" />
                </svg>
                <span>
                  {collection.movies?.length || 0} {collection.movies?.length === 1 ? 'movie' : 'movies'}
                </span>
              </div>
              {filteredMovies.length !== (collection.movies?.length || 0) && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>{filteredMovies.length} showing</span>
                </div>
              )}
            </div>
            
            <Link
              href="/discover"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Add more movies →
            </Link>
          </div>
        </div>

        {/* Collection Filter */}
        {collection.movies && collection.movies.length > 0 && (
          <CollectionFilter
            showOriginalTags={showOriginalTags}
            onShowOriginalTagsChange={setShowOriginalTags}
            selectedAttention={selectedAttention}
            onAttentionChange={setSelectedAttention}
            selectedVibe={selectedVibe}
            onVibeChange={setSelectedVibe}
          />
        )}

        {/* Movies Section */}
        <div className="mb-8">
          {filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              {collection.movies?.length === 0 ? (
                // Empty collection state
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a1 1 0 011-1h6a1 1 0 011 1v2M7 7h10" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Your collection is empty</h3>
                  <p className="text-gray-600 mb-6">Start adding movies to personalize this collection</p>
                  <Link
                    href="/discover"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Browse Movies
                  </Link>
                </div>
              ) : (
                // No results after filtering state
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No movies match your filters</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filter settings</p>
                  <button
                    onClick={() => {
                      setSelectedAttention([]);
                      setSelectedVibe([]);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {filteredMovies.length === collection.movies?.length 
                    ? 'All Movies' 
                    : `${filteredMovies.length} of ${collection.movies?.length} Movies`
                  }
                </h2>
              </div>

              {/* Movies Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMovies.map((collectionMovie) => (
                  <MovieCollectionCard
                    key={collectionMovie.movies.id}
                    collectionMovie={collectionMovie}
                    onOverrideUpdate={handleOverrideUpdate}
                    showOriginalTags={showOriginalTags}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 