'use client'

import { Button } from '@/components/ui/button'
import { DonateSheet } from './DonateSheet'
import { useState } from 'react'

interface PaywallProps {
  isOpen: boolean
  onClose: () => void
  onDonate: (amount: number) => Promise<void>
  title?: string
  message?: string
}

export function Paywall({ 
  isOpen, 
  onClose, 
  onDonate,
  title = "Get credits to continue",
  message = "You need credits to generate coloring pages. Support our mission and get credits to keep creating!"
}: PaywallProps) {
  const [showDonateSheet, setShowDonateSheet] = useState(false)

  if (!isOpen) return null

  const handleDonateSuccess = async (amount: number) => {
    await onDonate(amount)
    setShowDonateSheet(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-neutral-ivory rounded-2xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="p-6 text-center border-b border-neutral-slate/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-indigo/20 to-secondary-rose/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-indigo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M24 4C13.5 4 5 12.5 5 23s8.5 19 19 19 19-8.5 19-19S34.5 4 24 4z" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  fill="none"
                />
                <path 
                  d="M24 16v8M24 32h.01" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="font-playfair text-xl font-bold text-neutral-slate mb-2">
              {title}
            </h2>
            <p className="text-neutral-slate/70">
              {message}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* How it works */}
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-slate">How it works:</h3>
              <div className="space-y-2 text-sm text-neutral-slate/80">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-primary-indigo">1</span>
                  </div>
                  <p>Choose a donation amount (minimum $0.25)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-primary-indigo">2</span>
                  </div>
                  <p>Receive credits instantly (1 credit = $0.25)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-indigo/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-primary-indigo">3</span>
                  </div>
                  <p>Generate unlimited coloring pages with your credits</p>
                </div>
              </div>
            </div>

            {/* Impact Message */}
            <div className="bg-accent-aqua/10 rounded-lg p-4 border border-accent-aqua/20">
              <div className="flex items-start gap-3">
                <span className="text-lg">💖</span>
                <div>
                  <p className="font-medium text-neutral-slate mb-1">Supporting a great cause</p>
                  <p className="text-sm text-neutral-slate/80">
                    All proceeds are donated to Stanford Children's Hospital to provide
                    coloring therapy and creative activities for young patients.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Maybe later
              </Button>
              <Button
                onClick={() => setShowDonateSheet(true)}
                className="flex-1 bg-primary-indigo hover:bg-primary-indigo/90"
              >
                Get credits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Donate Sheet */}
      <DonateSheet
        isOpen={showDonateSheet}
        onClose={() => setShowDonateSheet(false)}
        onDonate={handleDonateSuccess}
      />
    </>
  )
}
