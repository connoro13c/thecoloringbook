import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailure: 100,
  maxRetriesPerRequest: 3,
};

const connection = new IORedis(redisConfig);

// Job types
export interface ColoringJobData {
  jobId: string;
  userId: string;
  imageUrls: string[];
  scenePrompt?: string;
  style: 'classic' | 'manga' | 'bold';
  difficulty: number; // 1-5
}

export interface JobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  imageUrl?: string;
  pdfUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Create the coloring job queue
export const coloringQueue = new Queue<ColoringJobData>('coloring-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Job processing worker
export const createWorker = () => {
  return new Worker<ColoringJobData>(
    'coloring-jobs',
    async (job: Job<ColoringJobData>) => {
      const { jobId, userId, imageUrls, scenePrompt, style, difficulty } = job.data;
      
      try {
        const { ampClient, buildAmpPrompt } = await import('./amp');
        const { uploadToS3 } = await import('./s3');
        
        // Update progress
        await job.updateProgress(10);
        console.log(`Starting job ${jobId} for user ${userId}`);
        
        // Step 1: Face detection and cropping
        await job.updateProgress(25);
        
        try {
          await ampClient.detectFaces({ imageUrl: imageUrls[0] });
          console.log(`Face detection completed for job ${jobId}`);
        } catch (error) {
          console.warn(`Face detection failed for job ${jobId}, using original image:`, error);
        }
        
        // Step 2: Build prompt for AI generation
        await job.updateProgress(40);
        const prompt = buildAmpPrompt(scenePrompt, style, difficulty);
        console.log(`Prompt built for job ${jobId}: ${prompt}`);
        
        // Step 3: AI image generation
        await job.updateProgress(60);
        const generatedImage = await ampClient.generateImage({
          prompt,
          style,
          width: 512,
          height: 512,
          model: 'dalle-3',
        });
        console.log(`AI generation completed for job ${jobId}`);
        
        // Step 4: Line art conversion
        await job.updateProgress(80);
        const lineArtUrl = await ampClient.convertToLineArt(generatedImage.imageUrl);
        console.log(`Line art conversion completed for job ${jobId}`);
        
        // Step 5: Upload image to S3
        await job.updateProgress(85);
        const s3ImageUrl = await uploadToS3(lineArtUrl, `coloring-pages/${jobId}.png`);
        
        // Step 6: Generate PDF from image(s)
        await job.updateProgress(90);
        const { generatePDFFromImages } = await import('./pdf');
        const pdfBuffer = await generatePDFFromImages({
          imageUrls: [s3ImageUrl],
          title: `Coloring Page - ${jobId}`,
          author: 'Coloring Book App',
          subject: scenePrompt ? `Custom coloring page: ${scenePrompt}` : 'Custom coloring page',
          fitToPage: true,
          quality: 95, // High quality for print
        });
        
        // Upload PDF to S3
        const pdfUrl = await uploadToS3(pdfBuffer, `coloring-pages/${jobId}.pdf`, 'application/pdf');
        
        await job.updateProgress(100);
        const result = {
          imageUrl: s3ImageUrl,
          pdfUrl: pdfUrl,
        };
        
        console.log(`Job ${jobId} completed successfully`);
        return result;
      } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );
};



// Utility functions
export async function addJob(data: ColoringJobData): Promise<Job<ColoringJobData>> {
  return await coloringQueue.add('process-coloring', data, {
    jobId: data.jobId,
  });
}

export async function getJobStatus(jobId: string): Promise<JobResult | null> {
  const job = await coloringQueue.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  const state = await job.getState();
  const progress = job.progress as number || 0;
  
  let status: JobResult['status'] = 'pending';
  if (state === 'active') status = 'processing';
  else if (state === 'completed') status = 'completed';
  else if (state === 'failed') status = 'failed';
  
  return {
    jobId,
    status,
    progress,
    imageUrl: job.returnvalue?.imageUrl,
    pdfUrl: job.returnvalue?.pdfUrl,
    error: job.failedReason,
    createdAt: new Date(job.timestamp),
    completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
  };
}