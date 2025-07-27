'use client'

import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { PhotoAnalysisResult } from '@/lib/ai/photo-analysis'

export interface AdventureWizardState {
  // Core state
  currentStep: 'photo' | 'adventure' | 'location' | 'companion' | 'preview'
  
  // Photo upload and analysis
  selectedPhoto: File | null
  photoAnalysis: PhotoAnalysisResult | null
  isAnalyzing: boolean
  analysisError: string | null
  
  // Adventure selection
  adventureType: string | null
  
  // Location selection  
  location: string | null
  
  // Companion selection
  companion: string | null
  
  // Generated story and preview
  story: string | null
  previewImage: string | null
  isGenerating: boolean
  generationError: string | null
  
  // Progress tracking
  isComplete: boolean
}

export type AdventureWizardAction =
  | { type: 'SET_STEP'; payload: AdventureWizardState['currentStep'] }
  | { type: 'SET_PHOTO'; payload: File | null }
  | { type: 'SET_ANALYSIS_LOADING'; payload: boolean }
  | { type: 'SET_PHOTO_ANALYSIS'; payload: PhotoAnalysisResult }
  | { type: 'SET_ANALYSIS_ERROR'; payload: string | null }
  | { type: 'SET_ADVENTURE_TYPE'; payload: string | null }
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_COMPANION'; payload: string | null }
  | { type: 'SET_STORY'; payload: string | null }
  | { type: 'SET_PREVIEW_IMAGE'; payload: string | null }
  | { type: 'SET_GENERATION_LOADING'; payload: boolean }
  | { type: 'SET_GENERATION_ERROR'; payload: string | null }
  | { type: 'SET_COMPLETE'; payload: boolean }
  | { type: 'RESET_WIZARD' }

const initialState: AdventureWizardState = {
  currentStep: 'photo',
  selectedPhoto: null,
  photoAnalysis: null,
  isAnalyzing: false,
  analysisError: null,
  adventureType: null,
  location: null,
  companion: null,
  story: null,
  previewImage: null,
  isGenerating: false,
  generationError: null,
  isComplete: false
}

function adventureWizardReducer(state: AdventureWizardState, action: AdventureWizardAction): AdventureWizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    
    case 'SET_PHOTO':
      return { 
        ...state, 
        selectedPhoto: action.payload,
        photoAnalysis: action.payload ? state.photoAnalysis : null,
        analysisError: null
      }
    
    case 'SET_ANALYSIS_LOADING':
      return { ...state, isAnalyzing: action.payload }
    
    case 'SET_PHOTO_ANALYSIS':
      return { 
        ...state, 
        photoAnalysis: action.payload,
        isAnalyzing: false,
        analysisError: null
      }
    
    case 'SET_ANALYSIS_ERROR':
      return { 
        ...state, 
        analysisError: action.payload,
        isAnalyzing: false
      }
    
    case 'SET_ADVENTURE_TYPE':
      return { ...state, adventureType: action.payload }
    
    case 'SET_LOCATION':
      return { ...state, location: action.payload }
    
    case 'SET_COMPANION':
      return { ...state, companion: action.payload }
    
    case 'SET_STORY':
      return { ...state, story: action.payload }
    
    case 'SET_PREVIEW_IMAGE':
      return { ...state, previewImage: action.payload }
    
    case 'SET_GENERATION_LOADING':
      return { ...state, isGenerating: action.payload }
    
    case 'SET_GENERATION_ERROR':
      return { 
        ...state, 
        generationError: action.payload,
        isGenerating: false
      }
    
    case 'SET_COMPLETE':
      return { ...state, isComplete: action.payload }
    
    case 'RESET_WIZARD':
      return initialState
    
    default:
      return state
  }
}

interface AdventureWizardContextType {
  state: AdventureWizardState
  dispatch: React.Dispatch<AdventureWizardAction>
  
  // Convenience methods
  setStep: (step: AdventureWizardState['currentStep']) => void
  setPhoto: (photo: File | null) => void
  setPhotoAnalysis: (analysis: PhotoAnalysisResult) => void
  setAdventureType: (type: string | null) => void
  setLocation: (location: string | null) => void
  setCompanion: (companion: string | null) => void
  nextStep: () => void
  previousStep: () => void
  resetWizard: () => void
  
  // Computed properties
  canProceedFromPhoto: boolean
  canProceedFromAdventure: boolean
  canProceedFromLocation: boolean
  canProceedFromCompanion: boolean
  isReadyForGeneration: boolean
}

const AdventureWizardContext = createContext<AdventureWizardContextType | undefined>(undefined)

export function AdventureWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adventureWizardReducer, initialState)
  
  // Convenience methods
  const setStep = (step: AdventureWizardState['currentStep']) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }
  
  const setPhoto = (photo: File | null) => {
    dispatch({ type: 'SET_PHOTO', payload: photo })
  }
  
  const setPhotoAnalysis = (analysis: PhotoAnalysisResult) => {
    dispatch({ type: 'SET_PHOTO_ANALYSIS', payload: analysis })
  }
  
  const setAdventureType = (type: string | null) => {
    dispatch({ type: 'SET_ADVENTURE_TYPE', payload: type })
  }
  
  const setLocation = (location: string | null) => {
    dispatch({ type: 'SET_LOCATION', payload: location })
  }
  
  const setCompanion = (companion: string | null) => {
    dispatch({ type: 'SET_COMPANION', payload: companion })
  }
  
  const nextStep = () => {
    const stepOrder: AdventureWizardState['currentStep'][] = ['photo', 'adventure', 'location', 'companion', 'preview']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1])
    }
  }
  
  const previousStep = () => {
    const stepOrder: AdventureWizardState['currentStep'][] = ['photo', 'adventure', 'location', 'companion', 'preview']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1])
    }
  }
  
  const resetWizard = () => {
    dispatch({ type: 'RESET_WIZARD' })
  }
  
  // Computed properties
  const canProceedFromPhoto = Boolean(state.selectedPhoto && state.photoAnalysis && !state.isAnalyzing)
  const canProceedFromAdventure = Boolean(state.adventureType)
  const canProceedFromLocation = Boolean(state.location)
  const canProceedFromCompanion = Boolean(state.companion)
  const isReadyForGeneration = Boolean(
    state.selectedPhoto && 
    state.photoAnalysis && 
    state.adventureType && 
    state.location && 
    state.companion
  )
  
  const contextValue: AdventureWizardContextType = {
    state,
    dispatch,
    setStep,
    setPhoto,
    setPhotoAnalysis,
    setAdventureType,
    setLocation,
    setCompanion,
    nextStep,
    previousStep,
    resetWizard,
    canProceedFromPhoto,
    canProceedFromAdventure,
    canProceedFromLocation,
    canProceedFromCompanion,
    isReadyForGeneration
  }
  
  return (
    <AdventureWizardContext.Provider value={contextValue}>
      {children}
    </AdventureWizardContext.Provider>
  )
}

export function useAdventureWizard() {
  const context = useContext(AdventureWizardContext)
  if (context === undefined) {
    throw new Error('useAdventureWizard must be used within an AdventureWizardProvider')
  }
  return context
}
