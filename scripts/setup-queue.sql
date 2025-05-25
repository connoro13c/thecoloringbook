-- Create job queue table
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  payload JSONB NOT NULL, -- Store job parameters (prompt, style, difficulty, etc.)
  error_message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority_scheduled ON job_queue(priority DESC, scheduled_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_user_id ON job_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_job_id ON job_queue(job_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_job_queue_updated_at ON job_queue;
CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_job_queue_updated_at();

-- Enable Row Level Security
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own queue jobs" ON job_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue jobs" ON job_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue jobs" ON job_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all queue jobs (for worker processes)
CREATE POLICY "Service role can manage all queue jobs" ON job_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for active jobs (pending + processing)
CREATE OR REPLACE VIEW active_queue_jobs AS
SELECT *
FROM job_queue
WHERE status IN ('pending', 'processing', 'retrying')
ORDER BY priority DESC, scheduled_at ASC;