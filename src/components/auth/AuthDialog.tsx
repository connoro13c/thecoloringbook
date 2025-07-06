'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

interface AuthDialogProps {
  pageId?: string
  trigger?: React.ReactNode
}

export default function AuthDialog({ pageId, trigger }: AuthDialogProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()



  return (
    <>
      {trigger ? (
        <button onClick={() => setOpen(true)} className="w-full">
          {trigger}
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Save This Page
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Save Your Page</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">
                Sign in to save your coloring page and access it anytime!
              </p>

              <Auth
                supabaseClient={supabase}
                view="magic_link"
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#4f46e5',
                        brandAccent: '#4338ca',
                      },
                    },
                  },
                }}
                providers={['google']}
                redirectTo={`${window.location.origin}/auth/callback${pageId ? `?state=${pageId}` : ''}`}
                magicLink={true}
                showLinks={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
