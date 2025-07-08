import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GenerationService } from '@/lib/services/generation-service'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limiter'

// Request validation schema
const CreateJobSchema = z.object({
  photo: z.string().min(1, 'Photo is required'),
  sceneDescription: z.string().min(1, 'Scene description is required'),
  style: z.enum(['classic', 'ghibli', 'mandala']),
  difficulty: z.number().min(1).max(5).default(3),
  isPreview: z.boolean().default(false),

})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for AI generation
    const rateLimitResult = rateLimit(rateLimitConfigs.aiGeneration)(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait before trying again.',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      )
    }
    
    // Parse and validate request
    const body = await request.json()
    const validatedRequest = CreateJobSchema.parse(body)

    // Protect against oversized uploads (Vercel limit ~4.5MB)
    const MAX_BASE64 = 4_000_000 // ~3MB binary image
    if (validatedRequest.photo.length > MAX_BASE64) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Image too large (max 3MB). Please upload a smaller image.' 
        },
        { status: 413 }
      )
    }

    const supabase = await createClient()
    
    // For non-preview (full-res) generation, check authentication and credits
    // Skip credit checks for preview generation
    if (!validatedRequest.isPreview) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required for full-resolution generation' 
          },
          { status: 401 }
        )
      }

      // Check and deduct credits
      const { data: creditUsed, error: creditError } = await supabase
        .rpc('use_credits', { user_uuid: user.id, credit_count: 1 })

      if (creditError) {
        console.error('Credit deduction error:', creditError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error processing credits' 
          },
          { status: 500 }
        )
      }

      if (!creditUsed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient credits',
            code: 'INSUFFICIENT_CREDITS'
          },
          { status: 402 }
        )
      }
    }

    // Delegate to service layer
    const result = await GenerationService.generateColoringPage(validatedRequest)
    
    // Return appropriate status code based on result
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }

  } catch (error) {
    console.error('❌ API Route Error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // Log the actual error for debugging
    console.error('❌ Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })

    // Handle unexpected errors
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'coloring-page-generation',
    timestamp: new Date().toISOString()
  })
}
