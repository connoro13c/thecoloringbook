import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';
import { z } from 'zod';
import OpenAI from 'openai';
import { uploadTempPage, uploadUserPage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { buildColoringPrompt } from '@/lib/prompt-builder';


// -------------------------------------------------------------
// Zod schema for the vision-model JSON structure
// -------------------------------------------------------------
const ChildAttributeSchema = z.object({
  age: z.string(),
  hair_style: z.string(),
  headwear: z.string(),
  eyewear: z.string(),
  clothing: z.string(),
  pose: z.string(),
  main_object: z.string()
});
type ChildAttributes = z.infer<typeof ChildAttributeSchema>;

// Request validation schema
const CreateJobSchema = z.object({
  imageUrls: z.array(z.string().url()).length(1),
  scenePrompt: z.string().max(500).optional(),
  style: z.enum(['classic', 'ghibli', 'bold']).default('classic'),
  difficulty: z.number().int().min(1).max(5).default(3),
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
  anonymous: z.boolean().optional().default(false),
});



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

async function createAuthenticatedJob(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, scenePrompt: string, style: string, difficulty: number, orientation: string, imageUrls: string[], imageAnalysis: ChildAttributes) {
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      prompt: scenePrompt || "Turn this photo into a coloring book page",
      style: style.toUpperCase(),
      difficulty,
      status: 'PROCESSING',
      input_url: imageUrls[0],
      image_analysis: JSON.stringify(imageAnalysis)
    })
    .select()
    .single();

  if (jobError) {
    console.error('Job insert error:', jobError);
    throw new Error(`Failed to create job record: ${jobError.message}`);
  }

  return jobData;
}

// -------------------------------------------------------------
// analyseImageWithVision — strict JSON return, no markdown noise
// -------------------------------------------------------------
async function analyseImageWithVision(
  openai: OpenAI,
  imageUrl: string,
  userPrompt?: string
): Promise<ChildAttributes> {
  const prompt = userPrompt ?? `Analyse this photo and extract key features for creating a colouring‑book page. Return JSON ONLY with these exact keys (use "none" if absent):
${JSON.stringify({
  age: 'young child / toddler / school age',
  hair_style: 'e.g. short curly hair, long straight hair',
  headwear: 'e.g. baseball cap, headband, none',
  eyewear: 'e.g. round sunglasses, glasses, none',
  clothing: 'e.g. t‑shirt and shorts, dress with sleeves',
  pose: 'e.g. standing with arms raised, sitting cross‑legged',
  main_object: 'e.g. toy car, ball, none'
}, null, 2)}`;

  // Build the chat payload with enforced system instruction
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content: 'You are an image analyst. Respond ONLY with strict JSON, no markdown or extra text.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content ?? '{}';

  // Validate & parse; throw early if the model violated the contract
  const parsed = (() => {
    try {
      return ChildAttributeSchema.parse(JSON.parse(content));
    } catch (err) {
      console.error('[analyseImageWithVision] invalid JSON from vision model', err, '\nRaw content:\n', content);
      throw new Error('Vision model returned invalid JSON');
    }
  })();

  return parsed;
}

async function generateImage(openai: OpenAI, imageUrls: string[], scenePrompt: string, style: string, difficulty: number, orientation: string): Promise<{imageUrl: string, imageAnalysis: ChildAttributes}> {
  // Analyze the first uploaded image with GPT-4 Vision
  const childAttributes = await analyseImageWithVision(openai, imageUrls[0]);
  console.log('Image analysis:', childAttributes);
  
  // Build the coloring prompt using structured attributes
  const coloringPrompt = buildColoringPrompt(
    childAttributes,
    scenePrompt || 'Turn this photo into a coloring book page',
    difficulty,
    style
  );

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: coloringPrompt,
    n: 1,
    size: orientation === 'landscape' ? "1792x1024" : "1024x1792",
    quality: "hd",
    response_format: "url"
  });

  if (!response.data?.[0]?.url) {
    throw new Error('No image generated');
  }

  return {
    imageUrl: response.data[0].url,
    imageAnalysis: childAttributes
  };
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

    const { imageUrls, scenePrompt, style, difficulty, orientation, anonymous } = validation.data;

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
      sessionId = uuidv4();
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });

    try {
      console.log(`Starting generation for user ${userId}`);
      const startTime = Date.now();

      // Generate image with OpenAI
      const { imageUrl, imageAnalysis } = await generateImage(openai, imageUrls, scenePrompt || '', style, difficulty, orientation);

      let job: { id: string; user_id: string | null };

      if (anonymous) {
        job = await createAnonymousSession(supabase, sessionId as string);
      } else {
        job = await createAuthenticatedJob(supabase, userId as string, scenePrompt || '', style, difficulty, orientation, imageUrls, imageAnalysis);
      }

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
        imageAnalysis: imageAnalysis,
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