'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Hero } from '@/components/layout/Hero'
import { PhotoUpload } from '@/components/forms/PhotoUpload'
import { Button } from '@/components/ui/button'
import { CreditBadge } from '@/components/ui/CreditBadge'
import { Paywall } from '@/components/ui/Paywall'
import AuthModal from '@/components/ui/AuthModal'
import { DonationModal } from '@/components/forms/DonationModal'

import { useGenerationState } from '@/lib/hooks/useGenerationState'
import { useGeneration } from '@/lib/hooks/useGeneration'
import { useCredits } from '@/lib/hooks/useCredits'
import { addPendingClaim } from '@/lib/utils/pending-claims'

import { supabase } from '@/lib/supabase/client'

// Lazy load components that are conditionally rendered
const SceneDescription = dynamic(() => import('@/components/forms/SceneDescription').then(mod => ({ default: mod.SceneDescription })), {
  loading: () => <div className="h-32 bg-neutral-ivory/50 rounded-lg animate-pulse" />
})

const StyleSelection = dynamic(() => import('@/components/forms/StyleSelection').then(mod => ({ default: mod.StyleSelection })), {
  loading: () => <div className="h-48 bg-neutral-ivory/50 rounded-lg animate-pulse" />
})

export default function Home() {
  const { state, actions } = useGenerationState()
  const { } = useCredits() // Keep for potential future use

  const [showPaywall, setShowPaywall] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const [showDonationModal, setShowDonationModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  // Use singleton supabase client
  
  const { generate } = useGeneration({
    onGeneratingChange: actions.setGenerating,
    onSuccess: (imageUrl: string, response?) => {
      actions.setGeneratedImage(imageUrl)
      
      // Store page ID for donation modal
      if (response?.data?.pageId) {
        setCurrentPageId(response.data.pageId)
      }
      
      // For anonymous users, store claim token so they can claim this page after auth
      if (response?.data?.pageId && response?.data?.claimToken) {
        addPendingClaim(response.data.pageId, response.data.claimToken)
        console.log('📝 Stored pending claim for page:', response.data.pageId)
      }
    },
    onError: actions.setError
  })

  // Generate low-res preview for anonymous users
  const handleGeneratePreview = async () => {
    if (!state.canGenerate || !state.selectedPhoto || !state.selectedStyle) return
    
    setIsGeneratingPreview(true)
    try {
      await generate({
        photo: state.selectedPhoto,
        sceneDescription: state.sceneDescription,
        style: state.selectedStyle,
        difficulty: 3,
        isPreview: true // Flag for low-res generation
      })
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  // Handle donation modal for high-res download
  const handleDonateForHighRes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // User will be prompted through donation flow
      return
    }

    if (!currentPageId) {
      console.error('No page ID available for donation')
      return
    }

    setShowDonationModal(true)
  }







  // Debug magic link URLs
  useEffect(() => {
    // Log full URL info for debugging magic links
    if (window.location.hash && window.location.hash.includes('access_token')) {
      console.log('🔍 MAGIC LINK DEBUG:', {
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)))
      })
      alert('Magic link detected! Check console for debug info')
    }
  }, [])

  // Handle auth and payment redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // Handle auth states
    if (urlParams.get('auth') === 'success') {
      console.log('✅ Authentication successful!')
      // Credits will be updated via real-time subscription
    }
    
    if (urlParams.get('auth') === 'pending-verification') {
      console.log('⏳ Email verification required')
      // TODO: Show email verification message
    }
    
    // Handle Stripe redirect success/cancel
    if (urlParams.get('success') === 'true') {
      // Show success message and refresh credits
      console.log('✅ Payment successful!')
      // Credits will be updated via webhook and real-time subscription
    }
    
    if (urlParams.get('canceled') === 'true') {
      console.log('❌ Payment canceled')
    }
    
    // Clean up URL parameters
    if (urlParams.has('success') || urlParams.has('canceled') || urlParams.has('auth')) {
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }
  }, [])

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

          {/* Generate Preview Button */}
          {state.canGenerate && !state.generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div
                onClick={isGeneratingPreview ? undefined : handleGeneratePreview}
                className={`
                  relative px-8 py-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                  bg-gradient-to-br from-emerald-100 via-blue-50 to-purple-100
                  border-2 border-emerald-200/60 shadow-lg hover:shadow-xl
                  ${isGeneratingPreview ? 'cursor-not-allowed opacity-75' : 'hover:border-primary-indigo'}
                  ring-1 ring-primary-indigo/10 max-w-2xl mx-auto
                `}
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="flex justify-center text-emerald-700">
                    {isGeneratingPreview ? (
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
                      {isGeneratingPreview ? 'Creating preview...' : 'Create coloring page'}
                    </h3>
                    <p className="text-sm text-emerald-700/80">
                      {isGeneratingPreview ? 'This takes about a minute to complete' : 'Free preview - no account required'}
                    </p>
                  </div>
                </div>
              </div>
              

            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
                <p className="text-red-600 font-medium mb-2">Generation failed</p>
                <p className="text-sm text-red-500">{state.error}</p>
                <Button
                  onClick={() => actions.setError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* Generated Result */}
          {state.generatedImage && (
            <div className="text-center animate-in slide-in-from-bottom-4 duration-500 mt-16 relative z-10">
              <div className="bg-gradient-to-br from-neutral-ivory via-white to-accent-aqua/5 p-8 rounded-3xl shadow-xl border border-primary-indigo/10 max-w-5xl mx-auto relative backdrop-blur-sm">
                {/* Watercolor border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-indigo/5 via-secondary-rose/5 to-accent-aqua/5 opacity-60"></div>
                
                <div className="relative z-10">
                  <h3 className="font-playfair text-3xl font-bold text-neutral-slate mb-6 text-center">
                    Your coloring page preview is ready!
                  </h3>
                  
                  <div className="flex flex-col lg:flex-row gap-8 items-start justify-center mb-8">
                    {/* Image Container */}
                    <div className="coloring-image-container bg-white p-6 rounded-2xl shadow-lg max-w-lg relative border border-accent-aqua/20">
                      {/* Soft watercolor frame */}
                      <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-accent-aqua/10 to-primary-indigo/10 opacity-30"></div>
                      <Image
                        src={state.generatedImage}
                        alt="Generated coloring page preview"
                        className="coloring-image w-full h-auto rounded-xl relative z-10 shadow-sm"
                        width={512}
                        height={512}
                        unoptimized
                      />
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-accent-aqua to-secondary-rose text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
                        Preview
                      </div>
                    </div>
                    
                    {/* Credit Badge - Separate container */}
                    <div className="flex-shrink-0 lg:mt-4">
                      <CreditBadge onDonateClick={handleDonateForHighRes} />
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                {/* Save this page - for anonymous users */}
                <div
                onClick={() => setShowAuthModal(true)}
                className="
                relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                bg-gradient-to-br from-purple-100 via-pink-50 to-rose-50
                border-2 border-purple-200/60 shadow-md hover:shadow-lg
                hover:border-primary-indigo ring-1 ring-primary-indigo/10
                ">
                <div className="text-center">
                <div className="mb-4 flex justify-center text-purple-700">
                <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                d="M12 36V12a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v24" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                />
                <path 
                d="M32 36H8a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                fill="none"
                />
                <path 
                d="M40 36h-8M16 24h8M16 28h12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                />
                </svg>
                </div>
                <h3 className="font-playfair text-lg font-bold text-purple-800 mb-2">
                Save this page
                </h3>
                <p className="text-sm text-purple-700/80">
                Create account to save & download
                </p>
                </div>
                </div>

                  {/* Donate for high-res download */}
                  <div
                    onClick={handleDonateForHighRes}
                    className="
                      relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                      bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-50
                      border-2 border-emerald-200/60 shadow-md hover:shadow-lg
                      hover:border-primary-indigo ring-1 ring-primary-indigo/10
                    "
                  >
                    <div className="text-center">
                      <div className="mb-4 flex justify-center text-emerald-700">
                        <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                        </svg>
                      </div>
                      <h3 className="font-playfair text-lg font-bold text-emerald-800 mb-2">
                        Donate for High-Res
                      </h3>
                      <p className="text-sm text-emerald-700/80">
                        PDF + PNG • $1+ donation
                      </p>
                    </div>
                  </div>

                  {/* Make Another - Ghibli style */}
                  <div
                    onClick={actions.resetForm}
                    className="
                      relative p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                      bg-gradient-to-br from-blue-100 via-cyan-50 to-green-50
                      border-2 border-blue-200/60 shadow-md hover:shadow-lg
                      hover:border-primary-indigo ring-1 ring-primary-indigo/10
                    "
                  >
                    <div className="text-center">
                      <div className="mb-4 flex justify-center text-teal-700">
                        <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                      <h3 className="font-playfair text-lg font-bold text-teal-800 mb-2">
                        Make another
                      </h3>
                      <p className="text-sm text-teal-700/80">
                        Start over with new photo
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          )}

        </div>
      </div>

      {/* Paywall Modal */}
      <Paywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />



      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        pendingPageId={currentPageId || undefined}
        onAuthSuccess={() => {
          setShowAuthModal(false)
          console.log('✅ Authentication successful!')
        }}
      />

      {/* Donation Modal */}
      {currentPageId && (
        <DonationModal
          open={showDonationModal}
          onOpenChange={setShowDonationModal}
          pageId={currentPageId}
          onDonationSuccess={() => {
            setShowDonationModal(false)
            console.log('✅ Donation successful!')
          }}
        />
      )}


    </main>
  )
}
