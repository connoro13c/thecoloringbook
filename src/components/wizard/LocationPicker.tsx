'use client'

import React from 'react'
import { useAdventureWizard } from '@/contexts/AdventureWizardContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, TreePine, Castle, Waves, Mountain, Cloud, Home } from 'lucide-react'

// Dynamic locations based on adventure type
const getLocationsForAdventure = (adventureType: string | null) => {
  const baseLocations = [
    {
      id: 'enchanted_forest',
      title: 'Enchanted Forest',
      description: 'Magical trees, sparkling streams, and hidden fairy houses',
      icon: TreePine,
      color: 'bg-green-100 text-green-600 border-green-200'
    },
    {
      id: 'floating_castle',
      title: 'Floating Castle',
      description: 'A majestic castle floating high above the clouds',
      icon: Castle,
      color: 'bg-purple-100 text-purple-600 border-purple-200'
    },
    {
      id: 'rainbow_beach',
      title: 'Rainbow Beach',
      description: 'Colorful sand beaches with crystal clear waters',
      icon: Waves,
      color: 'bg-blue-100 text-blue-600 border-blue-200'
    },
    {
      id: 'crystal_mountains',
      title: 'Crystal Mountains',
      description: 'Sparkling peaks that shine like diamonds in the sun',
      icon: Mountain,
      color: 'bg-amber-100 text-amber-600 border-amber-200'
    },
    {
      id: 'cloud_kingdom',
      title: 'Cloud Kingdom',
      description: 'A magical realm floating among fluffy white clouds',
      icon: Cloud,
      color: 'bg-sky-100 text-sky-600 border-sky-200'
    },
    {
      id: 'backyard_adventure',
      title: 'Backyard Adventure',
      description: 'Transform your own backyard into a magical playground',
      icon: Home,
      color: 'bg-rose-100 text-rose-600 border-rose-200'
    }
  ]

  // Adventure-specific modifications
  switch (adventureType) {
    case 'space':
      return [
        {
          id: 'space_station',
          title: 'Space Station',
          description: 'A futuristic station orbiting a distant planet',
          icon: Castle,
          color: 'bg-indigo-100 text-indigo-600 border-indigo-200'
        },
        {
          id: 'alien_planet',
          title: 'Alien Planet',
          description: 'A colorful world with strange and wonderful creatures',
          icon: Mountain,
          color: 'bg-purple-100 text-purple-600 border-purple-200'
        },
        {
          id: 'moon_base',
          title: 'Moon Base',
          description: 'Explore the surface of the moon with low gravity fun',
          icon: Cloud,
          color: 'bg-gray-100 text-gray-600 border-gray-200'
        },
        ...baseLocations.slice(0, 3)
      ]
    
    case 'princess':
      return [
        {
          id: 'royal_palace',
          title: 'Royal Palace',
          description: 'A grand palace with golden halls and beautiful gardens',
          icon: Castle,
          color: 'bg-pink-100 text-pink-600 border-pink-200'
        },
        {
          id: 'secret_garden',
          title: 'Secret Garden',
          description: 'A hidden garden full of magical flowers and butterflies',
          icon: TreePine,
          color: 'bg-green-100 text-green-600 border-green-200'
        },
        ...baseLocations.slice(1, 5)
      ]
    
    case 'superhero':
      return [
        {
          id: 'city_rooftops',
          title: 'City Rooftops',
          description: 'Soar above the city skyline and protect the citizens below',
          icon: Castle,
          color: 'bg-red-100 text-red-600 border-red-200'
        },
        {
          id: 'secret_hideout',
          title: 'Secret Hideout',
          description: 'A hidden base filled with superhero gadgets and technology',
          icon: Home,
          color: 'bg-blue-100 text-blue-600 border-blue-200'
        },
        ...baseLocations.slice(0, 4)
      ]
    
    default:
      return baseLocations
  }
}

export function LocationPicker() {
  const { 
    state, 
    setLocation, 
    nextStep, 
    previousStep,
    canProceedFromLocation 
  } = useAdventureWizard()

  const locations = getLocationsForAdventure(state.adventureType)

  const handleLocationSelect = (locationId: string) => {
    setLocation(locationId)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="font-playfair text-4xl font-bold text-neutral-slate mb-4">
          Choose Your Location
        </h1>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          Where would you like your {getAdventureTitle(state.adventureType).toLowerCase()} to take place?
        </p>
      </div>

      {/* Show selected adventure */}
      {state.adventureType && (
        <Card className="p-4 bg-primary-indigo/10 border-primary-indigo/30 mb-6">
          <div className="text-center">
            <p className="text-sm text-neutral-slate/80">
              Adventure Type: <span className="font-medium">{getAdventureTitle(state.adventureType)}</span>
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => {
          const Icon = location.icon
          const isSelected = state.location === location.id
          
          return (
            <Card 
              key={location.id}
              className={`
                p-6 cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? 'ring-2 ring-primary-indigo bg-primary-indigo/5 border-primary-indigo' 
                  : 'hover:shadow-lg border-accent-aqua/30'
                }
              `}
              onClick={() => handleLocationSelect(location.id)}
            >
              <div className="text-center space-y-4">
                <div className={`inline-flex p-3 rounded-full ${location.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="font-playfair text-lg font-semibold text-neutral-slate mb-2">
                    {location.title}
                  </h3>
                  <p className="text-sm text-neutral-slate/70">
                    {location.description}
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
          <span>Back to Adventure</span>
        </Button>

        {canProceedFromLocation && (
          <Button 
            onClick={nextStep}
            size="lg"
            className="bg-primary-indigo hover:bg-primary-indigo/90 text-white flex items-center space-x-2"
          >
            <span>Choose Companion</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
