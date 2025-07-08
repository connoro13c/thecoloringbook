'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AuthModal from '@/components/ui/AuthModal'
import { DonationModal } from '@/components/forms/DonationModal'
import { useCredits } from '@/lib/hooks/useCredits'
import { supabase } from '@/lib/supabase/client'

export default function TestPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [testPageId, setTestPageId] = useState<string | null>(null)
  const { credits } = useCredits()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [userLoading, setUserLoading] = useState(true)

  // Get initial user state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setUserLoading(false)
    }
    getUser()
  }, [])

  // Create a test page ID for payment flow
  const createTestPage = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      const response = await fetch('/api/v1/create-test-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test page for payment flow',
          style: 'cartoon',
          difficulty: 3
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create test page')
      }

      const { pageId } = await response.json()
      setTestPageId(pageId)
      setShowDonationModal(true)
    } catch (error) {
      console.error('Error creating test page:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-ivory via-white to-accent-aqua/5 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
            Authentication & Payment Test
          </h1>
          <p className="text-neutral-slate/70">
            Test auth and payment flows without image generation
          </p>
        </div>

        {/* User Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <p>Loading...</p>
            ) : user ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ Signed in as: {user.email}</p>
                <p className="text-neutral-slate">Credits: {credits}</p>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <p className="text-neutral-slate">Not signed in</p>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Authentication Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-indigo" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V6C15 5.4 14.6 5 14 5H10C9.4 5 9 5.4 9 6V7.5L3 7V9L9 8.5V12C9 12.6 9.4 13 10 13H14C14.6 13 15 12.6 15 12V8.5L21 9Z" fill="currentColor"/>
                </svg>
                Authentication Test
              </CardTitle>
              <CardDescription>
                Test Google OAuth flow and account creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full"
              >
                Test Auth Flow
              </Button>
            </CardContent>
          </Card>

          {/* Payment Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-secondary-rose" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 6.48 6.48 2 12 2S22 6.48 22 12 17.52 22 12 22 2 17.52 2 12ZM12 6C9.79 6 8 7.79 8 10S9.79 14 12 14 16 12.21 16 10 14.21 6 12 6ZM12 16C10.9 16 10 16.9 10 18S10.9 20 12 20 14 19.1 14 18 13.1 16 12 16Z" fill="currentColor"/>
                </svg>
                Payment Test
              </CardTitle>
              <CardDescription>
                Test Stripe donation flow and webhook processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createTestPage}
                disabled={!user}
                className="w-full"
              >
                {user ? 'Test Payment Flow' : 'Sign In First'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Authentication Flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-slate/80">
                <li>Click &quot;Test Auth Flow&quot; button</li>
                <li>Complete Google OAuth in popup</li>
                <li>Verify user status updates</li>
                <li>Check credit balance (should be 5 for new users)</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Payment Flow:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-slate/80">
                <li>Must be signed in first</li>
                <li>Click &quot;Test Payment Flow&quot; button</li>
                <li>Choose donation amount in modal</li>
                <li>Complete Stripe checkout</li>
                <li>Verify credit balance increases</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false)
          console.log('✅ Auth test successful!')
        }}
      />

      {testPageId && (
        <DonationModal
          open={showDonationModal}
          onOpenChange={setShowDonationModal}
          pageId={testPageId}
          onDonationSuccess={() => {
            setShowDonationModal(false)
            console.log('✅ Payment test successful!')
          }}
        />
      )}
    </div>
  )
}
