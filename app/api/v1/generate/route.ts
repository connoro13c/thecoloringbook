import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { StorageService } from '@/lib/storage'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const generateSchema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.enum(['CLASSIC', 'MANGA', 'BOLD']),
  difficulty: z.number().int().min(1).max(5),
  inputUrl: z.string().url().optional()
})

const stylePrompts = {
  CLASSIC: 'classic cartoon coloring book style with simple, clean lines',
  MANGA: 'manga-inspired anime coloring book style with dynamic lines',
  BOLD: 'bold outline coloring book style with thick, prominent lines'
}

const difficultyModifiers = {
  1: 'very simple with minimal details',
  2: 'simple with basic details', 
  3: 'moderate detail level',
  4: 'detailed with intricate elements',
  5: 'highly detailed and complex'
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, style, difficulty, inputUrl } = generateSchema.parse(body)

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        prompt,
        style,
        difficulty,
        status: 'PROCESSING',
        input_url: inputUrl
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json(
        { error: 'Failed to create job' }, 
        { status: 500 }
      )
    }

    const startTime = Date.now()

    try {
      // Build OpenAI prompt
      const stylePrompt = stylePrompts[style]
      const difficultyPrompt = difficultyModifiers[difficulty]
      
      const fullPrompt = `Create a black and white line art coloring book page. ${prompt}. 
Style: ${stylePrompt}. 
Complexity: ${difficultyPrompt}. 
The image should be suitable for coloring with clear, distinct black outlines on white background. 
No shading, no filled areas, only clean line art perfect for coloring.`

      // Generate image with OpenAI
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        style: "natural",
        response_format: "url"
      })

      if (!response.data?.[0]?.url) {
        throw new Error('No image generated')
      }

      // Download the generated image
      const imageResponse = await fetch(response.data[0].url)
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image')
      }
      
      const imageBuffer = await imageResponse.arrayBuffer()
      const imageData = new Uint8Array(imageBuffer)

      // Upload to storage
      const filename = `${job.id}_output.png`
      const uploadResult = await StorageService.upload(
        userId,
        filename,
        imageData,
        { contentType: 'image/png' }
      )

      const processingTime = Date.now() - startTime

      // Update job with success
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          status: 'COMPLETED',
          output_url: uploadResult.url,
          processing_time_ms: processingTime
        })
        .eq('id', job.id)

      if (updateError) {
        console.error('Failed to update job:', updateError)
      }

      return NextResponse.json({
        jobId: job.id,
        status: 'COMPLETED',
        outputUrl: uploadResult.url,
        processingTimeMs: processingTime
      })

    } catch (generationError) {
      console.error('Generation failed:', generationError)
      
      // Update job with failure
      await supabase
        .from('jobs')
        .update({
          status: 'FAILED',
          error_message: generationError instanceof Error ? generationError.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime
        })
        .eq('id', job.id)

      return NextResponse.json(
        { 
          error: 'Image generation failed',
          jobId: job.id,
          status: 'FAILED'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Generate API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}