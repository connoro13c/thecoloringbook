'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPendingClaims, clearPendingClaims } from '@/lib/utils/pending-claims'
// import { toast } from 'sonner'
import { PageRecord } from '@/lib/database'
import Link from 'next/link'
import Image from 'next/image'

interface DashboardClientProps {
  initialPages: PageRecord[]
  userEmail: string
}

export default function DashboardClient({ initialPages, userEmail }: DashboardClientProps) {
  const [pages, setPages] = useState<PageRecord[]>(initialPages)
  const [isClaimingPages, setIsClaimingPages] = useState(false)
  
  useEffect(() => {
    const processPendingClaims = async () => {
      try {
        const pendingClaims = getPendingClaims()
        
        if (pendingClaims.length === 0) {
          return
        }

        setIsClaimingPages(true)
        
        console.log('Processing pending claims:', pendingClaims.length)
        
        const response = await fetch('/api/v1/claim-pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claims: pendingClaims.map(claim => ({
              pageId: claim.pageId,
              claimToken: claim.claimToken
            }))
          })
        })

        if (!response.ok) {
          throw new Error('Failed to claim pages')
        }

        const result = await response.json()
        
        if (result.success && result.claimed > 0) {
          console.log(`Successfully claimed ${result.claimed} pages`)
          
          // Clear pending claims from localStorage
          clearPendingClaims()
          
          // Refresh the page list
          await refreshPages()
          
          // Show success message
          console.log(`✅ Successfully saved ${result.claimed} coloring page${result.claimed > 1 ? 's' : ''} to your account!`)
        }
        
        if (result.failed > 0) {
          console.warn(`Failed to claim ${result.failed} pages`)
          // Don't show error toast for failed claims as they might be expected
        }
        
      } catch (error) {
        console.error('Error processing pending claims:', error)
        // Don't show error toast to avoid disrupting user experience
      } finally {
        setIsClaimingPages(false)
      }
    }

    processPendingClaims()
  }, [])

  const refreshPages = async () => {
    try {
      const supabase = createClient()
      const { data: refreshedPages } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (refreshedPages) {
        setPages(refreshedPages)
      }
    } catch (error) {
      console.error('Error refreshing pages:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {userEmail}!</p>
              {isClaimingPages && (
                <p className="text-sm text-blue-600 mt-1">
                  Processing your saved pages...
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {pages && pages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page: PageRecord) => (
              <div key={page.id} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="relative aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
                  {page.jpg_path && (
                    <Image
                      src={page.jpg_path}
                      alt={`Coloring page: ${page.prompt}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover rounded-xl"
                      unoptimized
                    />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{page.prompt}</h3>
                <p className="text-sm text-gray-600 mb-2">Style: {page.style}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(page.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pages Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first coloring page to get started!
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Your First Page
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
