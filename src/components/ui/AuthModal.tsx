'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthSuccess?: () => void
  pendingPageId?: string
}

export default function AuthModal({ open, onOpenChange, onAuthSuccess, pendingPageId }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Use singleton supabase client

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only process auth events when modal is open
        if (!open) return
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(false)
          
          // Auth success will be handled by the server via callback route
          // No need to manually associate files here - signed state handles it
          onOpenChange(false) // Close modal after successful auth
          
          // Call success callback if provided
          if (onAuthSuccess) {
            onAuthSuccess()
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [open, onAuthSuccess, onOpenChange])

  const handleMagicLinkSignIn = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    console.log('🎯 Magic link button clicked, starting auth flow for:', email)
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Create signed state for secure page claiming
      let state: string | undefined
      if (pendingPageId) {
        const response = await fetch('/api/auth/create-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: pendingPageId })
        })
        const result = await response.json()
        state = result.state
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${state ? `?state=${state}` : ''}`
        }
      })

      if (error) {
        console.error('❌ Magic link error:', error)
        setError(`Magic link error: ${error.message}`)
        setIsLoading(false)
      } else {
        setError(null)
        setMagicLinkSent(true)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('💥 Unexpected error in handleMagicLinkSignIn:', err)
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    console.log('🎯 Google sign-in button clicked')
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Create signed state for secure page claiming
      let state: string | undefined
      if (pendingPageId) {
        const response = await fetch('/api/auth/create-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: pendingPageId })
        })
        const result = await response.json()
        state = result.state
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?state=${encodeURIComponent(state || '')}`
        }
      })

      if (error) {
        console.error('❌ Google sign-in error:', error)
        setError(`Google sign-in error: ${error.message}`)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('💥 Unexpected error in handleGoogleSignIn:', err)
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsLoading(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-ivory max-w-md">
        <DialogHeader className="text-center">
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
          <DialogTitle className="font-playfair text-xl font-bold text-neutral-slate mb-2">
            {pendingPageId ? 'Save this coloring page' : 'Create account to download'}
          </DialogTitle>
          <p className="text-neutral-slate/70">
            {pendingPageId 
              ? 'Sign in to save this page to your account and access high-quality downloads.'
              : 'Sign in to save your coloring pages and download high-resolution files.'
            }
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {magicLinkSent ? (
            /* Magic Link Sent State */
            <div className="space-y-6 text-center">
              {/* Success Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 font-medium">Check your email for the magic link!</p>
              </div>
              
              {/* Return to Homepage Button */}
              <Button
                onClick={() => {
                  onOpenChange(false)
                  window.location.href = '/'
                }}
                className="w-full bg-primary-indigo hover:bg-primary-indigo/90 text-white font-medium py-3"
              >
                Return to homepage
              </Button>
            </div>
          ) : (
            /* Default Auth State */
            <div className="space-y-6">
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
                {/* Google Sign In */}
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-primary-indigo hover:bg-primary-indigo/90 text-white font-medium py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
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
                      Sign in with Google
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-slate/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-neutral-ivory px-2 text-neutral-slate/60">Or</span>
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-slate">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ob.connor@gmail.com"
                    className="w-full px-3 py-2 border border-neutral-slate/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-indigo/50 focus:border-primary-indigo"
                  />
                </div>

                {/* Magic Link Button */}
                <Button
                  onClick={handleMagicLinkSignIn}
                  disabled={isLoading || !email}
                  variant="outline"
                  className="w-full"
                >
                  Send Magic Link
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  {pendingPageId ? 'Continue as guest' : 'Maybe later'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
