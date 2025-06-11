-- Add external_id field to movies table to track TMDb IDs
ALTER TABLE movies 
ADD COLUMN external_id text;

-- Create index for better performance when looking up by external ID
CREATE INDEX movies_external_id_idx ON movies(external_id);

-- Add constraint to ensure external_id is unique when present
ALTER TABLE movies 
ADD CONSTRAINT movies_external_id_unique UNIQUE(external_id); 