'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
  pendingFilePath?: string
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, pendingFilePath }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAssociating, setIsAssociating] = useState(false)
  // Use singleton supabase client

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process auth events when modal is open
        if (!isOpen) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(false)
          
          // If we have a pending file path, associate it with the user
          if (pendingFilePath) {
            setIsAssociating(true)
            try {
              const response = await fetch('/api/v1/associate-file', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filePath: pendingFilePath }),
              })

              if (!response.ok) {
                throw new Error('Failed to associate file with user')
              }

              const result = await response.json()
              console.log('✅ File associated with user:', result)
              
              // Call success callback if provided
              if (onAuthSuccess) {
                onAuthSuccess()
              }
            } catch (error) {
              console.error('❌ File association failed:', error)
              setError('Failed to save your coloring page. Please try again.')
              setIsAssociating(false)
              return
            }
          }
          
          setIsAssociating(false)
          onClose() // Close modal after successful auth and file association
          
          // Call success callback if provided
          if (onAuthSuccess && !pendingFilePath) {
            onAuthSuccess()
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [isOpen, supabase.auth, pendingFilePath, onAuthSuccess, onClose])

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    
    // Force localhost redirect for development
    const isLocalhost = window.location.hostname === 'localhost'
    const redirectUrl = isLocalhost 
      ? `http://localhost:3000/auth/callback`
      : `${window.location.origin}/auth/callback`
    
    console.log('Starting Google OAuth with redirect:', redirectUrl)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) {
      console.error('OAuth initiation error:', error)
      setError(error.message)
      setIsLoading(false)
    } else {
      console.log('OAuth initiated successfully, redirecting to Google...')
    }
  }



  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-neutral-ivory rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 text-center border-b border-neutral-slate/10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-indigo/20 to-secondary-rose/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-indigo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M24 4C13.5 4 5 12.5 5 23s8.5 19 19 19 19-8.5 19-19S34.5 4 24 4z" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                fill="none"
              />
              <path 
                d="M24 18v6M24 30h.01" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="font-playfair text-xl font-bold text-neutral-slate mb-2">
            {pendingFilePath ? 'Save this coloring page' : 'Create account to download'}
          </h2>
          <p className="text-neutral-slate/70">
            {pendingFilePath 
              ? 'Sign in to save this page to your account and access high-quality downloads.'
              : 'Sign in to save your coloring pages and download high-resolution files.'
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="font-medium text-neutral-slate">With an account you get:</h3>
            <div className="space-y-2 text-sm text-neutral-slate/80">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-xs font-bold text-primary-indigo">✓</span>
                </div>
                <p>High-resolution JPG + PDF downloads</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-xs font-bold text-primary-indigo">✓</span>
                </div>
                <p>Save and access all your coloring pages</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-xs font-bold text-primary-indigo">✓</span>
                </div>
                <p>5 free credits to get started</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || isAssociating}
              className="w-full bg-primary-indigo hover:bg-primary-indigo/90 text-white font-medium py-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : isAssociating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving your page...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isAssociating}
              className="w-full"
            >
              {pendingFilePath ? 'Continue as guest' : 'Maybe later'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
