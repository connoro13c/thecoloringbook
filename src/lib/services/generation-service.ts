import { analyzePhoto, type PhotoAnalysisResult } from '@/lib/ai/photo-analysis'
import { buildDallePrompt } from '@/lib/ai/prompt-builder'
import { generateColoringPage, downloadImage } from '@/lib/ai/image-generation'
import { uploadToStorage, generateFilename } from '@/lib/storage'
import { createPage } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'
import { CompactLogger } from '@/lib/ai/compact-logger'
import type { 
  GenerationRequest, 
  GenerationResponse, 
  PhotoAnalysis, 
  StructuredError,
  ColoringStyle 
} from '@/types'

/**
 * Core service for handling coloring page generation pipeline
 */
export class GenerationService {
  
  /**
   * Main orchestration method for generating a coloring page
   */
  static async generateColoringPage(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      console.log('🚀 Starting coloring page generation...')
      
      // Extract base64 data from data URL
      const base64Data = request.photo.replace(/^data:image\/[a-z]+;base64,/, '')
      
      console.log('📊 Request details:', {
        sceneDescription: request.sceneDescription.substring(0, 50) + '...',
        style: request.style,
        difficulty: request.difficulty,
        photoSize: base64Data.length
      })

      // Step 1: Analyze the photo
      const photoAnalysis = await this.analyzePhoto(base64Data)
      
      // Step 2: Build the prompt
      const dallePrompt = this.buildPrompt({
        photoAnalysis,
        sceneDescription: request.sceneDescription,
        style: request.style,
        difficulty: request.difficulty
      })

      // Step 3: Generate image
      const generationResult = await this.generateImage(dallePrompt)
      
      // Step 4: Store image
      const storageResult = await this.storeImage(generationResult.imageUrl)
      
      // Step 5: Save to database
      const pageRecord = await this.saveToDatabase({
        prompt: dallePrompt,
        style: request.style,
        difficulty: request.difficulty,
        jpgPath: storageResult.path,
        analysisOutput: photoAnalysis
      })
      
      console.log('🎉 Generation pipeline complete!')
      
      return {
        success: true,
        data: {
          pageId: pageRecord.id,
          imageUrl: storageResult.publicUrl,
          imagePath: storageResult.path,
          analysis: photoAnalysis,
          prompt: dallePrompt,
          revisedPrompt: generationResult.revisedPrompt,
          metadata: {
            style: request.style,
            difficulty: request.difficulty,
            sceneDescription: request.sceneDescription,
            generatedAt: new Date().toISOString()
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Generation failed:', error)
      return this.handleError(error)
    }
  }

  /**
   * Step 1: Analyze photo with GPT-4o Vision
   */
  private static async analyzePhoto(base64Data: string): Promise<PhotoAnalysis> {
    console.log('👁️ Step 1: Analyzing photo with GPT-4o Vision...')
    
    const photoAnalysis = await analyzePhoto(base64Data)
    
    console.log('✅ Photo analysis complete:', {
      childAge: photoAnalysis.child.age,
      appearance: photoAnalysis.child.appearance.substring(0, 60) + '...',
      complexity: photoAnalysis.suggestions.coloringComplexity,
      elements: photoAnalysis.suggestions.recommendedElements.slice(0, 3),
      usingFallback: photoAnalysis.child.age === '6-8 years old' && 
                    photoAnalysis.child.appearance.includes('shoulder-length hair, bright eyes')
    })
    
    return photoAnalysis
  }

  /**
   * Step 2: Build optimized prompt
   */
  private static buildPrompt(params: {
    photoAnalysis: PhotoAnalysis
    sceneDescription: string
    style: string
    difficulty: number
  }): string {
    console.log('📝 Step 2: Building optimized prompt...')
    
    return buildDallePrompt({
      photoAnalysis: params.photoAnalysis,
      sceneDescription: params.sceneDescription,
      style: params.style as ColoringStyle,
      difficulty: params.difficulty
    })
  }

  /**
   * Step 3: Generate image with gpt-image-1
   */
  private static async generateImage(prompt: string) {
    console.log('🎨 Step 3: Generating with gpt-image-1...')
    
    const generationResult = await generateColoringPage(prompt)
    
    console.log('✅ Generation successful')
    if (generationResult.revisedPrompt) {
      console.log('📝 gpt-image-1 revised prompt:', generationResult.revisedPrompt.substring(0, 100) + '...')
    }
    
    return generationResult
  }

  /**
   * Step 4: Download and store image
   */
  private static async storeImage(imageUrl: string) {
    console.log('💾 Step 4: Downloading and storing image...')
    
    const imageBuffer = await downloadImage(imageUrl)
    const filename = generateFilename('coloring')
    const storageResult = await uploadToStorage(imageBuffer, filename, 'image/png')
    
    console.log('✅ Storage complete:', storageResult.publicUrl)
    
    return storageResult
  }

  /**
   * Step 5: Save page record to database
   */
  private static async saveToDatabase(params: {
    prompt: string
    style: string
    difficulty: number
    jpgPath: string
    analysisOutput: PhotoAnalysis
  }) {
    console.log('💾 Step 5: Saving page to database...')
    
    // Get current user if authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const pageRecord = await createPage({
      user_id: user?.id,
      prompt: params.prompt,
      style: params.style,
      difficulty: params.difficulty,
      jpg_path: params.jpgPath,
      analysis_output: params.analysisOutput
    })
    
    console.log('✅ Page saved to database:', pageRecord.id)
    
    return pageRecord
  }

  /**
   * Handle and categorize errors
   */
  private static handleError(error: unknown): GenerationResponse {
    if (error instanceof Error) {
      const structuredError = this.categorizeError(error)
      
      return {
        success: false,
        error: structuredError.message
      }
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }

  /**
   * Categorize errors for better user experience
   */
  private static categorizeError(error: Error): StructuredError {
    const message = error.message.toLowerCase()
    
    // Content policy violations
    if (message.includes('content policy') || message.includes('safety')) {
      return {
        code: 'CONTENT_POLICY_VIOLATION',
        message: 'The uploaded image or description violates content policy. Please try with different content.'
      }
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('quota')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait a moment and try again.'
      }
    }
    
    // Invalid image
    if (message.includes('invalid image') || message.includes('unsupported format')) {
      return {
        code: 'INVALID_IMAGE',
        message: 'Please upload a clear JPG or PNG image of your child.'
      }
    }
    
    // Storage errors
    if (message.includes('storage') || message.includes('upload')) {
      return {
        code: 'STORAGE_ERROR',
        message: 'Failed to save your coloring page. Please try again.'
      }
    }
    
    // Generation failures
    if (message.includes('generation') || message.includes('openai')) {
      return {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate your coloring page. Please try again with a different photo or description.'
      }
    }
    
    // Default fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong. Please try again.'
    }
  }
}
