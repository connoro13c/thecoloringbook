// Central type definitions for the coloring book application

// Coloring Styles
export type ColoringStyle = 'classic' | 'ghibli' | 'mandala'

// Photo Analysis Types
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

// Generation Request/Response Types
export interface GenerationRequest {
  photo: string // base64 data URL
  sceneDescription: string
  style: ColoringStyle
  difficulty: number
  isPreview?: boolean

}

export interface GenerationResponse {
  success: boolean
  data?: {
    pageId: string
    imageUrl: string
    imagePath: string
    analysis: PhotoAnalysis
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
  details?: Record<string, unknown>[]
}

// Database Types
export interface PageRecord {
  id: string
  user_id?: string
  prompt: string
  style: ColoringStyle
  difficulty: number
  jpg_path: string
  pdf_path?: string
  analysis_output?: PhotoAnalysis
  created_at: string
}

// Error Types
export interface StructuredError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ErrorCode = 
  | 'CONTENT_POLICY_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_IMAGE'
  | 'GENERATION_FAILED'
  | 'STORAGE_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

// Style Option Type
export interface StyleOption {
  id: ColoringStyle
  name: string
  description: string
  preview: string
}

// Generation State Types
export interface GenerationState {
  selectedPhoto: File | null
  sceneDescription: string
  selectedStyle: ColoringStyle | null
  isGenerating: boolean
  generatedImage: string | null
  error: string | null
  canGenerate: boolean
}

export type GenerationAction = 
  | { type: 'SET_PHOTO'; payload: File | null }
  | { type: 'SET_SCENE_DESCRIPTION'; payload: string }
  | { type: 'SET_STYLE'; payload: ColoringStyle | null }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_GENERATED_IMAGE'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_FORM' }
