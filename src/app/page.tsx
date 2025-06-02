'use client'

import { useState } from 'react'
import { Hero } from '@/components/layout/Hero'
import { WatercolorBackground } from '@/components/layout/WatercolorBackground'
import { PhotoUpload } from '@/components/forms/PhotoUpload'
import { SceneDescription } from '@/components/forms/SceneDescription'
import { StyleSelection, type ColoringStyle } from '@/components/forms/StyleSelection'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [sceneDescription, setSceneDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<ColoringStyle | null>(null)

  const canGenerate = selectedPhoto && sceneDescription.trim() && selectedStyle

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!canGenerate || !selectedPhoto) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const { fileToBase64, generateColoringPage } = await import('@/lib/api')
      
      // Convert file to base64
      const photoBase64 = await fileToBase64(selectedPhoto)
      
      // Call generation API
      const response = await generateColoringPage({
        photo: photoBase64,
        sceneDescription,
        style: selectedStyle!,
        difficulty: 3
      })
      
      if (response.success && response.data) {
        setGeneratedImage(response.data.imageUrl)
        console.log('🎉 Generation complete!', response.data.metadata)
      } else {
        throw new Error(response.error || 'Generation failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen relative">
      <WatercolorBackground />
      <Hero />
      
      {/* Upload and Generation Flow */}
      <div id="upload-section" className="bg-neutral-ivory py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Step 1: Photo Upload */}
          <div className="mb-12">
            <PhotoUpload 
              onPhotoSelect={setSelectedPhoto}
              selectedPhoto={selectedPhoto}
            />
          </div>

          {/* Step 2: Scene Description */}
          {selectedPhoto && (
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              <SceneDescription
                value={sceneDescription}
                onChange={setSceneDescription}
              />
            </div>
          )}

          {/* Step 3: Style Selection */}
          {selectedPhoto && sceneDescription.trim() && (
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              <StyleSelection
                selectedStyle={selectedStyle}
                onStyleSelect={setSelectedStyle}
              />
            </div>
          )}

          {/* Generate Button */}
          {canGenerate && !generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="
                  bg-primary-indigo hover:bg-primary-indigo/90 
                  text-white font-playfair font-semibold text-xl
                  px-12 py-6 rounded-xl
                  shadow-lg hover:shadow-xl
                  transform hover:scale-105 transition-all duration-300
                  border-2 border-primary-indigo/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Your Coloring Page...
                  </span>
                ) : (
                  '✨ Generate My Coloring Page ($0.99)'
                )}
              </Button>
              
              <p className="text-sm text-neutral-slate/60 mt-4">
                High-quality JPG and PDF download included
              </p>
              
              {isGenerating && (
                <div className="mt-6 p-4 bg-accent-aqua/10 rounded-lg border border-accent-aqua/30">
                  <p className="text-sm text-neutral-slate/80">
                    🤖 AI is analyzing your photo and creating a magical coloring page...
                    <br />
                    This usually takes 10-20 seconds.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="text-red-600 font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-red-500">{error}</p>
                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Generated Result */}
          {generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-primary-indigo/20 max-w-2xl mx-auto">
                <h3 className="font-playfair text-2xl font-bold text-neutral-slate mb-4">
                  🎉 Your Coloring Page Is Ready!
                </h3>
                
                <img
                  src={generatedImage}
                  alt="Generated coloring page"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md mb-6"
                />
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    onClick={() => window.open(generatedImage, '_blank')}
                    className="bg-primary-indigo hover:bg-primary-indigo/90 text-white"
                  >
                    📱 View Full Size
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = generatedImage
                      link.download = 'coloring-page.jpg'
                      link.click()
                    }}
                    className="bg-secondary-rose hover:bg-secondary-rose/90 text-white"
                  >
                    💾 Download JPG
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setGeneratedImage(null)
                      setSelectedPhoto(null)
                      setSceneDescription('')
                      setSelectedStyle(null)
                      setError(null)
                    }}
                    variant="outline"
                  >
                    🔄 Create Another
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
