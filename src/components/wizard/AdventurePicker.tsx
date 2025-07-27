'use client'

import React from 'react'
import { useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Sparkles, Rocket, Crown, Heart, Wand2, Shield } from 'lucide-react'

const adventureTypes = [
  {
    id: 'magical',
    title: 'Magical Journey',
    description: 'Enchanted forests, fairy tales, and mystical creatures',
    icon: Wand2,
    color: 'bg-purple-100 text-purple-600 border-purple-200'
  },
  {
    id: 'space',
    title: 'Space Adventure',
    description: 'Explore galaxies, meet aliens, and travel through stars',
    icon: Rocket,
    color: 'bg-blue-100 text-blue-600 border-blue-200'
  },
  {
    id: 'princess',
    title: 'Royal Adventure',
    description: 'Castles, princesses, knights, and royal quests',
    icon: Crown,
    color: 'bg-pink-100 text-pink-600 border-pink-200'
  },
  {
    id: 'superhero',
    title: 'Superhero Mission',
    description: 'Save the day with superpowers and heroic adventures',
    icon: Shield,
    color: 'bg-red-100 text-red-600 border-red-200'
  },
  {
    id: 'animal',
    title: 'Animal Kingdom',
    description: 'Safari adventures, jungle explorations, and animal friends',
    icon: Heart,
    color: 'bg-green-100 text-green-600 border-green-200'
  },
  {
    id: 'fantasy',
    title: 'Fantasy Quest',
    description: 'Dragons, wizards, magical spells, and epic quests',
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-600 border-amber-200'
  }
]

export function AdventurePicker() {
  const { 
    state, 
    setAdventureType, 
    nextStep, 
    previousStep,
    canProceedFromAdventure 
  } = useAdventureWizard()

  const handleAdventureSelect = (adventureId: string) => {
    setAdventureType(adventureId)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
          Choose Your Adventure
        </h1>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          What kind of magical adventure would you like to go on?
        </p>
      </div>

      {/* Show child info from analysis */}
      {state.photoAnalysis && (
        <Card className="p-4 bg-accent-aqua/10 border-accent-aqua/30 mb-6">
          <div className="text-center">
            <p className="text-sm text-neutral-slate/80">
              Creating an adventure for: <span className="font-medium">{state.photoAnalysis.child.appearance}</span>
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adventureTypes.map((adventure) => {
          const Icon = adventure.icon
          const isSelected = state.adventureType === adventure.id
          
          return (
            <Card 
              key={adventure.id}
              className={`
                p-6 cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? 'ring-2 ring-primary-indigo bg-primary-indigo/5 border-primary-indigo' 
                  : 'hover:shadow-lg border-accent-aqua/30'
                }
              `}
              onClick={() => handleAdventureSelect(adventure.id)}
            >
              <div className="text-center space-y-4">
                <div className={`inline-flex p-3 rounded-full ${adventure.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-neutral-slate mb-2">
                    {adventure.title}
                  </h3>
                  <p className="text-sm text-neutral-slate/70">
                    {adventure.description}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="flex justify-center">
                    <div className="w-2 h-2 bg-primary-indigo rounded-full" />
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-6">
        <Button 
          onClick={previousStep}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Photo</span>
        </Button>

        {canProceedFromAdventure && (
          <Button 
            onClick={nextStep}
            size="lg"
            className="bg-primary-indigo hover:bg-primary-indigo/90 text-white flex items-center space-x-2"
          >
            <span>Choose Location</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
