import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';
import { z } from 'zod';
import OpenAI from 'openai';
import { uploadTempPage, uploadUserPage } from '@/lib/storage';

// Request validation schema
const CreateJobSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(3),
  scenePrompt: z.string().max(500).optional(),
  style: z.enum(['classic', 'manga', 'bold']).default('classic'),
  difficulty: z.number().int().min(1).max(5).default(3),
  anonymous: z.boolean().optional().default(false),
});

// Style prompts mapping
const stylePrompts = {
  classic: 'classic cartoon coloring book style with simple, clean lines',
  manga: 'manga-inspired anime coloring book style with dynamic lines',
  bold: 'bold outline coloring book style with thick, prominent lines'
};

const difficultyModifiers = {
  1: 'very simple with minimal details',
  2: 'simple with basic details', 
  3: 'moderate detail level',
  4: 'detailed with intricate elements',
  5: 'highly detailed and complex'
};

async function createAnonymousSession(supabase: Awaited<ReturnType<typeof createClient>>, sessionId: string) {
  const { error: sessionError } = await supabase
    .from('page_sessions')
    .insert({
      id: sessionId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Session insert error:', sessionError);
    throw new Error(`Failed to create session record: ${sessionError.message}`);
  }

  return { id: sessionId as string, user_id: null };
}

async function createAuthenticatedJob(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, scenePrompt: string, style: string, difficulty: number, imageUrls: string[]) {
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      prompt: scenePrompt || "Turn this photo into a coloring book page",
      style: style.toUpperCase(),
      difficulty,
      status: 'PROCESSING',
      input_url: imageUrls[0]
    })
    .select()
    .single();

  if (jobError) {
    console.error('Job insert error:', jobError);
    throw new Error(`Failed to create job record: ${jobError.message}`);
  }

  return jobData;
}

async function generateImage(openai: OpenAI, scenePrompt: string, style: string, difficulty: number) {
  const stylePrompt = stylePrompts[style as keyof typeof stylePrompts];
  const difficultyPrompt = difficultyModifiers[difficulty as keyof typeof difficultyModifiers];
  
  const fullPrompt = `Create a black and white line art coloring book page. ${scenePrompt || "Turn this photo into a coloring book page"}. 
Style: ${stylePrompt}. 
Complexity: ${difficultyPrompt}. 
The image should be suitable for coloring with clear, distinct black outlines on white background. 
No shading, no filled areas, only clean line art perfect for coloring.`;

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    style: "natural",
    response_format: "url"
  });

  if (!response.data?.[0]?.url) {
    throw new Error('No image generated');
  }

  return response.data[0].url;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body first to check for anonymous flag
    const body = await request.json();
    const validation = CreateJobSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { imageUrls, scenePrompt, style, difficulty, anonymous } = validation.data;

    // Handle authentication - only required for authenticated generation
    const supabase = await createClient();
    let userId: string | null = null;
    let sessionId: string | null = null;

    if (!anonymous) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = user.id;
    } else {
      // Generate a temporary session ID for anonymous users
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    try {
      let job: { id: string; user_id: string | null };

      if (anonymous) {
        job = await createAnonymousSession(supabase, sessionId as string);
      } else {
        job = await createAuthenticatedJob(supabase, userId as string, scenePrompt || '', style, difficulty, imageUrls);
      }

      console.log(`Starting job ${job.id} for user ${userId}`);
      const startTime = Date.now();

      // Generate image with OpenAI
      const imageUrl = await generateImage(openai, scenePrompt || '', style, difficulty);

      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image');
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageData = new Uint8Array(imageBuffer);

      // Upload to storage - use appropriate bucket based on user type
      const filename = `${job.id}_output.png`;
      let uploadResult: { url?: string; signedUrl?: string; path: string };

      if (anonymous) {
        uploadResult = await uploadTempPage(
          sessionId as string,
          filename,
          imageData,
          { contentType: 'image/png' }
        );
      } else {
        uploadResult = await uploadUserPage(
          userId as string,
          filename,
          imageData,
          { contentType: 'image/png' }
        );
      }

      const processingTime = Date.now() - startTime;

      // Update job with success (only for authenticated users)
      if (!anonymous) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update({
            status: 'COMPLETED',
            output_url: uploadResult.url || uploadResult.signedUrl,
            processing_time_ms: processingTime
          })
          .eq('id', job.id);

        if (updateError) {
          console.error('Failed to update job:', updateError);
        }
      }

      console.log(`Generated coloring page for ${anonymous ? 'anonymous user' : `user ${userId}`}`);

      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: 'COMPLETED',
        imageUrl: uploadResult.url || uploadResult.signedUrl,
        message: 'Coloring page generated successfully',
        ...(anonymous && { sessionId }),
      });

    } catch (generationError) {
      console.error('Generation failed:', generationError);
      
      return NextResponse.json({
        error: generationError instanceof Error ? generationError.message : 'Generation failed',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create job API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Something went wrong' },
      { status: 500 }
    );
  }
}