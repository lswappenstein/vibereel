'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Movie } from '@/hooks/useMovies';
import type { CategoryType } from '@/components/CategoryFilter';

const categories = [
  { value: 'popular' as const, label: 'Popular', icon: '🔥' },
  { value: 'now-playing' as const, label: 'Now Playing', icon: '🎬' },
  { value: 'upcoming' as const, label: 'Upcoming', icon: '📅' },
  { value: 'top-rated' as const, label: 'Top Rated', icon: '⭐' },
];

const attentionLevels = [
  { value: 'deep-dive' as const, label: 'Deep Dive', icon: '🧠' },
  { value: 'immersive' as const, label: 'Immersive', icon: '🎯' },
  { value: 'casual-watch' as const, label: 'Casual Watch', icon: '👀' },
  { value: 'background-comfort' as const, label: 'Background Comfort', icon: '☁️' },
  { value: 'zone-off' as const, label: 'Zone Off', icon: '💤' },
];

const vibes = [
  { value: 'uplifting' as const, label: 'Uplifting', icon: '☀️' },
  { value: 'feel-good' as const, label: 'Feel Good', icon: '😊' },
  { value: 'melancholic' as const, label: 'Melancholic', icon: '🌧️' },
  { value: 'mind-bending' as const, label: 'Mind Bending', icon: '🌀' },
  { value: 'dark' as const, label: 'Dark', icon: '🌑' },
];

export default function HomepageFilterBar() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryType>(null);
  const [attentionLevel, setAttentionLevel] = useState<Movie['attention_level'] | null>(null);
  const [vibe, setVibe] = useState<Movie['vibe'] | null>(null);

  const handleDiscover = () => {
    const params = new URLSearchParams();
    
    if (category) {
      params.set('category', category);
    }
    if (attentionLevel) {
      params.set('attention_level', attentionLevel);
    }
    if (vibe) {
      params.set('vibe', vibe);
    }

    const queryString = params.toString();
    const url = queryString ? `/discover?${queryString}` : '/discover';
    
    router.push(url);
  };

  return (
    <section className="pt-6 pb-8 bg-white border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Filter by Your Preferences
          </h2>
          <p className="text-gray-600">
            Select one or more filters to find exactly what you&apos;re looking for
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category || ''}
              onChange={(e) => setCategory(e.target.value as CategoryType || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Attention Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attention Level
            </label>
            <select
              value={attentionLevel || ''}
              onChange={(e) => setAttentionLevel(e.target.value as Movie['attention_level'] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Any Level</option>
              {attentionLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.icon} {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vibe Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vibe
            </label>
            <select
              value={vibe || ''}
              onChange={(e) => setVibe(e.target.value as Movie['vibe'] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Any Vibe</option>
              {vibes.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleDiscover}
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            🔍 Discover Movies
          </button>
        </div>
      </div>
    </section>
  );
} 