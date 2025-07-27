'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useCredits } from '@/lib/hooks/useCredits'
import type { User } from '@supabase/supabase-js'

export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { credits } = useCredits()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    // Redirect to landing page after sign out
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary-indigo/10 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo/Brand */}
        <Link 
          href="/generator" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-indigo to-secondary-rose flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-playfair text-xl font-bold text-neutral-slate">
            Coloring Pages
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/generator"
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${pathname === '/generator' 
                ? 'bg-primary-indigo/10 text-primary-indigo' 
                : 'text-neutral-slate/70 hover:text-primary-indigo hover:bg-primary-indigo/5'
              }
            `}
          >
            Generator
          </Link>
          <Link 
            href="/library"
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${pathname === '/library' 
                ? 'bg-primary-indigo/10 text-primary-indigo' 
                : 'text-neutral-slate/70 hover:text-primary-indigo hover:bg-primary-indigo/5'
              }
            `}
          >
            My Pages
          </Link>
        </div>

        {/* Right Side - Credits & User Menu */}
        <div className="flex items-center gap-4">
          
          {/* Credits Display */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-accent-aqua/10 to-primary-indigo/10 rounded-full border border-accent-aqua/20">
            <svg className="w-4 h-4 text-accent-aqua" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium text-primary-indigo">
              {credits} credits
            </span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-ivory/50 transition-colors"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-rose to-primary-indigo flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              {/* Dropdown Arrow */}
              <svg 
                className={`w-4 h-4 text-neutral-slate/60 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-ivory/50 py-2 z-50">
                
                {/* User Info */}
                <div className="px-4 py-3 border-b border-neutral-ivory/50">
                  <p className="text-sm font-medium text-neutral-slate truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-neutral-slate/60 mt-1">
                    {credits} credits available
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link 
                    href="/library"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-slate hover:bg-neutral-ivory/50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    My Pages
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-neutral-slate hover:bg-neutral-ivory/50 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation (if needed) */}
      <div className="md:hidden border-t border-primary-indigo/10 bg-white/95">
        <div className="flex items-center justify-around py-2">
          <Link 
            href="/generator"
            className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs
              ${pathname === '/generator' 
                ? 'text-primary-indigo' 
                : 'text-neutral-slate/70'
              }
            `}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Generator
          </Link>
          <Link 
            href="/library"
            className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs
              ${pathname === '/library' 
                ? 'text-primary-indigo' 
                : 'text-neutral-slate/70'
              }
            `}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            My Pages
          </Link>
          <div className="flex flex-col items-center gap-1 px-4 py-2 text-xs text-neutral-slate/70">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {credits} credits
          </div>
        </div>
      </div>
    </nav>
  )
}
