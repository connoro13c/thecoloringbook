'use client'

import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { SignInCallout } from '@/components/auth/SignInCallout'

export default function LandingPage() {
  return (
    <main className="min-h-screen relative" style={{ backgroundColor: '#F8F9FB' }}>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-ivory via-white to-accent-aqua/5">
        {/* Watercolor background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-indigo/5 via-secondary-rose/5 to-accent-aqua/5 opacity-60"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* Main Headline */}
            <h1 className="font-playfair text-5xl md:text-6xl font-bold text-neutral-slate mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary-indigo to-secondary-rose bg-clip-text text-transparent">
                Coloring Pages
              </span>
            </h1>
            
            <h2 className="font-playfair text-2xl md:text-3xl text-neutral-slate/90 mb-8">
              crafted from their imagination
            </h2>
            
            {/* Description */}
            <p className="text-xl text-neutral-slate/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Create personalized, printable black and white coloring pages 
              with your child's photos.
            </p>

            {/* Example Image */}
            <div className="mb-12">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary-indigo/10 max-w-lg mx-auto">
                <div className="aspect-square bg-gradient-to-br from-accent-aqua/10 to-primary-indigo/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto mb-4 text-primary-indigo/60" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <p className="text-primary-indigo/60 font-medium">
                      Magical coloring page examples coming soon
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="mb-16">
              <GoogleSignInButton className="mx-auto max-w-md">
                Create your coloring page
              </GoogleSignInButton>
            </div>

          </div>
        </div>
      </div>

      {/* Why Sign In Section */}
      <div className="bg-neutral-ivory py-20">
        <div className="container mx-auto px-4">
          <SignInCallout />
        </div>
      </div>

    </main>
  )
}
