'use client'

import React, { useEffect, useCallback } from 'react'
import { useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import type { PhotoAnalysisResult } from '@/lib/ai/photo-analysis'

const buildAdventureStory = (
  adventureType: string | null, 
  location: string | null, 
  companion: string | null,
  photoAnalysis: PhotoAnalysisResult | null
) => {
  const child = photoAnalysis?.child
  
  // Base prompt with child characteristics
  let prompt = `Create a coloring book style illustration showing ${child?.appearance || 'a young child'} wearing ${child?.clothing || 'colorful clothes'}`
  
  // Add adventure context
  if (adventureType && location && companion) {
    const adventureContext = getAdventureContext(adventureType, location, companion)
    prompt += ` ${adventureContext}`
  }
  
  // Add style specifications
  prompt += '. Black and white line art, clean outlines, no shading, perfect for coloring. Simple, clear lines suitable for children.'
  
  return prompt
}

const getAdventureContext = (adventureType: string, location: string, companion: string) => {
  const contexts = {
    magical: {
      enchanted_forest: 'exploring a magical forest filled with glowing mushrooms and fairy lights',
      floating_castle: 'standing on the ramparts of a castle floating among clouds',
      cloud_kingdom: 'walking through a kingdom made of fluffy clouds'
    },
    space: {
      space_station: 'floating inside a futuristic space station with windows showing stars',
      alien_planet: 'exploring the surface of a colorful alien world',
      moon_base: 'bouncing on the moon surface in a space suit'
    },
    princess: {
      royal_palace: 'in the grand ballroom of an elegant palace',
      secret_garden: 'discovering a hidden garden full of magical flowers'
    }
  }
  
  // Get companion description
  const companionDescriptions = {
    magical_unicorn: 'with a beautiful unicorn with rainbow mane',
    friendly_dragon: 'riding on the back of a kind dragon',
    robot_buddy: 'with a friendly robot companion',
    royal_pony: 'riding an elegant pony with golden saddle'
  }
  
  const adventureContexts = contexts[adventureType as keyof typeof contexts] || {}
  const context = adventureContexts[location as keyof typeof adventureContexts] || 'on an amazing adventure'
  const companionDesc = companionDescriptions[companion as keyof typeof companionDescriptions] || 
                       'with their magical companion'
  
  return `${context} ${companionDesc}`
}

export function AdventurePreview() {
  const { 
    state, 
    dispatch,
    previousStep,
    resetWizard,
    isReadyForGeneration
  } = useAdventureWizard()

  const generateAdventure = useCallback(async () => {
    if (!isReadyForGeneration) return

    try {
      dispatch({ type: 'SET_GENERATION_LOADING', payload: true })
      dispatch({ type: 'SET_GENERATION_ERROR', payload: null })

      // Convert photo to base64 for API call
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]

          // Build adventure story based on selections
          const story = buildAdventureStory(state.adventureType, state.location, state.companion, state.photoAnalysis)
          dispatch({ type: 'SET_STORY', payload: story })

          // Create generation request
          const response = await fetch('/api/v1/createJob', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Data,
              prompt: story,
              style: 'Classic Cartoon',
              difficulty: state.photoAnalysis?.suggestions.coloringComplexity === 'simple' ? 1 : 
                        state.photoAnalysis?.suggestions.coloringComplexity === 'complex' ? 5 : 3
            })
          })

          if (!response.ok) {
            throw new Error('Failed to generate adventure')
          }

          const result = await response.json()
          
          if (result.success && result.data?.image) {
            dispatch({ type: 'SET_PREVIEW_IMAGE', payload: result.data.image })
            dispatch({ type: 'SET_COMPLETE', payload: true })
          } else {
            throw new Error(result.error || 'Generation failed')
          }

        } catch (error) {
          console.error('Adventure generation failed:', error)
          dispatch({ 
            type: 'SET_GENERATION_ERROR', 
            payload: error instanceof Error ? error.message : 'Failed to generate adventure'
          })
        }
      }
      reader.readAsDataURL(state.selectedPhoto!)

    } catch (error) {
      console.error('Adventure generation setup failed:', error)
      dispatch({ 
        type: 'SET_GENERATION_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to start generation'
      })
    }
  }, [isReadyForGeneration, state.selectedPhoto, state.adventureType, state.location, state.companion, state.photoAnalysis, dispatch])

  // Auto-generate when component mounts and ready
  useEffect(() => {
    if (isReadyForGeneration && !state.previewImage && !state.isGenerating && !state.generationError) {
      generateAdventure()
    }
  }, [isReadyForGeneration, state.previewImage, state.isGenerating, state.generationError, generateAdventure])

  const downloadImage = () => {
    if (!state.previewImage) return
    
    const link = document.createElement('a')
    link.href = state.previewImage
    link.download = 'adventure-coloring-page.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getAdventureTitle = (adventureType: string | null) => {
    const adventures = {
      magical: 'Magical Journey',
      space: 'Space Adventure', 
      princess: 'Royal Adventure',
      superhero: 'Superhero Mission',
      animal: 'Animal Kingdom',
      fantasy: 'Fantasy Quest'
    }
    return adventures[adventureType as keyof typeof adventures] || 'Adventure'
  }

  const getLocationTitle = (locationId: string | null) => {
    const locations = {
      enchanted_forest: 'Enchanted Forest',
      floating_castle: 'Floating Castle',
      space_station: 'Space Station',
      royal_palace: 'Royal Palace'
    }
    return locations[locationId as keyof typeof locations] || 'Adventure Location'
  }

  const getCompanionTitle = (companionId: string | null) => {
    const companions = {
      magical_unicorn: 'Magical Unicorn',
      friendly_dragon: 'Friendly Dragon',
      robot_buddy: 'Robot Buddy',
      royal_pony: 'Royal Pony'
    }
    return companions[companionId as keyof typeof companions] || 'Adventure Companion'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
          Your Adventure Awaits!
        </h1>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          {state.isGenerating 
            ? 'Creating your personalized coloring adventure...'
            : state.previewImage 
            ? 'Your adventure coloring page is ready!'
            : 'Preparing to create your adventure...'
          }
        </p>
      </div>

      {/* Adventure Summary */}
      <Card className="p-6 bg-gradient-to-r from-primary-indigo/10 to-accent-aqua/10 border-primary-indigo/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <h3 className="font-playfair font-semibold text-neutral-slate mb-1">Adventure</h3>
            <p className="text-sm text-neutral-slate/80">{getAdventureTitle(state.adventureType)}</p>
          </div>
          <div>
            <h3 className="font-playfair font-semibold text-neutral-slate mb-1">Location</h3>
            <p className="text-sm text-neutral-slate/80">{getLocationTitle(state.location)}</p>
          </div>
          <div>
            <h3 className="font-playfair font-semibold text-neutral-slate mb-1">Companion</h3>
            <p className="text-sm text-neutral-slate/80">{getCompanionTitle(state.companion)}</p>
          </div>
        </div>
      </Card>

      {/* Generation Status */}
      {state.isGenerating && (
        <Card className="p-8 bg-primary-indigo/5 border-primary-indigo/20">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-indigo mx-auto" />
            <div>
              <h3 className="font-playfair text-xl font-semibold text-neutral-slate mb-2">
                Creating Your Adventure
              </h3>
              <p className="text-neutral-slate/80">
                Our AI is carefully crafting your personalized coloring page...
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Generated Image */}
      {state.previewImage && (
        <Card className="p-6 bg-neutral-ivory border-accent-aqua/30">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Image
                src={state.previewImage}
                alt="Generated adventure coloring page"
                width={400}
                height={400}
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                onClick={downloadImage}
                size="lg"
                className="bg-primary-indigo hover:bg-primary-indigo/90 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Coloring Page
              </Button>
              
              <Button
                onClick={() => generateAdventure()}
                variant="outline"
                disabled={state.isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New Version
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {state.generationError && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center space-y-4">
            <h3 className="font-playfair text-lg font-semibold text-red-600">
              Generation Failed
            </h3>
            <p className="text-red-600/80">{state.generationError}</p>
            <Button
              onClick={() => generateAdventure()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button 
          onClick={previousStep}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companion</span>
        </Button>

        <Button 
          onClick={resetWizard}
          variant="outline"
        >
          Create New Adventure
        </Button>
      </div>
    </div>
  )
}
