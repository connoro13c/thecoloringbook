import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzePhoto, type PhotoAnalysis } from '@/lib/ai/photo-analysis'
import { buildDallePrompt } from '@/lib/ai/prompt-builder'
import { generateColoringPage, downloadImage } from '@/lib/ai/image-generation'
import { uploadToStorage, generateFilename } from '@/lib/storage'
import { createPage } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'
import type { ColoringStyle } from '@/components/forms/StyleSelection'

// Request validation schema
const CreateJobSchema = z.object({
  photo: z.string().min(1, 'Photo is required'),
  sceneDescription: z.string().min(1, 'Scene description is required'),
  style: z.enum(['classic', 'ghibli', 'mandala']),
  difficulty: z.number().min(1).max(5).default(3),
  // Optional pre-analyzed photo data
  photoAnalysis: z.object({
    child: z.object({
      age: z.string(),
      gender: z.string(),
      appearance: z.string(),
      clothing: z.string(),
      expression: z.string()
    }),
    composition: z.object({
      pose: z.string(),
      perspective: z.string(),
      focus: z.string()
    }),
    suggestions: z.object({
      coloringComplexity: z.enum(['simple', 'medium', 'complex']),
      recommendedElements: z.array(z.string())
    })
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting coloring page generation...')

    // Parse and validate request
    const body = await request.json()
    const { photo, sceneDescription, style, difficulty, photoAnalysis: preAnalysis } = CreateJobSchema.parse(body)

    // Extract base64 data from data URL
    const base64Data = photo.replace(/^data:image\/[a-z]+;base64,/, '')
    
    console.log('📊 Request details:', {
      sceneDescription: sceneDescription.substring(0, 50) + '...',
      style,
      difficulty,
      photoSize: base64Data.length
    })

    // Step 1: Analyze the photo with GPT-4o Vision (or use pre-analysis)
    let photoAnalysis: PhotoAnalysis
    
    if (preAnalysis) {
      console.log('✅ Using pre-analyzed photo data (skipping analysis step)')
      photoAnalysis = preAnalysis
    } else {
      console.log('👁️ Step 1: Analyzing photo with GPT-4o Vision...')
      photoAnalysis = await analyzePhoto(base64Data)
    }
    
    console.log('✅ Photo analysis ready:', {
      childAge: photoAnalysis.child.age,
      appearance: photoAnalysis.child.appearance.substring(0, 60) + '...',
      complexity: photoAnalysis.suggestions.coloringComplexity,
      elements: photoAnalysis.suggestions.recommendedElements.slice(0, 3),
      source: preAnalysis ? 'pre-analyzed' : 'fresh-analysis',
      // Check if this is fallback data (contains default text)
      usingFallback: photoAnalysis.child.age === '6-8 years old' && 
                    photoAnalysis.child.appearance.includes('shoulder-length hair, bright eyes')
    })

    // Step 2: Build the perfect prompt
    console.log('📝 Step 2: Building optimized prompt...')
    const dallePrompt = buildDallePrompt({
      photoAnalysis,
      sceneDescription,
      style: style as ColoringStyle,
      difficulty
    })

    // Step 3: Generate with gpt-image-1
    console.log('🎨 Step 3: Generating with gpt-image-1...')
    const generationResult = await generateColoringPage(dallePrompt)
    
    console.log('✅ Generation successful')
    if (generationResult.revisedPrompt) {
      console.log('📝 gpt-image-1 revised prompt:', generationResult.revisedPrompt.substring(0, 100) + '...')
    }

    // Step 4: Download and store the image
    console.log('💾 Step 4: Downloading and storing image...')
    const imageBuffer = await downloadImage(generationResult.imageUrl)
    
    const filename = generateFilename('coloring')
    const storageResult = await uploadToStorage(imageBuffer, filename, 'image/png')
    
    console.log('✅ Storage complete:', storageResult.publicUrl)

    // Step 5: Save to database with analysis output
    console.log('💾 Step 5: Saving page to database...')
    
    // Get current user if authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const pageRecord = await createPage({
      user_id: user?.id,
      prompt: dallePrompt,
      style,
      difficulty,
      jpg_path: storageResult.path
      // analysis_output: photoAnalysis // TODO: Add this column to database
    })
    
    console.log('✅ Page saved to database:', pageRecord.id)

    // Step 6: Return success response
    const response = {
      success: true,
      data: {
        pageId: pageRecord.id,
        imageUrl: storageResult.publicUrl,
        imagePath: storageResult.path,
        analysis: photoAnalysis,
        prompt: dallePrompt,
        revisedPrompt: generationResult.revisedPrompt,
        metadata: {
          style,
          difficulty,
          sceneDescription,
          generatedAt: new Date().toISOString()
        }
      }
    }

    console.log('🎉 Generation pipeline complete!')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Generation failed:', error)
    
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
    service: 'coloring-page-generation',
    timestamp: new Date().toISOString()
  })
}
