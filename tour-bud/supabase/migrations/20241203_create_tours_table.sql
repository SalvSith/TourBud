-- Create tours table for storing generated tours
-- Supports user authentication (future) and audio files

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT UNIQUE NOT NULL,
  
  -- User reference (optional - for future auth)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Location data
  location_data JSONB NOT NULL,
  street_name TEXT,
  city TEXT,
  country TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  formatted_address TEXT,
  
  -- Tour content
  title TEXT NOT NULL,
  description TEXT,
  narration TEXT NOT NULL,
  estimated_duration INTEGER, -- in minutes
  distance TEXT,
  
  -- Research data
  selected_places JSONB DEFAULT '[]'::jsonb,
  nearby_places JSONB DEFAULT '[]'::jsonb,
  interests TEXT[] DEFAULT '{}',
  sources TEXT[] DEFAULT '{}',
  word_count INTEGER,
  
  -- Audio (for future implementation)
  audio_url TEXT,
  audio_duration INTEGER, -- in seconds
  audio_file_size INTEGER, -- in bytes
  audio_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_audio_status CHECK (audio_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tours_tour_id ON tours(tour_id);
CREATE INDEX IF NOT EXISTS idx_tours_user_id ON tours(user_id);
CREATE INDEX IF NOT EXISTS idx_tours_street_name ON tours(street_name);
CREATE INDEX IF NOT EXISTS idx_tours_city ON tours(city);
CREATE INDEX IF NOT EXISTS idx_tours_created_at ON tours(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_is_public ON tours(is_public);
CREATE INDEX IF NOT EXISTS idx_tours_audio_status ON tours(audio_status);
CREATE INDEX IF NOT EXISTS idx_tours_latitude ON tours(latitude);
CREATE INDEX IF NOT EXISTS idx_tours_longitude ON tours(longitude);

-- Enable Row Level Security
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Policy: Public tours are viewable by everyone
CREATE POLICY "Public tours are viewable by everyone"
  ON tours
  FOR SELECT
  USING (is_public = true);

-- Policy: Users can view their own tours
CREATE POLICY "Users can view their own tours"
  ON tours
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL  -- Allow anonymous tours to be viewed
  );

-- Policy: Users can update their own tours
CREATE POLICY "Users can update their own tours"
  ON tours
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tours
CREATE POLICY "Users can delete their own tours"
  ON tours
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON tours
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_tours_updated_at ON tours;
CREATE TRIGGER trigger_update_tours_updated_at
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tours_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_tour_view_count(tour_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE tours 
  SET view_count = view_count + 1,
      last_viewed_at = NOW()
  WHERE tour_id = tour_id_param;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Comments on table and columns
COMMENT ON TABLE tours IS 'Stores generated walking tours with location, content, and audio references';
COMMENT ON COLUMN tours.tour_id IS 'Unique identifier for the tour (user-friendly format)';
COMMENT ON COLUMN tours.user_id IS 'Optional reference to the user who created the tour (null for anonymous)';
COMMENT ON COLUMN tours.location_data IS 'Complete location data as JSON (from geocode API)';
COMMENT ON COLUMN tours.narration IS 'The full tour narration text';
COMMENT ON COLUMN tours.sources IS 'URLs of sources cited in the research';
COMMENT ON COLUMN tours.audio_url IS 'URL to the generated audio file (once created)';
COMMENT ON COLUMN tours.audio_status IS 'Status of audio generation: pending, processing, completed, failed';
COMMENT ON COLUMN tours.is_public IS 'Whether this tour is publicly discoverable';

