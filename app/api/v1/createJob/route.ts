import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

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

    // Build prompt for the uploaded image
    const basePrompt = scenePrompt || "Turn this photo into a coloring book page";
    
    // Call the generate API directly
    const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        prompt: basePrompt,
        style,
        difficulty,
        inputUrl: imageUrls[0], // Use first uploaded image
      }),
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      throw new Error(error.error || 'Generation failed');
    }

    const result = await generateResponse.json();

    console.log(`Generated coloring page for user ${userId}`);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      status: result.status,
      imageUrl: result.outputUrl,
      message: 'Coloring page generated successfully',
    });
  } catch (error) {
    console.error('Create job API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}