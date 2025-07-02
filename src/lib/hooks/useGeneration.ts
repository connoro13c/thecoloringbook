import { useCallback } from 'react'
import type { ColoringStyle, GenerationRequest, GenerationResponse } from '@/types'

// File to base64 utility
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// API call function
async function generateColoringPage(request: GenerationRequest) {
  const response = await fetch('/api/v1/createJob', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

interface UseGenerationParams {
  onGeneratingChange: (isGenerating: boolean) => void
  onSuccess: (imageUrl: string, response?: GenerationResponse) => void
  onError: (error: string) => void
}

export function useGeneration({ onGeneratingChange, onSuccess, onError }: UseGenerationParams) {
  
  const generate = useCallback(async (params: {
    photo: File
    sceneDescription: string
    style: ColoringStyle
    difficulty?: number
    isPreview?: boolean
  }) => {
    try {
      onGeneratingChange(true)
      
      // Convert file to base64
      const photoBase64 = await fileToBase64(params.photo)
      
      // Call generation API
      const response = await generateColoringPage({
        photo: photoBase64,
        sceneDescription: params.sceneDescription,
        style: params.style,
        difficulty: params.difficulty || 3,
        isPreview: params.isPreview || false
      })
      
      if (response.success && response.data) {
        onSuccess(response.data.imageUrl, response)
        console.log('🎉 Generation complete!', response.data.metadata)
      } else {
        throw new Error(response.error || 'Generation failed')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      onError(errorMessage)
      console.error('Generation error:', err)
    } finally {
      onGeneratingChange(false)
    }
  }, [onGeneratingChange, onSuccess, onError])
  
  return { generate }
}
