import type { Movie } from '@/hooks/useMovies';

type AttentionLevel = Movie['attention_level'];

interface AttentionLevelInfo {
  id: AttentionLevel;
  name: string;
  icon: string;
  description: string;
}

export const ATTENTION_LEVELS: AttentionLevelInfo[] = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    icon: '🎯',
    description: 'Complex narratives that demand your full attention and engagement.',
  },
  {
    id: 'immersive',
    name: 'Immersive',
    icon: '🌊',
    description: 'Engaging content that rewards focused viewing but allows brief distractions.',
  },
  {
    id: 'casual-watch',
    name: 'Casual Watch',
    icon: '☕',
    description: 'Easy to follow while doing light activities or having conversations.',
  },
  {
    id: 'background-comfort',
    name: 'Background Comfort',
    icon: '🎵',
    description: 'Familiar content perfect for background entertainment while multitasking.',
  },
  {
    id: 'zone-off',
    name: 'Zone Off',
    icon: '💤',
    description: 'Light, predictable content ideal for unwinding or falling asleep to.',
  },
];

export const getAttentionLevelIcon = (id: AttentionLevel) => {
  const level = ATTENTION_LEVELS.find(level => level.id === id);
  return level ? level.icon : '❓';
}; 