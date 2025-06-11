#!/usr/bin/env tsx
// Migration script to populate Supabase with top 500 classified movies from TMDb

import { createClient } from '@supabase/supabase-js';
import { tmdbClient, type TmdbMovie } from '../src/lib/tmdb';
import { classifyMovie, convertTmdbToVibeReelMovie } from '../src/lib/classify';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations
const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!tmdbApiKey) {
  console.error('❌ Missing TMDb API key');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MigrationStats {
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}

class Top500Migrator {
  private stats: MigrationStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    errors: []
  };

  async migrate(): Promise<void> {
    console.log('🎬 Starting TMDb Top 500 Migration to VibeReel...\n');

    try {
      // Step 1: Fetch top movies from multiple sources
      console.log('📡 Fetching movies from TMDb...');
      const movies = await this.fetchTop500Movies();
      console.log(`✅ Found ${movies.length} unique movies\n`);

      // Step 2: Classify and convert movies
      console.log('🧠 Classifying movies using VibeReel engine...');
      const classifiedMovies = await this.classifyMovies(movies);
      console.log(`✅ Classified ${classifiedMovies.length} movies\n`);

      // Step 3: Store in Supabase
      console.log('💾 Storing movies in Supabase...');
      await this.storeMovies(classifiedMovies);
      
      // Step 4: Print final stats
      this.printFinalStats();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }

  private async fetchTop500Movies(): Promise<TmdbMovie[]> {
    const allMovies = new Map<number, TmdbMovie>(); // Use Map to avoid duplicates
    const sources = [
      { name: 'Popular', fetcher: () => this.fetchFromSource('popular') },
      { name: 'Top Rated', fetcher: () => this.fetchFromSource('top_rated') },
      { name: 'Trending', fetcher: () => this.fetchFromSource('trending') }
    ];

    for (const source of sources) {
      try {
        console.log(`  - Fetching from ${source.name}...`);
        const movies = await source.fetcher();
        
        movies.forEach(movie => {
          if (!movie.adult && movie.vote_count > 100) { // Filter criteria
            allMovies.set(movie.id, movie);
          }
        });
        
        console.log(`    ✅ Added ${movies.length} movies from ${source.name}`);
        console.log(`    📊 Total unique movies: ${allMovies.size}`);
        
        // Rate limiting delay
        await this.delay(1000);
        
      } catch (error) {
        console.error(`    ❌ Failed to fetch from ${source.name}:`, error);
        this.stats.errors.push(`Failed to fetch ${source.name}: ${error}`);
      }
    }

    // Convert to array and limit to 500
    const moviesArray = Array.from(allMovies.values());
    
    // Sort by popularity and rating to get the best movies
    const sortedMovies = moviesArray
      .sort((a, b) => {
        const scoreA = (a.vote_average * Math.log(a.vote_count)) + (a.popularity / 100);
        const scoreB = (b.vote_average * Math.log(b.vote_count)) + (b.popularity / 100);
        return scoreB - scoreA;
      })
      .slice(0, 500);

    return sortedMovies;
  }

  private async fetchFromSource(source: 'popular' | 'top_rated' | 'trending'): Promise<TmdbMovie[]> {
    const movies: TmdbMovie[] = [];
    const maxPages = 10; // Fetch up to 10 pages from each source

    for (let page = 1; page <= maxPages; page++) {
      try {
        let response;
        
        switch (source) {
          case 'popular':
            response = await tmdbClient.getPopular(page);
            break;
          case 'top_rated':
            response = await tmdbClient.getTopRated(page);
            break;
          case 'trending':
            if (page === 1) { // Trending only has one page typically
              response = await tmdbClient.getTrending('week');
            } else {
              break;
            }
            break;
        }

        if (response && response.results) {
          movies.push(...response.results);
        }

        // Rate limiting
        await this.delay(300);

      } catch (error) {
        console.error(`    ⚠️  Failed to fetch page ${page} from ${source}:`, error);
        break; // Stop fetching more pages if one fails
      }
    }

    return movies;
  }

  private async classifyMovies(movies: TmdbMovie[]): Promise<Array<TmdbMovie & { vibeReelData: ReturnType<typeof convertTmdbToVibeReelMovie> }>> {
    const classifiedMovies = [];
    
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        // Get detailed movie info for better classification
        let detailedMovie = movie;
        try {
          detailedMovie = await tmdbClient.getMovieById(movie.id);
          await this.delay(300); // Rate limiting
        } catch (error) {
          console.log(`    ⚠️  Using basic info for ${movie.title} (detailed fetch failed)`);
        }

        // Classify the movie
        const classification = classifyMovie(detailedMovie);
        const vibeReelData = convertTmdbToVibeReelMovie(detailedMovie, classification);

        classifiedMovies.push({
          ...movie,
          vibeReelData
        });

        // Progress indicator
        if ((i + 1) % 50 === 0) {
          console.log(`    📊 Classified ${i + 1}/${movies.length} movies...`);
        }

      } catch (error) {
        console.error(`    ❌ Failed to classify ${movie.title}:`, error);
        this.stats.errors.push(`Classification failed for ${movie.title}: ${error}`);
      }
    }

    return classifiedMovies;
  }

  private async storeMovies(movies: Array<TmdbMovie & { vibeReelData: any }>): Promise<void> {
    const batchSize = 50;
    
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      await this.processBatch(batch, i + 1);
      
      // Progress indicator
      console.log(`    📊 Processed ${Math.min(i + batchSize, movies.length)}/${movies.length} movies...`);
    }
  }

  private async processBatch(batch: Array<TmdbMovie & { vibeReelData: any }>, batchNumber: number): Promise<void> {
    const insertData = batch.map(movie => ({
      // Use TMDb ID as external reference, let Supabase generate UUID
      tmdb_id: movie.id,
      title: movie.vibeReelData.title,
      attention_level: movie.vibeReelData.attention_level,
      vibe: movie.vibeReelData.vibe,
      image_url: movie.vibeReelData.image_url,
      description: movie.vibeReelData.description,
      runtime: movie.vibeReelData.runtime,
      language: movie.vibeReelData.language,
      release_year: movie.vibeReelData.release_year,
      source: 'tmdb'
    }));

    try {
      const { data, error } = await supabase
        .from('movies')
        .upsert(insertData, { 
          onConflict: 'tmdb_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        throw error;
      }

      this.stats.processed += batch.length;
      this.stats.successful += data?.length || 0;

    } catch (error) {
      console.error(`    ❌ Failed to store batch ${batchNumber}:`, error);
      this.stats.failed += batch.length;
      this.stats.errors.push(`Batch ${batchNumber} storage failed: ${error}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printFinalStats(): void {
    console.log('\n📊 Migration Complete! Final Statistics:');
    console.log('=====================================');
    console.log(`✅ Total Processed: ${this.stats.processed}`);
    console.log(`🎯 Successfully Stored: ${this.stats.successful}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`🔄 Duplicates Handled: ${this.stats.duplicates}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n🎉 Top 500 movies have been successfully migrated to VibeReel!');
  }
}

// First, let's add the tmdb_id column to our movies table
async function updateMoviesSchema(): Promise<void> {
  console.log('🔧 Updating movies table schema...');
  
  try {
    // Add tmdb_id column if it doesn't exist
    const { error: alterError } = await supabase
      .from('movies')
      .select('tmdb_id')
      .limit(1);

    if (alterError && alterError.message.includes('column "tmdb_id" does not exist')) {
      console.log('  - Adding tmdb_id column...');
      
      // Note: This would need to be run as a SQL migration in practice
      console.log('  ⚠️  Please add this SQL migration to your Supabase dashboard:');
      console.log(`
        ALTER TABLE movies 
        ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE,
        ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'supabase';
        
        CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
        CREATE INDEX IF NOT EXISTS idx_movies_source ON movies(source);
      `);
      
      console.log('  📝 Please run the above SQL in your Supabase SQL editor before continuing.');
      console.log('  ⏸️  Migration paused. Run again after adding the columns.\n');
      process.exit(0);
    }
    
    console.log('  ✅ Schema is up to date\n');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 VibeReel Top 500 Migration Tool\n');
  
  // Update schema first
  await updateMoviesSchema();
  
  // Run migration
  const migrator = new Top500Migrator();
  await migrator.migrate();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { Top500Migrator }; 