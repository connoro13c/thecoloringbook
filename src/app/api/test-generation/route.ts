import { NextResponse } from 'next/server'
import { generateColoringPage } from '@/lib/ai/image-generation'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    console.log('🎨 Testing image generation...')
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Image generation timeout (60s)')), 60000)
    )
    
    const generationPromise = generateColoringPage(prompt)
    
    const result = await Promise.race([generationPromise, timeoutPromise])
    
    console.log('✅ Image generation complete')
    
    return NextResponse.json({ 
      success: true, 
      result: {
        imageUrl: result.imageUrl ? 'Generated successfully' : 'No image URL',
        prompt: result.prompt,
        tokens: result.tokens
      }
    })

  } catch (error) {
    console.error('❌ Image generation test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
