import { NextResponse } from 'next/server'
import { analyzePhoto } from '@/lib/ai/photo-analysis'

export async function POST(request: Request) {
  try {
    const { photoBase64 } = await request.json()
    
    if (!photoBase64) {
      return NextResponse.json({ error: 'photoBase64 required' }, { status: 400 })
    }

    console.log('🔍 Testing vision analysis...')
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Vision analysis timeout (30s)')), 30000)
    )
    
    const analysisPromise = analyzePhoto(photoBase64)
    
    const result = await Promise.race([analysisPromise, timeoutPromise])
    
    console.log('✅ Vision analysis complete')
    
    return NextResponse.json({ 
      success: true, 
      analysis: result 
    })

  } catch (error) {
    console.error('❌ Vision test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
