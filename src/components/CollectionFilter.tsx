import { FC } from 'react';

interface CollectionFilterProps {
  showOriginalTags: boolean;
  onShowOriginalTagsChange: (show: boolean) => void;
  selectedAttention: string[];
  onAttentionChange: (attention: string[]) => void;
  selectedVibe: string[];
  onVibeChange: (vibe: string[]) => void;
}

const ATTENTION_LEVELS = [
  { value: 'casual-watch', label: 'Casual Watch', emoji: '☕' },
  { value: 'background-comfort', label: 'Background Comfort', emoji: '🎵' },
  { value: 'zone-off', label: 'Zone Off', emoji: '💤' },
  { value: 'immersive', label: 'Immersive', emoji: '🌊' },
  { value: 'deep-dive', label: 'Deep Dive', emoji: '🎯' },
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

const CollectionFilter: FC<CollectionFilterProps> = ({
  showOriginalTags,
  onShowOriginalTagsChange,
  selectedAttention,
  onAttentionChange,
  selectedVibe,
  onVibeChange,
}) => {
  const handleAttentionToggle = (attention: string) => {
    if (selectedAttention.includes(attention)) {
      onAttentionChange(selectedAttention.filter(a => a !== attention));
    } else {
      onAttentionChange([...selectedAttention, attention]);
    }
  };

  const handleVibeToggle = (vibe: string) => {
    if (selectedVibe.includes(vibe)) {
      onVibeChange(selectedVibe.filter(v => v !== vibe));
    } else {
      onVibeChange([...selectedVibe, vibe]);
    }
  };

  const clearAllFilters = () => {
    onAttentionChange([]);
    onVibeChange([]);
  };

  const hasActiveFilters = selectedAttention.length > 0 || selectedVibe.length > 0;

  return (
    <div className="mb-8 space-y-6">
      {/* Filter Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Filter Collection</h3>
          
          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Toggle for Original vs Override tags */}
        <div className="mb-6">
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="tagMode"
                checked={showOriginalTags}
                onChange={() => onShowOriginalTagsChange(true)}
                className="sr-only"
              />
              <div className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${
                showOriginalTags 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}>
                <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                  showOriginalTags ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  {showOriginalTags && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">Use Original Tags</span>
              </div>
            </label>
            
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="tagMode"
                checked={!showOriginalTags}
                onChange={() => onShowOriginalTagsChange(false)}
                className="sr-only"
              />
              <div className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${
                !showOriginalTags 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}>
                <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
                  !showOriginalTags ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  {!showOriginalTags && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">Use My Overrides</span>
              </div>
            </label>
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attention Level Filter */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Attention Level</h4>
            <div className="space-y-2">
              {ATTENTION_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleAttentionToggle(level.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                    selectedAttention.includes(level.value)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{level.emoji}</span>
                    <span className="font-medium">{level.label}</span>
                  </div>
                  {selectedAttention.includes(level.value) && (
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Filter */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Vibe</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {VIBE_OPTIONS.map(vibe => (
                <button
                  key={vibe.value}
                  onClick={() => handleVibeToggle(vibe.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                    selectedVibe.includes(vibe.value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{vibe.emoji}</span>
                    <span className="font-medium">{vibe.label}</span>
                  </div>
                  {selectedVibe.includes(vibe.value) && (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-600">Active filters:</span>
          
          {selectedAttention.map(attention => {
            const level = ATTENTION_LEVELS.find(l => l.value === attention);
            return (
              <span key={attention} className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200 font-medium">
                {level?.emoji} {level?.label}
                <button
                  onClick={() => handleAttentionToggle(attention)}
                  className="ml-2 text-purple-500 hover:text-purple-700"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            );
          })}
          
          {selectedVibe.map(vibe => {
            const vibeOption = VIBE_OPTIONS.find(v => v.value === vibe);
            return (
              <span key={vibe} className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 font-medium">
                {vibeOption?.emoji} {vibeOption?.label}
                <button
                  onClick={() => handleVibeToggle(vibe)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectionFilter; 