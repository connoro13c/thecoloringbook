import { useCallback } from 'react'

import type { ColoringStyle, GenerationRequest, GenerationResponse } from '@/types'

// File to base64 utility with automatic resizing
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Resize to max 1024px on the longest side for Vision API
      const maxSize = 1024
      let { width, height } = img
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to base64 with quality compression
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve(dataUrl)
    }
    
    img.onerror = reject
    
    // Create blob URL to load the image
    const reader = new FileReader()
    reader.onload = () => img.src = reader.result as string
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
        isPreview: params.isPreview || false,

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
