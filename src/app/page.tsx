'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ATTENTION_LEVELS } from '@/lib/attentionLevels';
import { VIBES } from '@/lib/filters';
import SearchBar from '@/components/SearchBar';
import HomepageFilterBar from '@/components/HomepageFilterBar';

export default function Home() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/discover?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Match Your Movie to Your{' '}
          <span className="text-blue-600">Mood</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Not all movies are meant to be watched the same way. Find the perfect content
          based on your attention level and current vibe.
        </p>
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search movies by title, vibe, or attention level..."
          />
        </div>
      </section>

      {/* Filter Bar Section */}
      <HomepageFilterBar />

      {/* Attention Spectrum & Vibe Levels Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-12">
          How VibeReel Works
        </h2>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Attention Spectrum Column */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-center">
                <span className="text-blue-600">🎯</span> The Attention Spectrum
              </h3>
              <div className="space-y-6">
                {ATTENTION_LEVELS.map((level) => (
                  <div
                    key={level.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl flex-shrink-0">{level.icon}</div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2">{level.name}</h4>
                        <p className="text-gray-600 text-sm">{level.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibe Levels Column */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-center">
                <span className="text-purple-600">💫</span> Vibe Levels
              </h3>
              <div className="space-y-6">
                {VIBES.map((vibe) => (
                  <div
                    key={vibe.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl flex-shrink-0">{vibe.icon}</div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2">{vibe.name}</h4>
                        <p className="text-gray-600 text-sm">{vibe.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/collections/friday-night"
              className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
                  Friday Night Deep Dive
                </h3>
                <p className="text-gray-600">
                  Thought-provoking films that demand your full attention
                </p>
              </div>
            </Link>
            <Link 
              href="/collections/sunday-comfort"
              className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600">
                  Sunday Comfort Zone
                </h3>
                <p className="text-gray-600">
                  Easy-watching favorites perfect for relaxation
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16">
        <h2 className="text-3xl font-bold mb-6">
          Ready to find your perfect watch?
        </h2>
        <Link
          href="/discover"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Start Discovering
        </Link>
      </section>
    </div>
  );
}
