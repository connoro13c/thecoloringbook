'use client'

import React from 'react'
import { AdventureWizardProvider, useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { PhotoUploadStep } from '@/components/wizard/PhotoUploadStep'
import { AdventurePicker } from '@/components/wizard/AdventurePicker'
import { LocationPicker } from '@/components/wizard/LocationPicker'
import { CompanionPicker } from '@/components/wizard/CompanionPicker'
import { AdventurePreview } from '@/components/wizard/AdventurePreview'

function AdventureWizardContent() {
  const { state } = useAdventureWizard()

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'photo':
        return <PhotoUploadStep />
      case 'adventure':
        return <AdventurePicker />
      case 'location':
        return <LocationPicker />
      case 'companion':
        return <CompanionPicker />
      case 'preview':
        return <AdventurePreview />
      default:
        return <PhotoUploadStep />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-ivory via-accent-aqua/5 to-primary-indigo/5">
      {/* Progress Indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-accent-aqua/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-playfair text-lg font-semibold text-neutral-slate">
                Adventure Wizard
              </h2>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center space-x-2">
              {['photo', 'adventure', 'location', 'companion', 'preview'].map((step, index) => {
                const isActive = state.currentStep === step
                const isCompleted = ['photo', 'adventure', 'location', 'companion', 'preview'].indexOf(state.currentStep) > index
                
                return (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-indigo text-white ring-2 ring-primary-indigo/30'
                        : isCompleted
                        ? 'bg-accent-aqua text-white'
                        : 'bg-neutral-slate/20 text-neutral-slate/60'
                    }`}
                  >
                    {index + 1}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {renderCurrentStep()}
      </div>

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-secondary-rose/20 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent-aqua/15 rounded-full blur-xl" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-primary-indigo/10 rounded-full blur-xl" />
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-secondary-rose/15 rounded-full blur-xl" />
      </div>
    </div>
  )
}

export default function CreateAdventurePage() {
  return (
    <AdventureWizardProvider>
      <AdventureWizardContent />
    </AdventureWizardProvider>
  )
}
