'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { Movie } from '@/hooks/useMovies';

interface Collection {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  type: 'occasion' | 'mood' | 'project' | 'archive';
  movies?: Movie[];
}

interface CollectionMovie {
  collection_id: string;
  movie_id: string;
  added_at: string;
  override_attention?: string;
  override_vibe?: string[];
  movies: Movie;
}

interface CollectionWithJoins extends Omit<Collection, 'movies'> {
  collection_movies: CollectionMovie[];
}

interface CollectionContextType {
  collections: Collection[];
  loading: boolean;
  error: Error | null;
  createCollection: (title: string, description: string, type: Collection['type']) => Promise<Collection>;
  addMovieToCollection: (collectionId: string, movieId: string) => Promise<void>;
  refreshCollections: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchCollections = async () => {
    if (!user || !session) {
      setCollections([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching collections for user:', user.id);
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
        console.error('Error fetching collections:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        console.log('No collections found for user');
        setCollections([]);
        return;
      }

      console.log('Fetched collections:', data);
      // @ts-ignore - Complex Supabase join type, safe to cast
      const collectionsWithMovies = (data as any[]).map((collection: any) => ({
        ...collection,
        movies: collection.collection_movies?.map((cm: any) => cm.movies) || [],
      })) as Collection[];

      setCollections(collectionsWithMovies);
      setError(null);
    } catch (err) {
      console.error('Error in fetchCollections:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch collections'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CollectionProvider useEffect - user changed:', user?.id);
    fetchCollections();
  }, [user, session]);

  const createCollection = async (
    title: string,
    description: string,
    type: Collection['type']
  ): Promise<Collection> => {
    console.log('Starting collection creation with params:', { title, description, type });
    setLoading(true);
    setError(null);
    
    if (!user || !session) {
      const error = new Error('You must be logged in to create collections');
      console.error('No user or session found in createCollection');
      setError(error);
      setLoading(false);
      throw error;
    }

    try {
      const collectionData = {
        title: title.trim(),
        description: description.trim(),
        type,
        user_id: user.id,
      };
      
      console.log('Attempting to create collection with data:', collectionData);

      const { data, error: insertError } = await supabase
        .from('collections')
        .insert([collectionData])
        .select();

      if (insertError) {
        console.error('Supabase error creating collection:', insertError);
        let errorMessage = 'Failed to create collection';
        
        if (insertError.code === '42501') {
          errorMessage = 'You do not have permission to create collections';
        } else if (insertError.code === '23505') {
          errorMessage = 'A collection with this title already exists';
        } else {
          errorMessage = `Error creating collection: ${insertError.message}`;
        }
        
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      }

      if (!data || data.length === 0) {
        const error = new Error('Failed to create collection: No data returned');
        console.error('No data returned from collection creation');
        setError(error);
        throw error;
      }

      console.log('Collection created successfully:', data[0]);
      
      const newCollection = { ...data[0], movies: [] } as Collection;
      setCollections(prev => [...prev, newCollection]);
      setError(null);
      return newCollection;
    } catch (err) {
      console.error('Error in createCollection:', err);
      const error = err instanceof Error ? err : new Error('Failed to create collection');
      setError(error);
      throw error;
    } finally {
      console.log('Finishing collection creation attempt');
      setLoading(false);
    }
  };

  const addMovieToCollection = async (collectionId: string, movieId: string) => {
    if (!user || !session) {
      throw new Error('You must be logged in to add movies to collections');
    }

    try {
      console.log('Adding movie to collection:', { collectionId, movieId });
      const { error: supabaseError } = await supabase
        .from('collection_movies')
        .insert({
          collection_id: collectionId,
          movie_id: movieId,
        });

      if (supabaseError) {
        console.error('Error adding movie to collection:', supabaseError);
        throw supabaseError;
      }

      await fetchCollections();
    } catch (err) {
      console.error('Error in addMovieToCollection:', err);
      throw err instanceof Error ? err : new Error('Failed to add movie to collection');
    }
  };

  const refreshCollections = async () => {
    console.log('Refreshing collections...');
    setLoading(true);
    await fetchCollections();
  };

  return (
    <CollectionContext.Provider
      value={{
        collections,
        loading,
        error,
        createCollection,
        addMovieToCollection,
        refreshCollections,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionProvider');
  }
  return context;
} 