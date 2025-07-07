'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Handle magic link authentication from URL fragment
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (data.session) {
        // User is authenticated, redirect to success
        const pageId = searchParams.get('page')
        const successUrl = pageId ? `/auth/success?page=${pageId}` : '/auth/success'
        router.replace(successUrl)
        return
      }
      
      // Check if there's an error
      const authError = searchParams.get('error')
      if (authError) {
        console.error('Auth error:', authError)
        // Redirect back to main page with error
        router.replace('/?auth_error=' + authError)
        return
      }
      
      // No session and no specific error, redirect to main page
      router.replace('/')
    }

    handleAuthCallback()
  }, [router, searchParams])

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
