'use client'

import { Card } from '@/components/ui/card'

export type ColoringStyle = 'classic' | 'ghibli' | 'mandala'

interface StyleOption {
  id: ColoringStyle
  name: string
  description: string
  preview: string
}

const styles: StyleOption[] = [
  {
    id: 'classic',
    name: 'Classic Cartoon',
    description: 'Clean lines, perfect for young artists.',
    preview: '🎨'
  },
  {
    id: 'ghibli',
    name: 'Ghibli Style',
    description: 'Beautiful, detailed illustrations.',
    preview: '🌸'
  },
  {
    id: 'mandala',
    name: 'Mandala/Pattern',
    description: 'Intricate designs for mindfulness coloring.',
    preview: '🔯'
  }
]

interface StyleSelectionProps {
  selectedStyle: ColoringStyle | null
  onStyleSelect: (style: ColoringStyle) => void
}

export function StyleSelection({ selectedStyle, onStyleSelect }: StyleSelectionProps) {
  return (
    <Card className="p-6 bg-neutral-ivory border-2 border-accent-aqua/30">
      <div className="text-center mb-6">
        <h2 className="font-playfair text-3xl font-bold text-neutral-slate mb-4">
          Choose Your Coloring Style
        </h2>
        <p className="text-lg text-neutral-slate/80">
          Select the artistic style that matches your child&apos;s preferences
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`
              relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105
              ${selectedStyle === style.id
                ? 'border-primary-indigo bg-primary-indigo/10 shadow-lg' 
                : 'border-accent-aqua/50 bg-white/80 hover:border-primary-indigo/60'
              }
            `}
          >
            {selectedStyle === style.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-indigo rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-4xl mb-4">{style.preview}</div>
              <h3 className="font-playfair text-xl font-bold text-neutral-slate mb-2">
                {style.name}
              </h3>
              <p className="text-sm text-neutral-slate/70">
                {style.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
