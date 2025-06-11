'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Movie } from '@/hooks/useMovies';
import type { CategoryType } from '@/components/CategoryFilter';

interface FilterState {
  attentionLevel: Movie['attention_level'] | null;
  vibe: Movie['vibe'] | null;
  category: CategoryType;
  length: 'short' | 'standard' | 'long' | 'binge' | null;
  origin: 'hollywood' | 'european' | 'asian' | 'latin-american' | null;
  timePeriod: 'classic' | '2000s' | '2010s' | 'new' | null;
  rewatchability: 'high' | 'moderate' | 'low' | null;
}

interface FilterContextType {
  filters: FilterState;
  setAttentionLevel: (level: Movie['attention_level'] | null) => void;
  setVibe: (vibe: Movie['vibe'] | null) => void;
  setCategory: (category: CategoryType) => void;
  setLength: (length: FilterState['length']) => void;
  setOrigin: (origin: FilterState['origin']) => void;
  setTimePeriod: (period: FilterState['timePeriod']) => void;
  setRewatchability: (rewatch: FilterState['rewatchability']) => void;
  clearFilters: () => void;
}

const initialState: FilterState = {
  attentionLevel: null,
  vibe: null,
  category: null,
  length: null,
  origin: null,
  timePeriod: null,
  rewatchability: null,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(initialState);

  const setAttentionLevel = (level: Movie['attention_level'] | null) => {
    setFilters(prev => ({ ...prev, attentionLevel: level }));
  };

  const setVibe = (vibe: Movie['vibe'] | null) => {
    setFilters(prev => ({ ...prev, vibe }));
  };

  const setCategory = (category: CategoryType) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const setLength = (length: FilterState['length']) => {
    setFilters(prev => ({ ...prev, length }));
  };

  const setOrigin = (origin: FilterState['origin']) => {
    setFilters(prev => ({ ...prev, origin }));
  };

  const setTimePeriod = (period: FilterState['timePeriod']) => {
    setFilters(prev => ({ ...prev, timePeriod: period }));
  };

  const setRewatchability = (rewatch: FilterState['rewatchability']) => {
    setFilters(prev => ({ ...prev, rewatchability: rewatch }));
  };

  const clearFilters = () => {
    setFilters(initialState);
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setAttentionLevel,
        setVibe,
        setCategory,
        setLength,
        setOrigin,
        setTimePeriod,
        setRewatchability,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
} 