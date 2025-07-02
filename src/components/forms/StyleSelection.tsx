'use client'

import { Card } from '@/components/ui/card'
import type { ColoringStyle } from '@/types'
import { ClassicCartoonIcon, GhibliIcon, MandalaIcon } from '@/components/ui/icons/WatercolorIcons'

interface StyleSelectionProps {
  selectedStyle: ColoringStyle | null
  onStyleSelect: (style: ColoringStyle) => void
}

export function StyleSelection({ selectedStyle, onStyleSelect }: StyleSelectionProps) {
  return (
    <Card className="p-6 bg-neutral-ivory border-2 border-accent-aqua/30">
      <div className="text-center mb-6">
        <h2 className="font-playfair text-3xl font-bold text-neutral-slate mb-4">
          Choose your coloring style
        </h2>
        <p className="text-lg text-neutral-slate/80">
          Select the artistic style that matches your child&apos;s preferences
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Classic Cartoon */}
        <div
          onClick={() => onStyleSelect('classic')}
          className={`
            relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
            bg-gradient-to-br from-orange-100 via-pink-50 to-orange-50
            border-2 border-orange-200/60 shadow-md hover:shadow-lg
            ${selectedStyle === 'classic' ? 'ring-2 ring-primary-indigo/30 border-primary-indigo' : ''}
          `}
        >
          {selectedStyle === 'classic' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-indigo rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          
          <div className="text-center">
            <div className="mb-3 flex justify-center text-amber-700">
              <ClassicCartoonIcon className="w-10 h-10" />
            </div>
            <h3 className="font-playfair text-lg font-bold text-amber-800 mb-1">
              Classic cartoon
            </h3>
            <p className="text-xs text-amber-700/80">
              Clean lines, perfect for young artists.
            </p>
          </div>
        </div>

        {/* Ghibli Style */}
        <div
          onClick={() => onStyleSelect('ghibli')}
          className={`
            relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
            bg-gradient-to-br from-blue-100 via-cyan-50 to-green-50
            border-2 border-blue-200/60 shadow-md hover:shadow-lg
            ${selectedStyle === 'ghibli' ? 'ring-2 ring-primary-indigo/30 border-primary-indigo' : ''}
          `}
        >
          {selectedStyle === 'ghibli' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-indigo rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          
          <div className="text-center">
            <div className="mb-3 flex justify-center text-teal-700">
              <GhibliIcon className="w-10 h-10" />
            </div>
            <h3 className="font-playfair text-lg font-bold text-teal-800 mb-1">
              Ghibli style
            </h3>
            <p className="text-xs text-teal-700/80">
              Beautiful, detailed illustrations.
            </p>
          </div>
        </div>

        {/* Mandala Pattern */}
        <div
          onClick={() => onStyleSelect('mandala')}
          className={`
            relative p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
            bg-gradient-to-br from-purple-100 via-pink-50 to-purple-50
            border-2 border-purple-200/60 shadow-md hover:shadow-lg
            ${selectedStyle === 'mandala' ? 'ring-2 ring-primary-indigo/30 border-primary-indigo' : ''}
          `}
        >
          {selectedStyle === 'mandala' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-indigo rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}
          
          <div className="text-center">
            <div className="mb-3 flex justify-center text-purple-700">
              <MandalaIcon className="w-10 h-10" />
            </div>
            <h3 className="font-playfair text-lg font-bold text-purple-800 mb-1">
              Mandala pattern
            </h3>
            <p className="text-xs text-purple-700/80">
              Intricate designs for mindfulness coloring.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
