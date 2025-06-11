import { FC } from 'react';
import Link from 'next/link';

interface CollectionCardProps {
  id: string;
  title: string;
  description: string;
  movieCount: number;
  type: 'occasion' | 'mood' | 'project' | 'archive';
}

const CollectionCard: FC<CollectionCardProps> = ({
  id,
  title,
  description,
  movieCount,
  type
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'occasion':
        return 'bg-blue-100 text-blue-800';
      case 'mood':
        return 'bg-green-100 text-green-800';
      case 'project':
        return 'bg-purple-100 text-purple-800';
      case 'archive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Link href={`/collections/${id}`}>
      <div className="p-6 rounded-lg border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm capitalize ${getTypeStyles()}`}>
            {type}
          </span>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {movieCount} {movieCount === 1 ? 'movie' : 'movies'}
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard; 