'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasProcessed = useRef(false)
  
  useEffect(() => {
    // Handle magic link authentication from URL fragment
    const handleAuthCallback = async () => {
      if (hasProcessed.current) return
      hasProcessed.current = true
      
      // First, try to get existing session
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
        // User is authenticated, redirect to success
        const pageId = searchParams.get('page')
        const successUrl = pageId ? `/auth/success?page=${pageId}` : '/auth/success'
        router.replace(successUrl)
        return
      }
      
      // Check if there are auth tokens in the URL fragment (magic link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        try {
          // Set the session using the tokens from the URL fragment
          const { data: sessionData, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Error setting session from magic link:', error)
            router.replace('/?auth_error=session_failed')
            return
          }
          
          if (sessionData.session) {
            // Success! Redirect to success page
            const pageId = searchParams.get('page')
            const successUrl = pageId ? `/auth/success?page=${pageId}` : '/auth/success'
            router.replace(successUrl)
            return
          }
        } catch (error) {
          console.error('Magic link processing error:', error)
          router.replace('/?auth_error=magic_link_failed')
          return
        }
      }
      
      // Check if there's a specific error in the URL
      const authError = searchParams.get('error')
      if (authError) {
        console.error('Auth error:', authError)
        router.replace('/?auth_error=' + authError)
        return
      }
      
      // No session, no tokens, no error - redirect to main page
      router.replace('/')
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-md mx-auto text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h1 className="text-xl font-medium text-gray-900">Completing sign in...</h1>
        <p className="text-gray-600 text-sm">Please wait while we verify your authentication.</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-md mx-auto text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h1 className="text-xl font-medium text-gray-900">Loading...</h1>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
