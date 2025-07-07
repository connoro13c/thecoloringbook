import { NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function GET() {
  try {
    // Test OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'OPENAI_API_KEY not configured' 
      }, { status: 500 })
    }

    // Test simple OpenAI call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say "hello" only.' }],
        max_tokens: 10
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      return NextResponse.json({ 
        success: true, 
        message: 'OpenAI API is working',
        details: {
          apiKeyPresent: !!process.env.OPENAI_API_KEY,
          apiKeyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...',
          testResponse: response.choices[0]?.message?.content || 'No response'
        }
      })

    } catch (apiError: any) {
      clearTimeout(timeoutId)
      
      if (apiError.name === 'AbortError') {
        return NextResponse.json({ 
          success: false, 
          error: 'OpenAI API timeout (>10s)' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: false, 
        error: `OpenAI API error: ${apiError.message}` 
      }, { status: 500 })
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
