import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Movie } from '@/hooks/useMovies';

export interface CollectionMovie {
  collection_id: string;
  movie_id: string;
  added_at: string;
  override_attention?: string;
  override_vibe?: string[];
  movies: Movie;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  type: 'occasion' | 'mood' | 'project' | 'archive';
  movies?: CollectionMovie[];
}

export function useCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const getUserCollections = async (): Promise<Collection[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('collections')
        .select(`
          *,
          collection_movies (
            collection_id,
            movie_id,
            added_at,
            override_attention,
            override_vibe,
            movies:movies(*)
          )
        `)
        .eq('user_id', user.id);

      if (supabaseError) {
        throw supabaseError;
      }

      const collectionsWithMovies = (data || []).map((collection: any) => ({
        ...collection,
        movies: collection.collection_movies || [],
      })) as Collection[];

      setCollections(collectionsWithMovies);
      return collectionsWithMovies;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch collections');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCollectionById = async (id: string): Promise<Collection | null> => {
    if (!user) return null;
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('collections')
        .select(`
          *,
          collection_movies (
            collection_id,
            movie_id,
            added_at,
            override_attention,
            override_vibe,
            movies:movies(*)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return {
        ...data,
        movies: data.collection_movies || [],
      } as Collection;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch collection');
      setError(error);
      throw error;
    }
  };

  const createCollection = async (
    name: string,
    description: string,
    type: Collection['type']
  ): Promise<Collection> => {
    if (!user) {
      throw new Error('You must be logged in to create collections');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('collections')
        .insert([{
          title: name.trim(),
          description: description.trim(),
          type,
          user_id: user.id,
        }])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const newCollection = { ...data, movies: [] };
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create collection');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to delete collections');
    }

    try {
      const { error: supabaseError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (supabaseError) {
        throw supabaseError;
      }

      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete collection');
      setError(error);
      throw error;
    }
  };

  const addMovieToCollection = async (collectionId: string, movieId: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to add movies to collections');
    }

    try {
      console.log('🎬 Adding movie to collection:', { collectionId, movieId });
      
      // First, get the movie data to ensure we have all the details
      const { getMovieById } = await import('@/lib/api');
      const movieData = await getMovieById(movieId);
      
      if (!movieData) {
        throw new Error('Movie not found');
      }
      
      console.log('🎬 Movie data retrieved:', movieData.title);

      // Check if movie already exists in our database by external_id
      const { data: existingMovie } = await supabase
        .from('movies')
        .select('id')
        .eq('external_id', movieId)
        .single();

      let dbMovieId = movieId;

      // If movie doesn't exist in our database, create it with a generated UUID
      if (!existingMovie) {
        const { data: insertedMovie, error: insertError } = await supabase
          .from('movies')
          .insert({
            // Let Supabase generate the UUID automatically
            external_id: movieId, // Store the TMDb ID as external reference
            title: movieData.title,
            attention_level: movieData.attention_level,
            vibe: movieData.vibe,
            image_url: movieData.image_url,
            description: movieData.description,
            runtime: movieData.runtime,
            language: movieData.language,
            release_year: movieData.release_year,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting movie:', insertError);
          throw insertError;
        }

        dbMovieId = insertedMovie?.id as string;
      }

      // Now add to collection using the database movie ID
      const { error: supabaseError } = await supabase
        .from('collection_movies')
        .insert({
          collection_id: collectionId,
          movie_id: dbMovieId,
        });

      if (supabaseError) {
        // If it's a duplicate key error, that's actually fine
        if (supabaseError.code === '23505') {
          console.log('Movie already in collection');
          return;
        }
        throw supabaseError;
      }

      // Refresh collections to get updated data
      await getUserCollections();
    } catch (err) {
      console.error('Error in addMovieToCollection:', err);
      const error = err instanceof Error ? err : new Error('Failed to add movie to collection');
      setError(error);
      throw error;
    }
  };

  const removeMovieFromCollection = async (collectionId: string, movieId: string): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to remove movies from collections');
    }

    try {
      const { error: supabaseError } = await supabase
        .from('collection_movies')
        .delete()
        .eq('collection_id', collectionId)
        .eq('movie_id', movieId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Refresh collections to get updated data
      await getUserCollections();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove movie from collection');
      setError(error);
      throw error;
    }
  };

  const updateOverrides = async (
    collectionId: string,
    movieId: string,
    overrides: { attention?: string; vibe?: string[] }
  ): Promise<void> => {
    if (!user) {
      throw new Error('You must be logged in to update overrides');
    }

    try {
      const updateData: any = {};
      if (overrides.attention !== undefined) {
        updateData.override_attention = overrides.attention;
      }
      if (overrides.vibe !== undefined) {
        updateData.override_vibe = overrides.vibe;
      }

      const { error: supabaseError } = await supabase
        .from('collection_movies')
        .update(updateData)
        .eq('collection_id', collectionId)
        .eq('movie_id', movieId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Refresh collections to get updated data
      await getUserCollections();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update overrides');
      setError(error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      getUserCollections();
    } else {
      setCollections([]);
    }
  }, [user]);

  return {
    collections,
    loading,
    error,
    getUserCollections,
    getCollectionById,
    createCollection,
    deleteCollection,
    addMovieToCollection,
    removeMovieFromCollection,
    updateOverrides,
    refreshCollections: getUserCollections,
  };
} 