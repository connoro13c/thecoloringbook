import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzePhoto } from '@/lib/ai/photo-analysis'

// Request validation schema
const AnalyzePhotoSchema = z.object({
  photo: z.string().min(1, 'Photo is required')
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting photo analysis API...')

    // Parse and validate request
    const body = await request.json()
    const { photo } = AnalyzePhotoSchema.parse(body)

    // Extract base64 data from data URL
    const base64Data = photo.replace(/^data:image\/[a-z]+;base64,/, '')
    
    console.log('📊 Analysis request details:', {
      photoSize: base64Data.length
    })

    // Analyze the photo with GPT-4o Vision
    console.log('👁️ Analyzing photo with GPT-4o Vision...')
    const photoAnalysis = await analyzePhoto(base64Data)
    
    console.log('✅ Photo analysis complete:', {
      childAge: photoAnalysis.child.age,
      appearance: photoAnalysis.child.appearance.substring(0, 60) + '...',
      complexity: photoAnalysis.suggestions.coloringComplexity,
      elements: photoAnalysis.suggestions.recommendedElements.slice(0, 3)
    })

    // Return success response
    const response = {
      success: true,
      data: photoAnalysis
    }

    console.log('🎉 Photo analysis API complete!')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Photo analysis failed:', error)
    
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

    // Handle known errors with user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'photo-analysis',
    timestamp: new Date().toISOString()
  })
}
