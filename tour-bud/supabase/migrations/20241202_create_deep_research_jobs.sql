-- Create table for tracking deep research jobs
-- This allows us to persist research state and results

CREATE TABLE IF NOT EXISTS deep_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id TEXT UNIQUE NOT NULL,
  openai_response_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  
  -- Location data
  location_data JSONB NOT NULL,
  places JSONB DEFAULT '[]'::jsonb,
  interests TEXT[] DEFAULT '{}',
  
  -- User reference (optional)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Results (populated when complete)
  tour_id TEXT,
  narration TEXT,
  sources TEXT[] DEFAULT '{}',
  word_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_research_id ON deep_research_jobs(research_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_openai_response_id ON deep_research_jobs(openai_response_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_user_id ON deep_research_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_status ON deep_research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_created_at ON deep_research_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE deep_research_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own research jobs
CREATE POLICY "Users can view their own research jobs"
  ON deep_research_jobs
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL  -- Allow anonymous research jobs to be viewed
  );

-- Policy: Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON deep_research_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deep_research_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_deep_research_jobs_updated_at ON deep_research_jobs;
CREATE TRIGGER trigger_update_deep_research_jobs_updated_at
  BEFORE UPDATE ON deep_research_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_deep_research_jobs_updated_at();

-- Comment on table
COMMENT ON TABLE deep_research_jobs IS 'Tracks o3-deep-research background jobs for tour generation';
COMMENT ON COLUMN deep_research_jobs.research_id IS 'Our internal unique ID for the research job';
COMMENT ON COLUMN deep_research_jobs.openai_response_id IS 'OpenAI Responses API response ID for polling';
COMMENT ON COLUMN deep_research_jobs.location_data IS 'JSON containing street, city, country, coordinates';
COMMENT ON COLUMN deep_research_jobs.sources IS 'URLs of sources cited in the research';

