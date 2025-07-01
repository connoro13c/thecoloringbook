'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AuthTester() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithGoogle = async () => {
    setLoading(true)
    console.log('Starting OAuth with redirectTo:', `${window.location.origin}/auth/callback`)
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    console.log('OAuth result:', result)
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="p-4">Loading auth state...</div>
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Auth Test Panel</h2>
      
      {user ? (
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded border">
            <p className="text-sm font-medium text-green-800">✅ Authenticated</p>
            <p className="text-xs text-green-600">ID: {user.id}</p>
            <p className="text-xs text-green-600">Email: {user.email}</p>
          </div>
          
          <Button onClick={signOut} variant="outline" className="w-full">
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded border">
            <p className="text-sm font-medium text-gray-800">❌ Not authenticated</p>
          </div>
          
          <Button onClick={signInWithGoogle} className="w-full">
            Sign In with Google
          </Button>
        </div>
      )}
    </Card>
  )
}
