import { useReducer } from 'react'
import type { GenerationState, GenerationAction, ColoringStyle } from '@/types'

// Initial state
const initialState: GenerationState = {
  selectedPhoto: null,
  sceneDescription: '',
  selectedStyle: null,
  isGenerating: false,
  generatedImage: null,
  error: null,
  canGenerate: false
}

// State reducer
function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case 'SET_PHOTO':
      const newPhoto = action.payload
      return {
        ...state,
        selectedPhoto: newPhoto,
        canGenerate: Boolean(newPhoto && state.sceneDescription.trim() && state.selectedStyle)
      }
      
    case 'SET_SCENE_DESCRIPTION':
      const newDescription = action.payload
      return {
        ...state,
        sceneDescription: newDescription,
        canGenerate: Boolean(state.selectedPhoto && newDescription.trim() && state.selectedStyle)
      }
      
    case 'SET_STYLE':
      const newStyle = action.payload
      return {
        ...state,
        selectedStyle: newStyle,
        canGenerate: Boolean(state.selectedPhoto && state.sceneDescription.trim() && newStyle)
      }
      
    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.payload,
        error: action.payload ? null : state.error // Clear error when starting generation
      }
      
    case 'SET_GENERATED_IMAGE':
      return {
        ...state,
        generatedImage: action.payload,
        isGenerating: false
      }
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isGenerating: false
      }
      
    case 'RESET_FORM':
      return initialState
      
    default:
      return state
  }
}

// Custom hook for generation state management
export function useGenerationState() {
  const [state, dispatch] = useReducer(generationReducer, initialState)
  
  // Action creators
  const actions = {
    setPhoto: (photo: File | null) => 
      dispatch({ type: 'SET_PHOTO', payload: photo }),
      
    setSceneDescription: (description: string) => 
      dispatch({ type: 'SET_SCENE_DESCRIPTION', payload: description }),
      
    setStyle: (style: ColoringStyle | null) => 
      dispatch({ type: 'SET_STYLE', payload: style }),
      
    setGenerating: (isGenerating: boolean) => 
      dispatch({ type: 'SET_GENERATING', payload: isGenerating }),
      
    setGeneratedImage: (imageUrl: string | null) => 
      dispatch({ type: 'SET_GENERATED_IMAGE', payload: imageUrl }),
      
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
      
    resetForm: () => 
      dispatch({ type: 'RESET_FORM' })
  }
  
  return { state, actions }
}
