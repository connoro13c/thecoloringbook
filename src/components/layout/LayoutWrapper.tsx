'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Navigation } from '@/components/layout/Navigation'
import type { User } from '@supabase/supabase-js'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Paths where navigation should not be shown
  const noNavPaths = ['/']

  useEffect(() => {
    // Get initial session (faster than getUser)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  // Show navigation if:
  // 1. User is authenticated
  // 2. Current path is not in the noNavPaths list
  const showNavigation = user && !noNavPaths.includes(pathname)

  if (loading) {
    // Optional: Show a loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-indigo/30 border-t-primary-indigo rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {showNavigation && <Navigation />}
      {children}
    </>
  )
}
