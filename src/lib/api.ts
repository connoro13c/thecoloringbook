import type { ColoringStyle } from '@/components/forms/StyleSelection'

export interface GenerationRequest {
  photo: string // base64 data URL
  sceneDescription: string
  style: ColoringStyle
  difficulty?: number
}

export interface GenerationResponse {
  success: boolean
  data?: {
    imageUrl: string
    imagePath: string
    analysis: any
    prompt: string
    revisedPrompt?: string
    metadata: {
      style: ColoringStyle
      difficulty: number
      sceneDescription: string
      generatedAt: string
    }
  }
  error?: string
  details?: any
}

export async function generateColoringPage(request: GenerationRequest): Promise<GenerationResponse> {
  try {
    console.log('🚀 Calling generation API...')
    
    const response = await fetch('/api/v1/createJob', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        difficulty: request.difficulty || 3
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Generation failed')
    }

    console.log('✅ Generation API success')
    return data
  } catch (error) {
    console.error('❌ Generation API error:', error)
    throw error
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
