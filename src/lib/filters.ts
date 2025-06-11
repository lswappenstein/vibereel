export const VIBES = [
  {
    id: 'uplifting',
    name: 'Uplifting',
    description: 'Positive, inspiring, and mood-boosting content',
    icon: '🌟'
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    description: 'Thoughtful, emotional, and contemplative pieces',
    icon: '🌧️'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Intense, gritty, or psychologically challenging content',
    icon: '🌑'
  },
  {
    id: 'feel-good',
    name: 'Feel-good',
    description: 'Light-hearted, warm, and comforting stories',
    icon: '💝'
  },
  {
    id: 'mind-bending',
    name: 'Mind-bending',
    description: 'Complex, thought-provoking, or reality-bending narratives',
    icon: '🌀'
  }
] as const;

export const LENGTHS = [
  {
    id: 'short',
    name: 'Short',
    description: 'Under 90 minutes',
    range: { min: 0, max: 90 }
  },
  {
    id: 'standard',
    name: 'Standard',
    description: '90-120 minutes',
    range: { min: 90, max: 120 }
  },
  {
    id: 'long',
    name: 'Long',
    description: 'Over 120 minutes',
    range: { min: 120, max: Infinity }
  },
  {
    id: 'binge',
    name: 'Binge',
    description: 'TV series with multiple episodes',
    range: null
  }
] as const;

export const ORIGINS = [
  {
    id: 'hollywood',
    name: 'Hollywood',
    description: 'American mainstream cinema'
  },
  {
    id: 'european',
    name: 'European Cinema',
    description: 'Films from European countries'
  },
  {
    id: 'asian',
    name: 'Asian Cinema',
    description: 'Films from Asian countries'
  },
  {
    id: 'latin-american',
    name: 'Latin American',
    description: 'Films from Latin American countries'
  }
] as const;

export const TIME_PERIODS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Pre-2000',
    range: { min: 0, max: 1999 }
  },
  {
    id: '2000s',
    name: '2000s',
    description: '2000-2009',
    range: { min: 2000, max: 2009 }
  },
  {
    id: '2010s',
    name: '2010s',
    description: '2010-2019',
    range: { min: 2010, max: 2019 }
  },
  {
    id: 'new',
    name: 'New Releases',
    description: '2020 onwards',
    range: { min: 2020, max: Infinity }
  }
] as const;

export const REWATCHABILITY = [
  {
    id: 'high',
    name: 'High',
    description: 'Great for multiple viewings'
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: 'Worth a second watch'
  },
  {
    id: 'low',
    name: 'Low',
    description: 'One-time experience'
  }
] as const;

export type Vibe = typeof VIBES[number]['id'];
export type Length = typeof LENGTHS[number]['id'];
export type Origin = typeof ORIGINS[number]['id'];
export type TimePeriod = typeof TIME_PERIODS[number]['id'];
export type Rewatchability = typeof REWATCHABILITY[number]['id'];

export const getVibe = (id: Vibe) => VIBES.find(vibe => vibe.id === id);
export const getLength = (id: Length) => LENGTHS.find(length => length.id === id);
export const getOrigin = (id: Origin) => ORIGINS.find(origin => origin.id === id);
export const getTimePeriod = (id: TimePeriod) => TIME_PERIODS.find(period => period.id === id);
export const getRewatchability = (id: Rewatchability) => REWATCHABILITY.find(rewatch => rewatch.id === id); 