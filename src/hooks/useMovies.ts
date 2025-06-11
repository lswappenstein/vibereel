import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Movie {
  id: string;
  title: string;
  attention_level: 'deep-dive' | 'immersive' | 'casual-watch' | 'background-comfort' | 'zone-off';
  vibe: 'uplifting' | 'melancholic' | 'dark' | 'feel-good' | 'mind-bending';
  image_url: string | null;
  description: string;
  runtime: number;
  language: string;
  release_year: number;
  created_at: string;
  genres?: string[]; // Array of genre names for display
}

// Create the client once outside the hook
const supabase = createClient();

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async (filters?: {
    attentionLevel?: Movie['attention_level'] | null;
    vibe?: Movie['vibe'] | null;
  }) => {
    try {
      console.log('fetchMovies called with filters:', filters);
      setLoading(true);
      setError(null);

      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.attentionLevel) {
        console.log('Adding attention level filter:', filters.attentionLevel);
        query = query.eq('attention_level', filters.attentionLevel);
      }

      if (filters?.vibe) {
        console.log('Adding vibe filter:', filters.vibe);
        query = query.eq('vibe', filters.vibe);
      }

      console.log('Executing Supabase query...');
      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      console.log('Supabase query successful. Found movies:', data?.length || 0);
      setMovies((data || []) as unknown as Movie[]);
      
      if (data?.length === 0) {
        console.log('No movies found with current filters');
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching movies';
      setError(errorMessage);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMovies = useCallback(async (searchTerm: string, filters?: {
    attentionLevel?: Movie['attention_level'] | null;
    vibe?: Movie['vibe'] | null;
  }) => {
    try {
      console.log('searchMovies called with:', { searchTerm, filters });
      setLoading(true);
      setError(null);

      let query = supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters first
      if (filters?.attentionLevel) {
        console.log('Adding attention level filter:', filters.attentionLevel);
        query = query.eq('attention_level', filters.attentionLevel);
      }

      if (filters?.vibe) {
        console.log('Adding vibe filter:', filters.vibe);
        query = query.eq('vibe', filters.vibe);
      }

      // Then apply search conditions
      if (searchTerm.trim()) {
        console.log('Adding search filter for term:', searchTerm);
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      console.log('Executing Supabase search query...');
      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error('Supabase search error:', supabaseError);
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      console.log('Supabase search successful. Found movies:', data?.length || 0);
      setMovies((data || []) as unknown as Movie[]);
    } catch (err) {
      console.error('Error searching movies:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while searching movies';
      setError(errorMessage);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    movies,
    loading,
    error,
    fetchMovies,
    searchMovies,
  };
} 