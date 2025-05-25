'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-2xl">🎨</div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Colorific
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <Button variant="ghost" size="sm">
                  Create
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}