import { analyzePhoto, type PhotoAnalysisResult } from '@/lib/ai/photo-analysis'
import { buildDallePrompt } from '@/lib/ai/prompt-builder'
import { generateColoringPage as generateColoringPageAI, downloadImage } from '@/lib/ai/image-generation'
import { uploadUserImage, generateFilename } from '@/lib/storage'
import { createPage } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'
import { ProgressiveLogger } from '@/lib/ai/progressive-logger'
import { createVisionMetrics, createImageMetrics } from '@/lib/ai/compact-logger'
import { isTestMode, getMockPhotoAnalysis, getRandomSamplePage, getSampleImageAsDataUrl } from '@/lib/test-mode'
import type { 
  GenerationRequest, 
  GenerationResponse, 
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
    // Use progressive logger for real-time CLI UX
    const logger = new ProgressiveLogger()
    
    try {
      // Check if we're in test mode (either env var or request flag)
      if (isTestMode() || (request as any).testMode) {
        return await this.generateTestColoringPage(request, logger)
      }

      // Extract base64 data from data URL
      const base64Data = request.photo.replace(/^data:image\/[a-z]+;base64,/, '')
      
      // Start job logging
      logger.startJob({
        style: request.style,
        difficulty: request.difficulty,
        scene: request.sceneDescription,
        photoSize: base64Data.length
      })

      // Step 1: Analyze the photo
      const photoAnalysis = await this.analyzePhoto(base64Data, logger)
      
      // Step 2: Build the prompt
      const dallePrompt = this.buildPrompt({
        photoAnalysis,
        sceneDescription: request.sceneDescription,
        style: request.style,
        difficulty: request.difficulty
      })

      // Step 3: Generate image
      const generationResult = await this.generateImage(dallePrompt, logger)
      
      // Step 4: Store image
      const storageResult = await this.storeImage(generationResult.imageUrl, logger)
      
      // Step 5: Save to database
      const pageRecord = await this.saveToDatabase({
        prompt: dallePrompt,
        style: request.style,
        difficulty: request.difficulty,
        jpgPath: storageResult.path,
        analysisOutput: photoAnalysis
      }, logger)
      
      // Add all collected data to tiered logger
      this.addVisionDataToLogger(logger, photoAnalysis)
      this.addImageDataToLogger(logger, generationResult, dallePrompt)
      this.addStorageDataToLogger(logger, storageResult, pageRecord)
      
      logger.completeJob()
      
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
      logger.logError('Generation failed', error)
      return this.handleError(error)
    }
  }

  /**
   * Test mode version that uses sample data and skips AI generation
   */
  private static async generateTestColoringPage(request: GenerationRequest, logger: ProgressiveLogger): Promise<GenerationResponse> {
    logger.startJob({
      style: request.style,
      difficulty: request.difficulty,
      scene: request.sceneDescription,
      photoSize: 1000,
      testMode: true
    })

    // Use mock photo analysis
    const photoAnalysis = getMockPhotoAnalysis()
    logger.updateVisionProgress('Using mock photo analysis (test mode)')

    // Get a sample coloring page based on style
    const samplePage = getRandomSamplePage()
    logger.updateImageProgress('Using sample coloring page (test mode)')

    // Convert SVG to data URL for consistent interface
    const imageDataUrl = await getSampleImageAsDataUrl(samplePage.jpgUrl)
    
    // Store the test image
    const storageResult = await this.storeImage(imageDataUrl, logger)
    
    // Build mock prompt
    const dallePrompt = `Test mode: ${request.sceneDescription} in ${request.style} style`
    
    // Save to database
    const pageRecord = await this.saveToDatabase({
      prompt: dallePrompt,
      style: request.style,
      difficulty: request.difficulty,
      jpgPath: storageResult.path,
      analysisOutput: photoAnalysis
    }, logger)

    // Add mock data to logger
    this.addVisionDataToLogger(logger, photoAnalysis)
    this.addImageDataToLogger(logger, { tokens: { prompt: 100 } }, dallePrompt)
    this.addStorageDataToLogger(logger, storageResult, pageRecord)

    logger.completeJob()

    return {
      success: true,
      data: {
        pageId: pageRecord.id,
        imageUrl: storageResult.publicUrl,
        imagePath: storageResult.path,
        analysis: photoAnalysis,
        prompt: dallePrompt,
        revisedPrompt: `Test mode: Generated ${samplePage.style} coloring page`,
        metadata: {
          style: request.style,
          difficulty: request.difficulty,
          sceneDescription: request.sceneDescription,
          generatedAt: new Date().toISOString(),
          testMode: true
        }
      }
    }
  }

  /**
   * Step 1: Analyze photo with GPT-4o Vision
   */
  private static async analyzePhoto(base64Data: string, logger: ProgressiveLogger): Promise<PhotoAnalysisResult> {
    const photoAnalysis = await analyzePhoto(base64Data, logger)
    return photoAnalysis
  }

  /**
   * Step 2: Build optimized prompt
   */
  private static buildPrompt(params: {
    photoAnalysis: PhotoAnalysisResult
    sceneDescription: string
    style: string
    difficulty: number
  }): string {
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
  private static async generateImage(prompt: string, logger: ProgressiveLogger) {
    const generationResult = await generateColoringPageAI(prompt, logger)
    return generationResult
  }

  /**
   * Step 4: Download and store image
   */
  private static async storeImage(imageUrl: string, logger: ProgressiveLogger) {
    logger.updateStorageProgress('Converting image to buffer');
    const imageBuffer = await downloadImage(imageUrl)
    
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const filename = generateFilename('coloring')
    
    let storageResult;
    if (user) {
      // For authenticated users, upload directly to their folder
      logger.updateStorageProgress('Uploading to user storage');
      storageResult = await uploadUserImage(imageBuffer, user.id, filename, 'image/png', logger)
    } else {
      // For anonymous users, upload to public folder using legacy method
      // (since uploadAnonymousFile expects File objects from frontend)
      logger.updateStorageProgress('Uploading to public storage');
      storageResult = await this.uploadBufferToPublic(imageBuffer, filename)
    }
    
    return storageResult
  }

  /**
   * Helper: Upload buffer to public folder for anonymous users
   */
  private static async uploadBufferToPublic(buffer: Buffer, filename: string) {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const filePath = `public/${filename}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('pages')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Anonymous storage upload failed:', error)
      throw new Error(`Anonymous storage upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('pages')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  }

  /**
   * Step 5: Save page record to database
   */
  private static async saveToDatabase(params: {
    prompt: string
    style: string
    difficulty: number
    jpgPath: string
    analysisOutput: PhotoAnalysisResult
  }, logger: ProgressiveLogger) {
    logger.updateStorageProgress('Saving to database');
    
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
    
    return pageRecord
  }

  /**
   * Add vision analysis data from actual OpenAI API response
   */
  private static addVisionDataToLogger(logger: ProgressiveLogger, photoAnalysis: PhotoAnalysisResult) {
    const visionMetrics = createVisionMetrics(
      photoAnalysis.tokens.prompt,
      photoAnalysis.tokens.completion
    )
    
    logger.addVisionData({
      cost: visionMetrics.cost,
      tokens: {
        input: photoAnalysis.tokens.prompt,
        output: photoAnalysis.tokens.completion
      },
      analysis: {
        age: photoAnalysis.child.age,
        appearance: photoAnalysis.child.appearance,
        pose: photoAnalysis.composition.pose,
        perspective: photoAnalysis.composition.perspective,
        elements: photoAnalysis.suggestions.recommendedElements,
        complexity: photoAnalysis.suggestions.coloringComplexity,
        usingFallback: photoAnalysis.child.age === '6-8 years old' && 
                      photoAnalysis.child.appearance.includes('shoulder-length hair, bright eyes')
      }
    })
  }

  /**
   * Add image generation data from actual OpenAI API response
   */
  private static addImageDataToLogger(logger: ProgressiveLogger, generationResult: { tokens?: { prompt: number } }, dallePrompt: string) {
    const imageTokens = generationResult.tokens?.prompt || Math.ceil(dallePrompt.length / 4)
    const imageMetrics = createImageMetrics(imageTokens, 'high')
    
    // Extract meaningful prompt excerpt - find the scene description part
    const sceneMatch = dallePrompt.match(/featuring this magical scene: (.+?)(?:\n|PRIMARY SCENE|$)/i)
    const meaningfulExcerpt = sceneMatch ? sceneMatch[1].trim() : dallePrompt.slice(0, 120)
    
    logger.addImageData({
      cost: imageMetrics.cost,
      tokens: {
        input: imageTokens,
        output: 0
      },
      promptSample: meaningfulExcerpt
    })
  }

  /**
   * Add storage data from actual file upload and database save
   */
  private static addStorageDataToLogger(logger: ProgressiveLogger, storageResult: { path: string }, pageRecord: { id: string }) {
    logger.addStorageData({
      fileName: storageResult.path.split('/').pop() || 'unknown',
      recordId: pageRecord.id
    })
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

// Export static method for testing
export const generateColoringPage = GenerationService.generateColoringPage
