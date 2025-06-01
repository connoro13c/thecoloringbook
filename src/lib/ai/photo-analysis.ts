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
    const response = await openai.chat.completions.create({
      model: OPENAI_MODELS.VISION,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing photos of children to create perfect coloring book pages. 
          
          Analyze the photo and provide detailed information that will help generate a personalized coloring page.
          
          Focus on:
          - Child's appearance, age, clothing, expression
          - Setting, background, objects present
          - Composition and pose
          - Suggestions for coloring complexity based on apparent age
          - Elements that could be enhanced or added for a magical coloring experience
          
          Return ONLY a valid JSON object with the exact structure requested.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this photo of a child and provide detailed information for creating a personalized coloring page. Return the analysis as a JSON object with the structure: { child: { age, gender, appearance, clothing, expression }, setting: { location, background, lighting, objects }, composition: { pose, perspective, focus }, suggestions: { coloringComplexity, recommendedElements } }'
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

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No analysis received from OpenAI')
    }

    // Parse the JSON response
    try {
      const analysis = JSON.parse(content) as PhotoAnalysis
      return analysis
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      // Fallback analysis if JSON parsing fails
      return {
        child: {
          age: 'child',
          gender: 'child',
          appearance: 'a young child',
          clothing: 'casual clothing',
          expression: 'happy'
        },
        setting: {
          location: 'indoor setting',
          background: 'simple background',
          lighting: 'natural lighting',
          objects: []
        },
        composition: {
          pose: 'standing pose',
          perspective: 'front view',
          focus: 'full body'
        },
        suggestions: {
          coloringComplexity: 'medium',
          recommendedElements: ['flowers', 'butterflies', 'rainbow']
        }
      }
    }
  } catch (error) {
    console.error('Photo analysis failed:', error)
    throw new Error('Failed to analyze photo. Please try again.')
  }
}
