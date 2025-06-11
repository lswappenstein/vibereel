import type { Movie } from '@/hooks/useMovies';

type Vibe = Movie['vibe'];

const VIBES: Array<{ id: Vibe; name: string; icon: string }> = [
  { id: 'uplifting', name: 'Uplifting', icon: '🌟' },
  { id: 'melancholic', name: 'Melancholic', icon: '🌧️' },
  { id: 'dark', name: 'Dark', icon: '🌑' },
  { id: 'feel-good', name: 'Feel Good', icon: '💝' },
  { id: 'mind-bending', name: 'Mind Bending', icon: '🌀' },
];

interface VibeFilterProps {
  selectedVibe: Vibe | null;
  onSelect: (vibe: Vibe | null) => void;
}

export default function VibeFilter({ selectedVibe, onSelect }: VibeFilterProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Vibe</h3>
      <div className="space-y-2">
        {VIBES.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => onSelect(selectedVibe === vibe.id ? null : vibe.id)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedVibe === vibe.id
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{vibe.icon}</span>
            {vibe.name}
          </button>
        ))}
      </div>
    </div>
  );
} 