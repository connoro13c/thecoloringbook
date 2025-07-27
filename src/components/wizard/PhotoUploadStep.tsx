'use client'

import React, { useCallback } from 'react'
import { PhotoUpload } from '@/components/forms/PhotoUpload'
import { useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { analyzePhoto } from '@/lib/ai/photo-analysis'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'

export function PhotoUploadStep() {
  const { 
    state, 
    dispatch, 
    setPhoto, 
    setPhotoAnalysis, 
    nextStep,
    canProceedFromPhoto 
  } = useAdventureWizard()

  const handlePhotoSelect = useCallback(async (file: File | null) => {
    setPhoto(file)
    
    if (!file) return
    
    try {
      dispatch({ type: 'SET_ANALYSIS_LOADING', payload: true })
      dispatch({ type: 'SET_ANALYSIS_ERROR', payload: null })
      
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
          
          // Analyze photo with GPT-4o Vision
          const analysis = await analyzePhoto(base64Data)
          setPhotoAnalysis(analysis)
          
        } catch (error) {
          console.error('Photo analysis failed:', error)
          dispatch({ 
            type: 'SET_ANALYSIS_ERROR', 
            payload: error instanceof Error ? error.message : 'Failed to analyze photo'
          })
        }
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Photo processing failed:', error)
      dispatch({ 
        type: 'SET_ANALYSIS_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to process photo'
      })
    }
  }, [setPhoto, setPhotoAnalysis, dispatch])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
          Start Your Adventure
        </h1>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          Upload your child&apos;s photo to create a personalized coloring adventure
        </p>
      </div>

      <PhotoUpload 
        onPhotoSelect={handlePhotoSelect}
        selectedPhoto={state.selectedPhoto}
      />

      {state.isAnalyzing && (
        <Card className="p-6 bg-primary-indigo/5 border-primary-indigo/20">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-indigo" />
            <span className="text-primary-indigo font-medium">
              Analyzing your photo...
            </span>
          </div>
        </Card>
      )}

      {state.photoAnalysis && !state.isAnalyzing && (
        <Card className="p-6 bg-accent-aqua/10 border-accent-aqua/30">
          <div className="space-y-3">
            <h3 className="font-playfair text-lg font-semibold text-neutral-slate">
              Photo Analysis Complete!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-neutral-slate">Child:</span>
                <p className="text-neutral-slate/80">{state.photoAnalysis.child.appearance}</p>
              </div>
              <div>
                <span className="font-medium text-neutral-slate">Clothing:</span>
                <p className="text-neutral-slate/80">{state.photoAnalysis.child.clothing}</p>
              </div>
            </div>
            <div className="pt-2">
              <span className="font-medium text-neutral-slate">Suggested complexity:</span>
              <span className="ml-2 px-2 py-1 bg-accent-aqua/20 rounded text-accent-aqua font-medium capitalize">
                {state.photoAnalysis.suggestions.coloringComplexity}
              </span>
            </div>
          </div>
        </Card>
      )}

      {state.analysisError && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Analysis Failed</p>
            <p className="text-red-600/80 text-sm">{state.analysisError}</p>
            <Button 
              onClick={() => handlePhotoSelect(state.selectedPhoto)}
              variant="outline"
              className="mt-3"
              disabled={!state.selectedPhoto}
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {canProceedFromPhoto && (
        <div className="text-center pt-4">
          <Button 
            onClick={nextStep}
            size="lg"
            className="bg-primary-indigo hover:bg-primary-indigo/90 text-white"
          >
            Choose Adventure Type
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
