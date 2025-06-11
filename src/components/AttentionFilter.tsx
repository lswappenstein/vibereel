import { ATTENTION_LEVELS } from '@/lib/attentionLevels';
import type { Movie } from '@/hooks/useMovies';

type AttentionLevel = Movie['attention_level'];

interface AttentionFilterProps {
  selectedLevel: AttentionLevel | null;
  onSelect: (level: AttentionLevel | null) => void;
}

export default function AttentionFilter({ selectedLevel, onSelect }: AttentionFilterProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Attention Level</h3>
      <div className="space-y-2">
        {ATTENTION_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(selectedLevel === level.id ? null : level.id as AttentionLevel)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedLevel === level.id
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{level.icon}</span>
            {level.name}
          </button>
        ))}
      </div>
    </div>
  );
} 