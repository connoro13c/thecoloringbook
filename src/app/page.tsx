'use client'

import dynamic from 'next/dynamic'
import { Hero } from '@/components/layout/Hero'

import { PhotoUpload } from '@/components/forms/PhotoUpload'
import { Button } from '@/components/ui/button'
import { useGenerationState } from '@/lib/hooks/useGenerationState'
import { useGeneration } from '@/lib/hooks/useGeneration'

// Lazy load components that are conditionally rendered
const SceneDescription = dynamic(() => import('@/components/forms/SceneDescription').then(mod => ({ default: mod.SceneDescription })), {
  loading: () => <div className="h-32 bg-neutral-ivory/50 rounded-lg animate-pulse" />
})

const StyleSelection = dynamic(() => import('@/components/forms/StyleSelection').then(mod => ({ default: mod.StyleSelection })), {
  loading: () => <div className="h-48 bg-neutral-ivory/50 rounded-lg animate-pulse" />
})

export default function Home() {
  const { state, actions } = useGenerationState()
  
  const { generate } = useGeneration({
    onGeneratingChange: actions.setGenerating,
    onSuccess: actions.setGeneratedImage,
    onError: actions.setError
  })

  const handleGenerate = async () => {
    if (!state.canGenerate || !state.selectedPhoto || !state.selectedStyle) return
    
    await generate({
      photo: state.selectedPhoto,
      sceneDescription: state.sceneDescription,
      style: state.selectedStyle,
      difficulty: 3
    })
  }

  return (
    <main className="min-h-screen relative" style={{ backgroundColor: '#F8F9FB' }}>

      <Hero />
      
      {/* Upload and Generation Flow */}
      <div id="upload-section" className="bg-neutral-ivory py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Step 1: Photo Upload */}
          <div className="mb-12">
            <PhotoUpload 
              onPhotoSelect={actions.setPhoto}
              selectedPhoto={state.selectedPhoto}
            />
          </div>

          {/* Step 2: Scene Description */}
          {state.selectedPhoto && (
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              <SceneDescription
                value={state.sceneDescription}
                onChange={actions.setSceneDescription}
              />
            </div>
          )}

          {/* Step 3: Style Selection */}
          {state.selectedPhoto && state.sceneDescription.trim() && (
            <div className="mb-12 animate-in slide-in-from-bottom-4 duration-500">
              <StyleSelection
                selectedStyle={state.selectedStyle}
                onStyleSelect={actions.setStyle}
              />
            </div>
          )}

          {/* Generate Button */}
          {state.canGenerate && !state.generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div
                onClick={state.isGenerating ? undefined : handleGenerate}
                className={`
                  relative px-8 py-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                  bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100
                  border-2 border-emerald-200/60 shadow-lg hover:shadow-xl
                  ${state.isGenerating ? 'cursor-not-allowed opacity-75' : 'hover:border-primary-indigo'}
                  ring-1 ring-primary-indigo/10 max-w-2xl mx-auto
                `}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="flex justify-center text-emerald-700">
                    {state.isGenerating ? (
                      <div className="w-8 h-8 border-3 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                          d="M12 36L36 12" 
                          stroke="currentColor" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M36 8v8M32 12h8" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="36" r="2" fill="currentColor"/>
                        <path 
                          d="M8 8v4M6 10h4M20 4v4M18 6h4M42 28v4M40 30h4" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round"
                        />
                        <path 
                          d="M16 20l2 2-2 2-2-2z" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-playfair text-xl font-bold text-emerald-800">
                      {state.isGenerating ? 'Creating your coloring page...' : 'Generate coloring page'}
                    </h3>
                    <p className="text-sm text-emerald-700/80">
                      {state.isGenerating ? 'This usually takes 10-15 seconds' : 'High-quality JPG download for $0.99'}
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-neutral-slate/60 mt-4">
                High-quality JPG and PDF download included
              </p>
              
              {state.isGenerating && (
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
          {state.error && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="text-red-600 font-medium mb-2">Generation Failed</p>
                <p className="text-sm text-red-500">{state.error}</p>
                <Button
                  onClick={() => actions.setError(null)}
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
          {state.generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-primary-indigo/20 max-w-2xl mx-auto">
                <h3 className="font-playfair text-2xl font-bold text-neutral-slate mb-4">
                  Your coloring page is ready!
                </h3>
                
                <div className="coloring-image-container bg-white p-4 rounded-lg shadow-md mb-6 max-w-md mx-auto">
                  <img
                    src={state.generatedImage}
                    alt="Generated coloring page"
                    className="coloring-image w-full h-auto rounded-lg"
                  />
                </div>
                
                <div className="flex gap-3 justify-center flex-wrap">
                {/* View Full Size */}
                <div
                onClick={() => window.open(state.generatedImage!, '_blank')}
                className="
                relative px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                bg-gradient-to-br from-orange-100 via-pink-50 to-orange-50
                border-2 border-orange-200/60 shadow-md hover:shadow-lg
                hover:border-primary-indigo flex items-center gap-2
                "
                >
                <div className="text-amber-700">
                <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect 
                        x="6" y="8" width="36" height="28" rx="3" 
                          stroke="currentColor" 
                        strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          fill="none"
                      />
                      <rect 
                          x="8" y="10" width="32" height="24" rx="2" 
                        stroke="currentColor" 
                          strokeWidth="1.5" 
                            strokeDasharray="2,2"
                             fill="none"
                           />
                           <circle 
                             cx="34" cy="18" r="3" 
                             stroke="currentColor" 
                             strokeWidth="1.5" 
                             fill="none"
                           />
                           <path 
                             d="m8 28 8-8 4 4 8-8 8 6" 
                             stroke="currentColor" 
                             strokeWidth="2" 
                             strokeLinecap="round" 
                             strokeLinejoin="round"
                             fill="none"
                           />
                         </svg>
                       </div>
                       <span className="font-playfair text-sm font-bold text-amber-800">
                         View full size
                       </span>
                   </div>

                   {/* Download */}
                   <div
                     onClick={() => {
                       const link = document.createElement('a')
                       link.href = state.generatedImage!
                       link.download = 'coloring-page.jpg'
                       link.click()
                     }}
                     className="
                       relative px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                       bg-gradient-to-br from-blue-100 via-cyan-50 to-green-50
                       border-2 border-blue-200/60 shadow-md hover:shadow-lg
                       hover:border-primary-indigo flex items-center gap-2
                     "
                   >
                     <div className="text-teal-700">
                       <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path 
                             d="M24 32V16" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round"
                           />
                           <path 
                             d="m16 24 8 8 8-8" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round" 
                             strokeLinejoin="round"
                             fill="none"
                           />
                           <path 
                             d="M8 34h32" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round"
                           />
                           <path 
                             d="M12 38h24" 
                             stroke="currentColor" 
                             strokeWidth="1.5" 
                             strokeLinecap="round"
                           />
                         </svg>
                       </div>
                       <h3 className="font-playfair text-lg font-bold text-teal-800 mb-1">
                         Download
                       </h3>
                       <p className="text-xs text-teal-700/80">
                         Save JPG file
                       </p>
                     </div>
                   </div>

                   {/* Create Another */}
                   <div
                     onClick={actions.resetForm}
                     className="
                       relative p-6 rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105
                       bg-gradient-to-br from-green-100 via-cyan-50 to-blue-50
                       border-2 border-green-200/60 shadow-lg hover:shadow-xl
                       hover:border-primary-indigo
                     "
                   >
                     <div className="text-center">
                       <div className="mb-4 flex justify-center text-green-700">
                         <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path 
                             d="M40 24c0 8.8-7.2 16-16 16s-16-7.2-16-16 7.2-16 16-16c4 0 7.6 1.5 10.4 4" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round"
                             fill="none"
                           />
                           <path 
                             d="m32 8 2.4 4L40 14" 
                             stroke="currentColor" 
                             strokeWidth="2.5" 
                             strokeLinecap="round" 
                             strokeLinejoin="round"
                             fill="none"
                           />
                         </svg>
                       </div>
                       <h3 className="font-playfair text-lg font-bold text-green-800 mb-1">
                         Create another
                       </h3>
                       <p className="text-xs text-green-700/80">
                         Start over
                       </p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}
