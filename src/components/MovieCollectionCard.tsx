import { FC, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Movie } from '@/hooks/useMovies';
import { CollectionMovie } from '@/hooks/useCollections';
import { getAttentionLevelIcon, ATTENTION_LEVELS as ATTENTION_LEVEL_DATA } from '@/lib/attentionLevels';
import { VIBES } from '@/lib/filters';

interface MovieCollectionCardProps {
  collectionMovie: CollectionMovie;
  onOverrideUpdate: (movieId: string, overrides: { attention?: string; vibe?: string[] }) => Promise<void>;
  showOriginalTags?: boolean;
}

const ATTENTION_LEVELS = [
  { value: 'casual-watch', label: 'Casual Watch', emoji: '🍿' },
  { value: 'background-comfort', label: 'Background Comfort', emoji: '🛋️' },
  { value: 'zone-off', label: 'Zone Off', emoji: '😌' },
  { value: 'immersive', label: 'Immersive', emoji: '🎭' },
  { value: 'deep-dive', label: 'Deep Dive', emoji: '🤔' },
];

const VIBE_OPTIONS = [
  { value: 'feel-good', label: 'Feel Good', emoji: '😊' },
  { value: 'uplifting', label: 'Uplifting', emoji: '🌟' },
  { value: 'mind-bending', label: 'Mind Bending', emoji: '🧠' },
  { value: 'dark', label: 'Dark', emoji: '🖤' },
  { value: 'melancholic', label: 'Melancholic', emoji: '💭' },
  { value: 'thrilling', label: 'Thrilling', emoji: '⚡' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'comedic', label: 'Comedic', emoji: '😂' },
];

const MovieCollectionCard: FC<MovieCollectionCardProps> = ({
  collectionMovie,
  onOverrideUpdate,
  showOriginalTags = false,
}) => {
  const { movies: movie } = collectionMovie;
  const [isEditing, setIsEditing] = useState(false);
  const [overrideAttention, setOverrideAttention] = useState(collectionMovie.override_attention || '');
  const [overrideVibe, setOverrideVibe] = useState<string[]>(collectionMovie.override_vibe || []);
  const [saving, setSaving] = useState(false);

  const getDisplayedAttentionLevel = () => {
    return showOriginalTags ? movie.attention_level : (collectionMovie.override_attention || movie.attention_level);
  };

  const getDisplayedVibes = () => {
    return showOriginalTags ? [movie.vibe] : (collectionMovie.override_vibe?.length ? collectionMovie.override_vibe : [movie.vibe]);
  };

  const hasOverrides = () => {
    return collectionMovie.override_attention || (collectionMovie.override_vibe && collectionMovie.override_vibe.length > 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onOverrideUpdate(movie.id, {
        attention: overrideAttention || undefined,
        vibe: overrideVibe.length > 0 ? overrideVibe : undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save overrides:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setOverrideAttention(collectionMovie.override_attention || '');
    setOverrideVibe(collectionMovie.override_vibe || []);
    setIsEditing(false);
  };

  const displayedAttention = getDisplayedAttentionLevel();
  const displayedVibes = getDisplayedVibes();
  const attentionIcon = getAttentionLevelIcon(displayedAttention as any);

  return (
    <div className="group relative">
      {/* Movie Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Override Indicator */}
        {hasOverrides() && !showOriginalTags && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Customized
            </div>
          </div>
        )}

        {/* Movie Link */}
        <Link href={`/movies/${movie.id}`} className="block">
          <div className="relative aspect-[2/3] bg-gray-200">
            {movie.image_url ? (
              <Image
                src={movie.image_url}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">
                🎬
              </div>
            )}
          </div>
        </Link>

        {/* Movie Info */}
        <div className="p-4">
          <Link href={`/movies/${movie.id}`} className="block">
            <h3 className="font-semibold text-lg mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
              {movie.title}
            </h3>
          </Link>
          
          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {movie.genres.slice(0, 2).map((genre, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          )}
          
          {/* Tags Display */}
          {!isEditing ? (
            <div className="space-y-2 mb-4">
              {/* Attention Level Tag */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded font-medium">
                  {attentionIcon} {displayedAttention.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
              
              {/* Vibe Tags */}
              <div className="flex flex-wrap gap-1">
                {displayedVibes.map((vibe, index) => {
                  const vibeInfo = VIBES.find(v => v.id === vibe);
                  return (
                    <span key={index} className="inline-flex items-center px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded font-medium">
                      {vibeInfo?.icon} {vibeInfo?.name || vibe}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Override Edit Form */
            <div className="space-y-4 mb-4">
              {/* Attention Level Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attention Level
                </label>
                <select
                  value={overrideAttention}
                  onChange={(e) => setOverrideAttention(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Use Original ({movie.attention_level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})</option>
                  {ATTENTION_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.emoji} {level.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Vibe Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vibe (can select multiple)
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-md bg-gray-50">
                  {VIBE_OPTIONS.map(vibe => (
                    <label key={vibe.value} className="flex items-center text-sm cursor-pointer hover:bg-white p-1 rounded">
                      <input
                        type="checkbox"
                        checked={overrideVibe.includes(vibe.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOverrideVibe(prev => [...prev, vibe.value]);
                          } else {
                            setOverrideVibe(prev => prev.filter(v => v !== vibe.value));
                          }
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{vibe.emoji} {vibe.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Original: {movie.vibe}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {hasOverrides() ? 'Edit Overrides' : 'Customize Tags'}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving
                    </span>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCollectionCard; 