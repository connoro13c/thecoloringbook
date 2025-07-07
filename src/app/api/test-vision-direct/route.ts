import { NextResponse } from 'next/server'
import { openai, OPENAI_MODELS } from '@/lib/openai'

export async function GET() {
  try {
    console.log('🔍 Testing Vision API directly...')
    
    // Valid 1x1 white pixel PNG in base64
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('⏰ Vision test timeout after 30 seconds')
      controller.abort()
    }, 30000)

    const response = await openai.chat.completions.create({
      model: OPENAI_MODELS.VISION,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What color is this pixel?'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage}`,
                detail: 'low'
              }
            }
          ]
        }
      ],
      max_tokens: 50,
      temperature: 0
    }, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    return NextResponse.json({ 
      success: true, 
      message: 'Vision API is working',
      details: {
        model: OPENAI_MODELS.VISION,
        response: response.choices[0]?.message?.content || 'No response',
        usage: response.usage
      }
    })

  } catch (error: any) {
    console.error('❌ Vision test error:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Vision API timeout (30s)' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: false, 
      error: `Vision API error: ${error.message}`,
      details: {
        status: error.status,
        code: error.code
      }
    }, { status: 500 })
  }
}
