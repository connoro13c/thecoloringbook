import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface QueueJob {
  id: string;
  job_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  retry_count: number;
  max_retries: number;
  payload: {
    prompt: string;
    style: string;
    difficulty: number;
    input_url: string;
  };
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQueueJobData {
  job_id: string;
  user_id: string;
  payload: QueueJob['payload'];
  priority?: number;
  max_retries?: number;
}

/**
 * Add a job to the queue
 */
export async function enqueueJob(data: CreateQueueJobData): Promise<QueueJob> {
  const { data: queueJob, error } = await supabase
    .from('job_queue')
    .insert({
      job_id: data.job_id,
      user_id: data.user_id,
      payload: data.payload,
      priority: data.priority || 0,
      max_retries: data.max_retries || 3,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enqueue job: ${error.message}`);
  }

  return queueJob;
}

/**
 * Get the next job to process
 */
export async function getNextJob(): Promise<QueueJob | null> {
  const { data: jobs, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`Failed to get next job: ${error.message}`);
  }

  return jobs.length > 0 ? jobs[0] : null;
}

/**
 * Mark a job as processing
 */
export async function startJob(queueJobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', queueJobId);

  if (error) {
    throw new Error(`Failed to start job: ${error.message}`);
  }
}

/**
 * Mark a job as completed
 */
export async function completeJob(queueJobId: string): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', queueJobId);

  if (error) {
    throw new Error(`Failed to complete job: ${error.message}`);
  }
}

/**
 * Mark a job as failed and potentially retry
 */
export async function failJob(queueJobId: string, errorMessage: string): Promise<void> {
  // First get the current job to check retry count
  const { data: job, error: fetchError } = await supabase
    .from('job_queue')
    .select('retry_count, max_retries')
    .eq('id', queueJobId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch job for retry: ${fetchError.message}`);
  }

  const shouldRetry = job.retry_count < job.max_retries;
  const newStatus = shouldRetry ? 'retrying' : 'failed';
  const scheduledAt = shouldRetry 
    ? new Date(Date.now() + Math.pow(2, job.retry_count) * 60000).toISOString() // Exponential backoff
    : undefined;

  const updateData: any = {
    status: newStatus,
    retry_count: job.retry_count + 1,
    error_message: errorMessage
  };

  if (scheduledAt) {
    updateData.scheduled_at = scheduledAt;
  }

  const { error } = await supabase
    .from('job_queue')
    .update(updateData)
    .eq('id', queueJobId);

  if (error) {
    throw new Error(`Failed to fail job: ${error.message}`);
  }
}

/**
 * Get job status by job ID
 */
export async function getJobStatus(jobId: string): Promise<string> {
  const { data: queueJob, error } = await supabase
    .from('job_queue')
    .select('status')
    .eq('job_id', jobId)
    .single();

  if (error) {
    // If no queue job found, check the main jobs table
    const { data: mainJob, error: mainError } = await supabase
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (mainError) {
      throw new Error(`Failed to get job status: ${mainError.message}`);
    }

    return mainJob.status;
  }

  return queueJob.status;
}

/**
 * Get all jobs ready to be retried
 */
export async function getRetryableJobs(): Promise<QueueJob[]> {
  const { data: jobs, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('status', 'retrying')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get retryable jobs: ${error.message}`);
  }

  return jobs;
}

/**
 * Reset retryable jobs back to pending
 */
export async function resetRetryableJobs(): Promise<void> {
  const { error } = await supabase
    .from('job_queue')
    .update({ status: 'pending' })
    .eq('status', 'retrying')
    .lte('scheduled_at', new Date().toISOString());

  if (error) {
    throw new Error(`Failed to reset retryable jobs: ${error.message}`);
  }
}