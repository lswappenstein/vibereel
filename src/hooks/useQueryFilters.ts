'use client';

import { useSearchParams } from 'next/navigation';
import type { Movie } from '@/hooks/useMovies';
import type { CategoryType } from '@/components/CategoryFilter';

export interface QueryFilters {
  category: CategoryType;
  attention_level: Movie['attention_level'] | null;
  vibe: Movie['vibe'] | null;
  search?: string;
}

export function useQueryFilters(): QueryFilters {
  const searchParams = useSearchParams();

  const category = searchParams?.get('category') as CategoryType || null;
  const attention_level = searchParams?.get('attention_level') as Movie['attention_level'] || null;
  const vibe = searchParams?.get('vibe') as Movie['vibe'] || null;
  const search = searchParams?.get('search') || undefined;

  return {
    category,
    attention_level,
    vibe,
    search,
  };
} 