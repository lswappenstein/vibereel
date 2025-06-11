// VibeReel Classification Engine - Improved Implementation with Weighted Signals
import type { TmdbMovie, TmdbMovieDetails, TMDB_GENRES } from './tmdb';
import type { Movie } from '@/hooks/useMovies';

// Classification result interface with qualitative confidence
export interface ClassificationResult {
  attention_level: Movie['attention_level'];
  vibe: Movie['vibe'];
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
}

// Enhanced keyword vocabularies for vibe detection
const VIBE_KEYWORDS = {
  'dark': [
    'murder', 'serial killer', 'haunted', 'dystopian', 'violent', 'tense', 'gritty', 
    'revenge', 'tragic demise', 'chilling', 'intense psychological', 'gruesome', 
    'terrifying', 'demonic', 'sinister', 'macabre', 'brutal', 'corruption', 'betrayal',
    'nightmare', 'evil', 'disturbing', 'noir', 'apocalyptic', 'terror', 'fear',
    'crime', 'criminal', 'gang', 'mafia', 'drug', 'violence', 'death', 'kill'
  ],
  'mind-bending': [
    'mind-bending', 'twist', 'puzzle', 'surreal', 'time travel', 'alternate reality',
    'memory loss', 'hallucinatory', 'philosophical', 'nothing is what it seems',
    'questions reality', 'simulation', 'consciousness', 'identity', 'perception',
    'parallel universe', 'non-linear', 'complex narrative', 'metaphysical',
    'existential', 'dream', 'dimension', 'quantum', 'matrix', 'inception',
    'multiverse', 'reality bending', 'psychological thriller'
  ],
  'uplifting': [
    'inspiring', 'uplifting', 'heartwarming journey', 'triumph', 'overcomes',
    'finds hope', 'against all odds', 'redemption', 'touching story', 'resilience',
    'learns the true value', 'saves their community', 'perseverance',
    'achievement', 'victory', 'success', 'growth', 'healing', 'solace', 'hero',
    'courage', 'brave', 'determination', 'overcome obstacles'
  ],
  'feel-good': [
    'heartwarming', 'hilarious', 'feel-good', 'quirky comedy', 'lighthearted fun',
    'charming', 'adventure for the whole family', 'delightful', 'sweet', 'romantic',
    'find love', 'family comes together', 'wholesome', 'comfort', 'cozy', 'warm',
    'festive', 'celebration', 'pleasant', 'enjoyable', 'friendship', 'humorous',
    'funny', 'comedy', 'entertaining', 'light', 'magical', 'whimsical'
  ],
  'melancholic': [
    'tragic', 'heartbreaking', 'bittersweet', 'poignant', 'moving drama', 'loss',
    'grief', 'sacrifice', 'emotional journey', 'comes at a great cost', 'must say goodbye',
    'learns to cope with loss', 'love story doomed by fate', 'family coping with tragedy',
    'nostalgic', 'longing', 'separation', 'farewell', 'memory', 'regret', 'solitude',
    'contemplative', 'introspective', 'touching', 'tearjerker', 'suffering', 'sorrow'
  ]
};

// Attention level complexity indicators
const ATTENTION_KEYWORDS = {
  'deep-dive': [
    'mind-bending mystery', 'non-linear timeline', 'multiple universes', 'complex narrative',
    'philosophical exploration', 'twist ending', 'multiple timelines', 'temporal loops',
    'ambiguous endings', 'intricate plot', 'puzzle-like storytelling', 'dense', 'layered',
    'documentary', 'historical', 'biography', 'based on true events'
  ],
  'immersive': [
    'intense drama', 'gripping story', 'character-driven', 'emotional stakes',
    'detailed world-building', 'engaging', 'captivating', 'suspenseful', 'compelling',
    'rich storytelling', 'psychological', 'thriller', 'mystery', 'crime investigation'
  ],
  'casual': [
    'fun adventure', 'lighthearted journey', 'classic tale', 'straightforward',
    'entertaining', 'accessible', 'mainstream', 'familiar', 'easy to follow',
    'action-packed', 'adventure', 'comedy', 'romance'
  ],
  'background': [
    'slice-of-life', 'episodic', 'light and enjoyable', 'pleasant', 'comfortable',
    'relaxing', 'uncomplicated', 'simple', 'basic', 'mindless fun'
  ]
};

// Genre weights for attention level (0.0 to 1.0)
const GENRE_ATTENTION_WEIGHTS: Record<number, number> = {
  // High attention genres
  99: 0.9,   // Documentary
  36: 0.85,  // History
  10752: 0.8, // War
  9648: 0.75, // Mystery
  53: 0.7,   // Thriller
  80: 0.7,   // Crime
  18: 0.65,  // Drama
  878: 0.6,  // Science Fiction
  14: 0.55,  // Fantasy
  
  // Medium attention genres
  12: 0.5,   // Adventure
  28: 0.45,  // Action
  10749: 0.4, // Romance
  
  // Lower attention genres
  35: 0.35,  // Comedy
  10751: 0.3, // Family
  16: 0.25,  // Animation
  10402: 0.2, // Music
};

// Genre weights for vibe classification
const GENRE_VIBE_WEIGHTS: Record<number, Record<string, number>> = {
  27: { 'dark': 0.9 },      // Horror
  53: { 'dark': 0.7 },      // Thriller
  80: { 'dark': 0.6 },      // Crime
  10752: { 'melancholic': 0.7, 'dark': 0.3 }, // War
  
  35: { 'feel-good': 0.8 }, // Comedy
  10749: { 'feel-good': 0.7 }, // Romance
  10751: { 'feel-good': 0.6 }, // Family
  16: { 'feel-good': 0.6 },    // Animation
  
  878: { 'mind-bending': 0.6 }, // Science Fiction
  9648: { 'mind-bending': 0.5 }, // Mystery
  14: { 'uplifting': 0.4, 'feel-good': 0.3 }, // Fantasy
  
  18: { 'melancholic': 0.4, 'uplifting': 0.3 }, // Drama
  12: { 'uplifting': 0.5 }, // Adventure
  28: { 'uplifting': 0.4 },  // Action
};

// Manual overrides for known problematic classifications
const MANUAL_OVERRIDES: Record<string, { attention?: Movie['attention_level']; vibe?: Movie['vibe'] }> = {
  'lilo & stitch': { attention: 'casual-watch', vibe: 'feel-good' },
  'how to train your dragon': { attention: 'casual-watch', vibe: 'feel-good' },
  'beauty and the beast': { attention: 'casual-watch', vibe: 'feel-good' },
  'the lion king': { attention: 'immersive', vibe: 'feel-good' },
  'forrest gump': { vibe: 'feel-good' },
  'parasite': { attention: 'immersive', vibe: 'dark' },
  'oppenheimer': { attention: 'immersive', vibe: 'feel-good' },
  'moonlight': { attention: 'immersive', vibe: 'feel-good' },
};

export function classifyMovie(movie: TmdbMovie | TmdbMovieDetails): ClassificationResult {
  const title = movie.title.toLowerCase();
  
  // Check for manual overrides first
  if (MANUAL_OVERRIDES[title]) {
    const override = MANUAL_OVERRIDES[title];
    const attentionResult = override.attention ? 
      { level: override.attention, confidence: 'High' as const, explanation: 'Manual override for known case' } :
      determineAttentionLevel(movie);
    const vibeResult = override.vibe ?
      { vibe: override.vibe, confidence: 'High' as const, explanation: 'Manual override for known case' } :
      determineVibeCategory(movie);
    
    return {
      attention_level: attentionResult.level,
      vibe: vibeResult.vibe,
      confidence: 'High',
      explanation: `Manual override applied. ${attentionResult.explanation}. ${vibeResult.explanation}`
    };
  }
  
  // Standard classification
  const attentionResult = determineAttentionLevel(movie);
  const vibeResult = determineVibeCategory(movie);
  
  const overallConfidence = calculateOverallConfidence(attentionResult.confidence, vibeResult.confidence);
  const explanation = `Attention: ${attentionResult.explanation}. Vibe: ${vibeResult.explanation}`;

  return {
    attention_level: attentionResult.level,
    vibe: vibeResult.vibe,
    confidence: overallConfidence,
    explanation
  };
}

function determineAttentionLevel(movie: TmdbMovie | TmdbMovieDetails): {
  level: Movie['attention_level'];
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
} {
  const genreIds = movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []);
  const text = `${movie.title} ${movie.overview}`.toLowerCase();
  const runtime = movie.runtime || 0;
  const rating = movie.vote_average || 0;
  const voteCount = movie.vote_count || 0;
  const popularity = movie.popularity || 0;

  // Calculate weighted signals
  const genreScore = calculateGenreAttentionScore(genreIds);
  const runtimeScore = calculateRuntimeScore(runtime);
  const synopsisScore = calculateSynopsisComplexity(text);
  const popularityScore = calculatePopularityAdjustment(popularity);
  const ratingScore = calculateRatingSignal(rating, voteCount);

  // Weighted average (genre is most important, then runtime, synopsis, etc.)
  const finalScore = (
    genreScore * 0.4 +
    runtimeScore * 0.2 +
    synopsisScore * 0.2 +
    popularityScore * 0.1 +
    ratingScore * 0.1
  );

  const level = mapScoreToAttentionLevel(finalScore);
  const confidence = calculateAttentionConfidence(finalScore, genreIds, text);
  
  const signals = [
    `Genre score: ${genreScore.toFixed(2)}`,
    `Runtime: ${runtime}min (${runtimeScore.toFixed(2)})`,
    `Synopsis complexity: ${synopsisScore.toFixed(2)}`,
    `Popularity adjustment: ${popularityScore.toFixed(2)}`,
    `Rating signal: ${ratingScore.toFixed(2)}`
  ];

  return {
    level,
    confidence,
    explanation: `Final score: ${finalScore.toFixed(2)} → ${level}. Signals: ${signals.join(', ')}`
  };
}

function calculateGenreAttentionScore(genreIds: number[]): number {
  if (genreIds.length === 0) return 0.5; // Default middle score
  
  const scores = genreIds.map(id => GENRE_ATTENTION_WEIGHTS[id] || 0.5);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function calculateRuntimeScore(runtime: number): number {
  if (runtime === 0) return 0.5; // Unknown runtime
  if (runtime > 150) return 0.9;  // Deep dive territory
  if (runtime > 120) return 0.7;  // Immersive
  if (runtime > 90) return 0.5;   // Casual watch
  if (runtime > 60) return 0.3;   // Background comfort
  return 0.1; // Zone off
}

function calculateSynopsisComplexity(text: string): number {
  let score = 0.5; // Base score
  
  // Check for complexity keywords
  for (const [level, keywords] of Object.entries(ATTENTION_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > 0) {
      switch (level) {
        case 'deep-dive': score += matches * 0.2; break;
        case 'immersive': score += matches * 0.15; break;
        case 'casual': score += matches * 0.05; break;
        case 'background': score -= matches * 0.1; break;
      }
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculatePopularityAdjustment(popularity: number): number {
  // High popularity suggests broader accessibility (lower attention)
  if (popularity > 100) return 0.3;
  if (popularity > 50) return 0.4;
  if (popularity > 20) return 0.5;
  if (popularity > 5) return 0.6;
  return 0.7; // Niche films often require more attention
}

function calculateRatingSignal(rating: number, voteCount: number): number {
  if (voteCount < 100) return 0.5; // Not enough data
  
  // High rating with high vote count suggests quality content
  if (rating >= 8.0 && voteCount >= 1000) return 0.8;
  if (rating >= 7.5 && voteCount >= 500) return 0.7;
  if (rating >= 7.0) return 0.6;
  if (rating < 6.0) return 0.3; // Low quality might be skippable
  return 0.5;
}

function mapScoreToAttentionLevel(score: number): Movie['attention_level'] {
  if (score >= 0.85) return 'deep-dive';
  if (score >= 0.65) return 'immersive';
  if (score >= 0.45) return 'casual-watch';
  if (score >= 0.25) return 'background-comfort';
  return 'zone-off';
}

function calculateAttentionConfidence(score: number, genreIds: number[], text: string): 'High' | 'Medium' | 'Low' {
  const factorsUsed = [
    genreIds.length > 0,
    text.length > 50,
    ATTENTION_KEYWORDS['deep-dive'].some(k => text.includes(k)),
    ATTENTION_KEYWORDS['immersive'].some(k => text.includes(k))
  ].filter(Boolean).length;
  
  if (factorsUsed >= 3 && (score <= 0.3 || score >= 0.7)) return 'High';
  if (factorsUsed >= 2) return 'Medium';
  return 'Low';
}

function determineVibeCategory(movie: TmdbMovie | TmdbMovieDetails): {
  vibe: Movie['vibe'];
  confidence: 'High' | 'Medium' | 'Low';
  explanation: string;
} {
  const genreIds = movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []);
  const text = `${movie.title} ${movie.overview}`.toLowerCase();
  const rating = movie.vote_average || 0;

  // Calculate vibe scores from multiple signals
  const vibeScores = {
    'dark': 0,
    'mind-bending': 0,
    'uplifting': 0,
    'feel-good': 0,
    'melancholic': 0
  };

  // Genre-based scoring
  for (const genreId of genreIds) {
    const genreWeights = GENRE_VIBE_WEIGHTS[genreId];
    if (genreWeights) {
      for (const [vibe, weight] of Object.entries(genreWeights)) {
        vibeScores[vibe as keyof typeof vibeScores] += weight;
      }
    }
  }

  // Keyword-based scoring
  for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    vibeScores[vibe as keyof typeof vibeScores] += matches * 0.3;
  }

  // Rating-based adjustments
  if (rating >= 8.5) {
    // Very high rated films with tragic content → melancholic or uplifting
    if (genreIds.includes(18) || genreIds.includes(10752)) {
      vibeScores.melancholic += 0.2;
      vibeScores.uplifting += 0.1;
    }
  }
  
  if (rating < 6.0) {
    // Low rated films with violent content → dark
    if (genreIds.includes(27) || genreIds.includes(53) || genreIds.includes(80)) {
      vibeScores.dark += 0.3;
    }
  }

  // Apply false positive corrections
  const correctedScores = correctVibeForCommonTraps(genreIds, text, vibeScores);

  // Find the highest scoring vibe
  const topVibe = Object.entries(correctedScores).reduce((a, b) => 
    correctedScores[a[0] as keyof typeof correctedScores] > correctedScores[b[0] as keyof typeof correctedScores] ? a : b
  )[0] as Movie['vibe'];

  const confidence = calculateVibeConfidence(correctedScores, topVibe);
  const topScore = correctedScores[topVibe];
  
  return {
    vibe: topVibe,
    confidence,
    explanation: `Top vibe: ${topVibe} (${topScore.toFixed(2)}). Genre signals + keyword analysis + rating context`
  };
}

function correctVibeForCommonTraps(
  genreIds: number[], 
  text: string, 
  scores: Record<string, number>
): Record<string, number> {
  const corrected = { ...scores };

  // Dark comedy correction: Comedy + Crime/Violence = Dark, not Feel-Good
  if (genreIds.includes(35) && (genreIds.includes(80) || text.includes('murder') || text.includes('crime'))) {
    corrected.dark += 0.4;
    corrected['feel-good'] -= 0.3;
  }

  // War films: Even with hope = Melancholic, not Uplifting
  if (genreIds.includes(10752) || text.includes('war') || text.includes('holocaust')) {
    corrected.melancholic += 0.3;
    corrected.uplifting -= 0.2;
  }

  // Animation + Family + Light content = Feel-Good (override sci-fi mind-bending)
  if (genreIds.includes(16) && genreIds.includes(10751) && !text.includes('dark') && !text.includes('complex')) {
    corrected['feel-good'] += 0.4;
    corrected['mind-bending'] -= 0.3;
  }

  // Sci-fi without complexity keywords = not automatically mind-bending
  if (genreIds.includes(878) && !VIBE_KEYWORDS['mind-bending'].some(k => text.includes(k))) {
    corrected['mind-bending'] -= 0.2;
  }

  // Romance + positive keywords = Feel-Good
  if (genreIds.includes(10749) && (text.includes('love') || text.includes('romantic'))) {
    corrected['feel-good'] += 0.3;
  }

  return corrected;
}

function calculateVibeConfidence(scores: Record<string, number>, topVibe: string): 'High' | 'Medium' | 'Low' {
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const topScore = sortedScores[0];
  const secondScore = sortedScores[1] || 0;
  const spread = topScore - secondScore;

  if (topScore > 0.8 && spread > 0.3) return 'High';
  if (topScore > 0.5 && spread > 0.2) return 'Medium';
  return 'Low';
}

function calculateOverallConfidence(
  attentionConf: 'High' | 'Medium' | 'Low', 
  vibeConf: 'High' | 'Medium' | 'Low'
): 'High' | 'Medium' | 'Low' {
  const confMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
  const avgConf = (confMap[attentionConf] + confMap[vibeConf]) / 2;
  
  if (avgConf >= 2.5) return 'High';
  if (avgConf >= 1.5) return 'Medium';
  return 'Low';
}

export function classifyMany(movies: TmdbMovie[]): Array<TmdbMovie & ClassificationResult> {
  return movies.map(movie => ({
    ...movie,
    ...classifyMovie(movie)
  }));
}

export function convertTmdbToVibeReelMovie(
  tmdbMovie: TmdbMovie, 
  classification?: ClassificationResult
): Omit<Movie, 'id' | 'created_at'> {
  const result = classification || classifyMovie(tmdbMovie);
  
  // Extract genres from either genre_ids (basic response) or genres (detailed response)
  const genreMap: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };
  
  let genres: string[] = [];
  
  // Check if we have detailed genre objects (from getMovieById)
  if ('genres' in tmdbMovie && tmdbMovie.genres) {
    genres = tmdbMovie.genres.map(genre => genre.name);
  } 
  // Otherwise use genre_ids (from search/discover endpoints)
  else if (tmdbMovie.genre_ids) {
    genres = tmdbMovie.genre_ids
      .map(id => genreMap[id])
      .filter(Boolean);
  }

  return {
    title: tmdbMovie.title,
    attention_level: result.attention_level,
    vibe: result.vibe,
    image_url: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    description: tmdbMovie.overview || 'No description available.',
    runtime: tmdbMovie.runtime || 120,
    language: tmdbMovie.original_language || 'en',
    release_year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : new Date().getFullYear(),
    genres: genres
  };
} 