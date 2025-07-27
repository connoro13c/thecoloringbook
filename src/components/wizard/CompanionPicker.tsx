'use client'

import React from 'react'
import { useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Heart, Sparkles, Zap, Crown, Shield, Star } from 'lucide-react'

// Dynamic companions based on adventure type
const getCompanionsForAdventure = (adventureType: string | null) => {
  const baseCompanions = [
    {
      id: 'magical_unicorn',
      title: 'Magical Unicorn',
      description: 'A beautiful unicorn with rainbow mane and healing powers',
      icon: Sparkles,
      color: 'bg-purple-100 text-purple-600 border-purple-200'
    },
    {
      id: 'friendly_dragon',
      title: 'Friendly Dragon',
      description: 'A kind dragon who loves to fly and breathe colorful fire',
      icon: Zap,
      color: 'bg-red-100 text-red-600 border-red-200'
    },
    {
      id: 'wise_owl',
      title: 'Wise Owl',
      description: 'A clever owl who knows all the secrets of the forest',
      icon: Star,
      color: 'bg-amber-100 text-amber-600 border-amber-200'
    },
    {
      id: 'loyal_puppy',
      title: 'Loyal Puppy',
      description: 'A playful puppy companion who loves adventures',
      icon: Heart,
      color: 'bg-rose-100 text-rose-600 border-rose-200'
    },
    {
      id: 'magical_fairy',
      title: 'Magical Fairy',
      description: 'A tiny fairy with sparkling wings and powerful magic',
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-600 border-pink-200'
    },
    {
      id: 'brave_cat',
      title: 'Brave Cat',
      description: 'A courageous cat with special powers and nine lives',
      icon: Shield,
      color: 'bg-orange-100 text-orange-600 border-orange-200'
    }
  ]

  // Adventure-specific companions
  switch (adventureType) {
    case 'space':
      return [
        {
          id: 'robot_buddy',
          title: 'Robot Buddy',
          description: 'A friendly robot with lasers and jetpack capabilities',
          icon: Zap,
          color: 'bg-blue-100 text-blue-600 border-blue-200'
        },
        {
          id: 'alien_friend',
          title: 'Alien Friend',
          description: 'A colorful alien with telepathic powers and kind heart',
          icon: Star,
          color: 'bg-green-100 text-green-600 border-green-200'
        },
        {
          id: 'space_pet',
          title: 'Space Pet',
          description: 'A floating creature that can survive in zero gravity',
          icon: Heart,
          color: 'bg-purple-100 text-purple-600 border-purple-200'
        },
        ...baseCompanions.slice(0, 3)
      ]
    
    case 'princess':
      return [
        {
          id: 'royal_pony',
          title: 'Royal Pony',
          description: 'A beautiful pony with a golden saddle and royal spirit',
          icon: Crown,
          color: 'bg-pink-100 text-pink-600 border-pink-200'
        },
        {
          id: 'castle_cat',
          title: 'Castle Cat',
          description: 'An elegant cat who knows all the castle secrets',
          icon: Crown,
          color: 'bg-purple-100 text-purple-600 border-purple-200'
        },
        ...baseCompanions.filter(c => ['magical_unicorn', 'magical_fairy', 'wise_owl', 'loyal_puppy'].includes(c.id))
      ]
    
    case 'superhero':
      return [
        {
          id: 'super_dog',
          title: 'Super Dog',
          description: 'A heroic dog with cape and amazing superpowers',
          icon: Shield,
          color: 'bg-red-100 text-red-600 border-red-200'
        },
        {
          id: 'tech_sidekick',
          title: 'Tech Sidekick',
          description: 'A smart companion with high-tech gadgets',
          icon: Zap,
          color: 'bg-blue-100 text-blue-600 border-blue-200'
        },
        ...baseCompanions.filter(c => ['friendly_dragon', 'brave_cat', 'wise_owl'].includes(c.id))
      ]
    
    case 'animal':
      return [
        {
          id: 'safari_elephant',
          title: 'Safari Elephant',
          description: 'A gentle elephant who loves to explore the jungle',
          icon: Heart,
          color: 'bg-gray-100 text-gray-600 border-gray-200'
        },
        {
          id: 'jungle_monkey',
          title: 'Jungle Monkey',
          description: 'A playful monkey who swings through the trees',
          icon: Star,
          color: 'bg-brown-100 text-brown-600 border-brown-200'
        },
        {
          id: 'ocean_dolphin',
          title: 'Ocean Dolphin',
          description: 'A smart dolphin who loves to splash and play',
          icon: Heart,
          color: 'bg-blue-100 text-blue-600 border-blue-200'
        },
        ...baseCompanions.filter(c => ['loyal_puppy', 'brave_cat', 'wise_owl'].includes(c.id))
      ]
    
    default:
      return baseCompanions
  }
}

export function CompanionPicker() {
  const { 
    state, 
    setCompanion, 
    nextStep, 
    previousStep,
    canProceedFromCompanion 
  } = useAdventureWizard()

  const companions = getCompanionsForAdventure(state.adventureType)

  const handleCompanionSelect = (companionId: string) => {
    setCompanion(companionId)
  }

  const getAdventureTitle = (adventureType: string | null) => {
    const adventures = {
      magical: 'Magical Journey',
      space: 'Space Adventure',
      princess: 'Royal Adventure',
      superhero: 'Superhero Mission',
      animal: 'Animal Kingdom',
      fantasy: 'Fantasy Quest'
    }
    return adventures[adventureType as keyof typeof adventures] || 'Adventure'
  }

  const getLocationTitle = (locationId: string | null) => {
    const locations = {
      enchanted_forest: 'Enchanted Forest',
      floating_castle: 'Floating Castle',
      rainbow_beach: 'Rainbow Beach',
      crystal_mountains: 'Crystal Mountains',
      cloud_kingdom: 'Cloud Kingdom',
      backyard_adventure: 'Backyard Adventure',
      space_station: 'Space Station',
      alien_planet: 'Alien Planet',
      moon_base: 'Moon Base',
      royal_palace: 'Royal Palace',
      secret_garden: 'Secret Garden',
      city_rooftops: 'City Rooftops',
      secret_hideout: 'Secret Hideout',
      safari_elephant: 'Safari Plains',
      jungle_monkey: 'Jungle Treetops',
      ocean_dolphin: 'Ocean Depths'
    }
    return locations[locationId as keyof typeof locations] || 'Adventure Location'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
          Choose Your Companion
        </h1>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          Who would you like to join you on your adventure?
        </p>
      </div>

      {/* Show adventure and location summary */}
      {state.adventureType && state.location && (
        <Card className="p-4 bg-accent-aqua/10 border-accent-aqua/30 mb-6">
          <div className="text-center space-y-1">
            <p className="text-sm text-neutral-slate/80">
              <span className="font-medium">{getAdventureTitle(state.adventureType)}</span> at <span className="font-medium">{getLocationTitle(state.location)}</span>
            </p>
            {state.photoAnalysis && (
              <p className="text-xs text-neutral-slate/60">
                Starring: {state.photoAnalysis.child.appearance}
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companions.map((companion) => {
          const Icon = companion.icon
          const isSelected = state.companion === companion.id
          
          return (
            <Card 
              key={companion.id}
              className={`
                p-6 cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? 'ring-2 ring-primary-indigo bg-primary-indigo/5 border-primary-indigo' 
                  : 'hover:shadow-lg border-accent-aqua/30'
                }
              `}
              onClick={() => handleCompanionSelect(companion.id)}
            >
              <div className="text-center space-y-4">
                <div className={`inline-flex p-3 rounded-full ${companion.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-neutral-slate mb-2">
                    {companion.title}
                  </h3>
                  <p className="text-sm text-neutral-slate/70">
                    {companion.description}
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
          <span>Back to Location</span>
        </Button>

        {canProceedFromCompanion && (
          <Button 
            onClick={nextStep}
            size="lg"
            className="bg-primary-indigo hover:bg-primary-indigo/90 text-white flex items-center space-x-2"
          >
            <span>Create Adventure</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
