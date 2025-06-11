'use client';

export type CategoryType = 'popular' | 'now-playing' | 'upcoming' | 'top-rated' | null;

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onSelect: (category: CategoryType) => void;
}

const categories = [
  { value: 'popular' as const, label: 'Popular', icon: '🔥' },
  { value: 'now-playing' as const, label: 'Now Playing', icon: '🎬' },
  { value: 'upcoming' as const, label: 'Upcoming', icon: '📅' },
  { value: 'top-rated' as const, label: 'Top Rated', icon: '⭐' },
];

export default function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Category</h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => onSelect(selectedCategory === category.value ? null : category.value)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
} 