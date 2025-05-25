import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth-server'
import { z } from 'zod'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { uploadTempPage, uploadUserPage } from '@/lib/storage'
import { checkAnonymousRateLimit, recordAnonymousRequest, getRateLimitHeaders } from '@/lib/rate-limit'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Validation schema
const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500, 'Prompt too long'),
  style: z.enum(['classic', 'manga', 'bold'], { 
    errorMap: () => ({ message: 'Style must be classic, manga, or bold' })
  }),
  difficulty: z.number().int().min(1).max(5, 'Difficulty must be between 1 and 5'),
  inputUrl: z.string().url('Invalid input URL')
})

function getStylePrompt(style: string, difficulty: number): string {
  const basePrompt = "Convert this image into a clean, black and white line art coloring book page"
  
  const stylePrompts = {
    classic: `${basePrompt}. Use simple, clear outlines with moderate detail suitable for children.`,
    manga: `${basePrompt}. Use manga/anime style with bold, expressive lines and stylized features.`,
    bold: `${basePrompt}. Use thick, bold outlines with minimal detail, perfect for younger children.`
  }
  
  const difficultyAdjustments = {
    1: "Very simple lines, large areas to color, minimal detail.",
    2: "Simple lines with some basic details.",
    3: "Moderate detail level with clear defined areas.",
    4: "More detailed with smaller areas to color.",
    5: "Highly detailed with intricate patterns and fine lines."
  }
  
  return `${stylePrompts[style as keyof typeof stylePrompts]} ${difficultyAdjustments[difficulty as keyof typeof difficultyAdjustments]}`
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - both anonymous and authenticated users allowed)
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    const isAuthenticated = !!user
    const userId = user?.id

    // Rate limiting for anonymous users only
    if (!isAuthenticated) {
      const rateLimitResult = await checkAnonymousRateLimit(request)
      
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded', 
            message: 'Anonymous users are limited to 3 generations per hour. Create an account for unlimited access.',
            retryAfter: rateLimitResult.resetTime.toISOString()
          },
          { 
            status: 429,
            headers: getRateLimitHeaders(rateLimitResult)
          }
        )
      }
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = generateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { prompt, style, difficulty, inputUrl } = validation.data

    try {
      // Generate coloring book page using DALL-E 3
      const fullPrompt = `${prompt}. ${getStylePrompt(style, difficulty)} Remove all colors, keep only black outlines on white background. The image should be suitable for printing and coloring.`
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      })

      if (!response.data?.[0]?.url) {
        throw new Error('No image generated')
      }

      // Download the generated image
      const imageResponse = await fetch(response.data[0]!.url!)
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image')
      }
      
      const imageBuffer = await imageResponse.arrayBuffer()
      const filename = `coloring-page-${Date.now()}.jpg`

      if (isAuthenticated && userId) {
        // Authenticated user - save to permanent storage
        const uploadResult = await uploadUserPage(
          userId,
          filename,
          new Uint8Array(imageBuffer),
          { contentType: 'image/jpeg' }
        )

        // Save to pages table
        const { data: page, error: pageError } = await supabase
          .from('pages')
          .insert({
            user_id: userId,
            prompt,
            style,
            jpg_path: uploadResult.path
          })
          .select()
          .single()

        if (pageError) {
          console.error('Failed to save page record:', pageError)
        }

        return NextResponse.json({
          success: true,
          imageUrl: uploadResult.signedUrl,
          pageId: page?.id,
          expiresAt: null, // Permanent for authenticated users
          message: 'Page saved to your account'
        })
      }

      // Anonymous user - save to temporary storage
      const sessionId = uuidv4()
      
      // Create session record for cleanup tracking
      await supabase
      .from('page_sessions')
      .insert({ id: sessionId })

        // Record this request for rate limiting
        await recordAnonymousRequest(request, sessionId)

      const uploadResult = await uploadTempPage(
        sessionId,
        filename,
        new Uint8Array(imageBuffer),
        { contentType: 'image/jpeg' }
      )

      const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now

      // Get updated rate limit status for headers
      const rateLimitResult = await checkAnonymousRateLimit(request)

      return NextResponse.json({
        success: true,
        imageUrl: uploadResult.url,
        sessionId,
        expiresAt: expiresAt.toISOString(),
        message: 'Image will auto-delete in 2 minutes. Create an account to save it permanently!'
      }, {
        headers: getRateLimitHeaders(rateLimitResult)
      })

    } catch (error) {
      console.error('Failed to generate image:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image'
      
      return NextResponse.json(
        { error: 'Failed to generate coloring page', details: errorMessage },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Generate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}