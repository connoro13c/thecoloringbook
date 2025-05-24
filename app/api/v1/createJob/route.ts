import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { addJob, type ColoringJobData } from '@/lib/queue';

// Request validation schema
const CreateJobSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(3),
  scenePrompt: z.string().max(500).optional(),
  style: z.enum(['classic', 'manga', 'bold']).default('classic'),
  difficulty: z.number().int().min(1).max(5).default(3),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateJobSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { imageUrls, scenePrompt, style, difficulty } = validation.data;

    // Generate unique job ID
    const jobId = uuidv4();

    // Prepare job data
    const jobData: ColoringJobData = {
      jobId,
      userId,
      imageUrls,
      scenePrompt,
      style,
      difficulty,
    };

    // Add job to queue
    await addJob(jobData);

    console.log(`Created job ${jobId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('Create job API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}