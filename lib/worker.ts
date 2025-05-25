import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage';
import { 
  getNextJob, 
  getRetryableJobs, 
  resetRetryableJobs,
  startJob, 
  completeJob, 
  failJob, 
  type QueueJob 
} from './queue';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stylePrompts = {
  classic: 'classic children\'s coloring book style with clean, simple lines',
  manga: 'manga-inspired anime coloring book style with dynamic lines',
  bold: 'bold outline coloring book style with thick, prominent lines'
}

const difficultyModifiers: Record<number, string> = {
  1: 'very simple with minimal details',
  2: 'simple with basic details', 
  3: 'moderate detail level',
  4: 'detailed with intricate elements',
  5: 'highly detailed and complex'
}

/**
 * Process a single queue job
 */
async function processJob(queueJob: QueueJob): Promise<void> {
  console.log(`Processing job ${queueJob.job_id}`);
  
  try {
    // Mark job as processing
    await startJob(queueJob.id);
    
    // Update main job status
    await supabase
      .from('jobs')
      .update({ status: 'PROCESSING' })
      .eq('id', queueJob.job_id);

    const { prompt, style, difficulty, input_url } = queueJob.payload;
    const startTime = Date.now();

    // Build OpenAI prompt
    const stylePrompt = stylePrompts[style as keyof typeof stylePrompts];
    const difficultyPrompt = difficultyModifiers[difficulty];
    
    const fullPrompt = `Create a black and white line art coloring book page. ${prompt}. 
Style: ${stylePrompt}. 
Complexity: ${difficultyPrompt}. 
The image should be suitable for coloring with clear, distinct black outlines on white background. 
No shading, no filled areas, only clean line art perfect for coloring.`;

    // Generate image with OpenAI
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
      n: 1
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    // Download and upload the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // Upload to Supabase Storage
    const fileName = `${queueJob.job_id}_output.png`;
    const uploadResult = await StorageService.upload(
      queueJob.user_id,
      fileName,
      imageBytes,
      { contentType: 'image/png' }
    );

    const processingTime = Date.now() - startTime;

    // Update main job with success
    await supabase
      .from('jobs')
      .update({
        status: 'COMPLETED',
        output_url: uploadResult.url,
        processing_time_ms: processingTime
      })
      .eq('id', queueJob.job_id);

    // Mark queue job as completed
    await completeJob(queueJob.id);

    console.log(`Job ${queueJob.job_id} completed successfully`);

  } catch (error) {
    console.error(`Job ${queueJob.job_id} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update main job with failure
    await supabase
      .from('jobs')
      .update({
        status: 'FAILED',
        error_message: errorMessage
      })
      .eq('id', queueJob.job_id);

    // Mark queue job as failed (will handle retries automatically)
    await failJob(queueJob.id, errorMessage);
  }
}

/**
 * Process all available jobs in the queue
 */
export async function processQueue(): Promise<void> {
  console.log('Starting queue processing...');
  
  try {
    // First, reset any retryable jobs back to pending
    await resetRetryableJobs();
    
    // Process jobs one by one
    let job = await getNextJob();
    let processedCount = 0;
    
    while (job && processedCount < 10) { // Limit to 10 jobs per run to prevent infinite loops
      await processJob(job);
      processedCount++;
      
      // Get next job
      job = await getNextJob();
    }
    
    if (processedCount > 0) {
      console.log(`Processed ${processedCount} jobs`);
    } else {
      console.log('No jobs to process');
    }
    
  } catch (error) {
    console.error('Queue processing error:', error);
  }
}

/**
 * Start the worker (for continuous processing)
 */
export function startWorker(intervalMs: number = 10000): NodeJS.Timeout {
  console.log(`Starting worker with ${intervalMs}ms interval`);
  
  // Process immediately
  processQueue();
  
  // Then process at intervals
  return setInterval(() => {
    processQueue();
  }, intervalMs);
}

/**
 * Stop the worker
 */
export function stopWorker(timer: NodeJS.Timeout): void {
  clearInterval(timer);
  console.log('Worker stopped');
}

/**
 * Process a single job by ID (for manual processing)
 */
export async function processSingleJob(jobId: string): Promise<void> {
  const { data: queueJob, error } = await supabase
    .from('job_queue')
    .select('*')
    .eq('job_id', jobId)
    .single();

  if (error) {
    throw new Error(`Failed to find queue job: ${error.message}`);
  }

  await processJob(queueJob);
}