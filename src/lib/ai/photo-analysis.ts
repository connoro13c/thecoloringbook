import { openai, OPENAI_MODELS } from '@/lib/openai'

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

export async function analyzePhoto(imageBase64: string): Promise<PhotoAnalysis> {
  try {
    console.log('🔍 Starting photo analysis...')
    console.log('📷 Image data length:', imageBase64.length)
    console.log('🔑 OpenAI API key present:', !!process.env.OPENAI_API_KEY)
    console.log('🔑 OpenAI API key first 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10))
    
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

    console.log('✅ OpenAI API call successful')
    console.log('📝 Raw response:', JSON.stringify(response, null, 2))

    const content = response.choices[0]?.message?.content
    console.log('📄 Content received:', content)
    
    if (!content) {
      console.error('❌ No content in OpenAI response')
      throw new Error('No analysis received from OpenAI')
    }

    // Parse the JSON response
    try {
      console.log('🔄 Attempting to parse JSON...')
      
      // Strip markdown code blocks if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        console.log('📝 Removing markdown JSON wrapper...')
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        console.log('📝 Removing markdown wrapper...')
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('🧹 Cleaned content:', cleanContent.substring(0, 100) + '...')
      
      const analysis = JSON.parse(cleanContent) as PhotoAnalysis
      console.log('✅ JSON parsed successfully from OpenAI Vision:', analysis)
      return analysis
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError)
      console.error('📄 Raw content that failed to parse:', content)
      console.log('⚠️ FALLING BACK TO DEFAULT ANALYSIS - Real photo details will be lost!')
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
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Photo analysis failed with error:', error)
    console.error('📍 Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    })
    
    // If it's an API error, log more details
    if (error?.status) {
      console.error('🚨 OpenAI API Error Status:', error.status)
      console.error('🚨 OpenAI API Error Details:', error.error)
    }
    
    throw new Error('Failed to analyze photo. Please try again.')
  }
}
