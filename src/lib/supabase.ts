import { createClient } from '@supabase/supabase-js';

// Only check environment variables at runtime, not during build
const createSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
    }
    return null as any;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return null as any;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export const supabase = createSupabaseClient();

export type Database = {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string;
          title: string;
          attention_level: string;
          vibe: string;
          image_url: string | null;
          description: string;
          runtime: number;
          language: string;
          release_year: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['movies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['movies']['Insert']>;
      };
      collections: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'occasion' | 'mood' | 'project' | 'archive';
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
      };
      collection_movies: {
        Row: {
          collection_id: string;
          movie_id: string;
          added_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collection_movies']['Row'], 'added_at'>;
        Update: Partial<Database['public']['Tables']['collection_movies']['Insert']>;
      };
      user_preferences: {
        Row: {
          user_id: string;
          preferred_attention_level: string | null;
          preferred_vibes: string[];
          preferred_languages: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
    };
  };
}; 