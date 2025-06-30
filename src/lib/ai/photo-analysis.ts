import { openai, OPENAI_MODELS } from '@/lib/openai'
import type { CompactLogger } from './compact-logger'
import type { TieredLogger } from './tiered-logger'
import { createVisionMetrics } from './compact-logger'

export interface PhotoAnalysis {
  child: {
    age: string
    gender: string
    appearance: string
    clothing: string
    expression: string
  }
  composition: {
    pose: string
    perspective: string
    focus: string
  }
  suggestions: {
    coloringComplexity: 'simple' | 'medium' | 'complex'
    recommendedElements: string[]
  }
}

export interface PhotoAnalysisResult extends PhotoAnalysis {
  tokens: {
    prompt: number
    completion: number
  }
}

export async function analyzePhoto(imageBase64: string, logger?: CompactLogger | TieredLogger): Promise<PhotoAnalysisResult> {
  try {
    
    const response = await openai.chat.completions.create({
      model: OPENAI_MODELS.VISION,
      messages: [
        {
          role: 'system',
          content: `You are a technical image analysis tool for artistic illustration reference.

Analyze this photograph and provide structured technical data for creating an artistic illustration. Document the visual elements as reference material for an artist:

VISUAL ELEMENTS:
- Subject appearance: hair color/style, facial features, expression
- Clothing: colors, patterns, style details
- Accessories: hats, glasses, jewelry, or other worn items
- Pose and positioning in the frame
- Background and composition details

OUTPUT FORMAT:
Return only a JSON object with this exact structure:
{
  "child": {
    "age": "approximate age or age range",
    "gender": "apparent gender presentation", 
    "appearance": "hair color, style, facial features, expression",
    "clothing": "detailed clothing description with colors and style",
    "expression": "facial expression and mood"
  },
  "composition": {
    "pose": "body position and pose description",
    "perspective": "camera angle and framing",
    "focus": "main focal elements"
  },
  "suggestions": {
    "coloringComplexity": "simple, medium, or complex",
    "recommendedElements": ["array", "of", "decorative", "elements"]
  }
}

Provide only the JSON object, no other text.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide technical visual data in JSON format for artistic reference.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const usage = response.usage
    const content = response.choices[0]?.message?.content
    
    // Log metrics using logger if provided
    if (logger && usage) {
      const metrics = createVisionMetrics(usage.prompt_tokens, usage.completion_tokens)
      
      if ('logVision' in logger) {
        // CompactLogger
        logger.logVision(metrics)
      } else {
        // TieredLogger - will be handled in generation service
        logger.debug('Vision analysis completed', { tokens: usage, cost: metrics.cost })
      }
    }
    
    if (!content) {
      console.error('❌ No content in OpenAI response')
      throw new Error('No analysis received from OpenAI')
    }

    // Parse the JSON response
    try {
      // Strip markdown code blocks if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const analysis = JSON.parse(cleanContent) as PhotoAnalysis
      
      return {
        ...analysis,
        tokens: {
          prompt: usage?.prompt_tokens || 0,
          completion: usage?.completion_tokens || 0
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
      // Fallback analysis if JSON parsing fails
      return {
        child: {
          age: '6-8 years old',
          gender: 'child',
          appearance: 'young child with shoulder-length hair, bright eyes, and a warm smile',
          clothing: 'colorful casual outfit with comfortable play clothes',
          expression: 'happy and cheerful with a genuine smile'
        },
        composition: {
          pose: 'standing in a natural, relaxed position',
          perspective: 'mid-distance shot showing full body',
          focus: 'centered on child with clear view of face and clothing'
        },
        suggestions: {
          coloringComplexity: 'medium',
          recommendedElements: ['flowers', 'butterflies', 'rainbow', 'clouds', 'stars']
        },
        tokens: {
          prompt: usage?.prompt_tokens || 0,
          completion: usage?.completion_tokens || 0
        }
      }
    }
  } catch (error: unknown) {
    console.error('❌ Photo analysis failed with error:', error)
    
    const errorObj = error as { name?: string; message?: string; stack?: string; status?: number; error?: unknown }
    console.error('📍 Error details:', {
      name: errorObj?.name,
      message: errorObj?.message,
      stack: errorObj?.stack
    })
    
    // If it's an API error, log more details
    if (errorObj?.status) {
      console.error('🚨 OpenAI API Error Status:', errorObj.status)
      console.error('🚨 OpenAI API Error Details:', errorObj.error)
    }
    
    throw new Error('Failed to analyze photo. Please try again.')
  }
}
