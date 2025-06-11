-- Add override fields to collection_movies table
ALTER TABLE collection_movies 
ADD COLUMN override_attention text CHECK (override_attention IN ('casual-watch', 'background-comfort', 'zone-off', 'immersive', 'deep-dive')),
ADD COLUMN override_vibe text[] DEFAULT '{}'::text[];

-- Add an index for better performance when filtering by overrides
CREATE INDEX collection_movies_override_attention_idx ON collection_movies(override_attention);
CREATE INDEX collection_movies_override_vibe_idx ON collection_movies USING GIN(override_vibe);

-- Update the RLS policy for collection movies to allow updates by collection owner
CREATE POLICY "Collection movies are updatable by collection owner"
  ON collection_movies FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM collections WHERE id = collection_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM collections WHERE id = collection_id
    )
  ); 