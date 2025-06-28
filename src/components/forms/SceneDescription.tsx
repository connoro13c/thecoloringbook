'use client'

import { Card } from '@/components/ui/card'

interface SceneDescriptionProps {
  value: string
  onChange: (value: string) => void
}

export function SceneDescription({ value, onChange }: SceneDescriptionProps) {
  return (
    <Card className="p-8 bg-neutral-ivory/95 backdrop-blur-sm border-2 border-dashed border-primary-indigo/40 hover:border-primary-indigo/70 transition-colors shadow-lg">
      <div className="text-center">
        <h2 className="font-playfair text-3xl font-bold text-neutral-slate mb-6 drop-shadow-sm">
          Describe the Adventure
        </h2>
        
        <p className="text-lg text-neutral-slate mb-8 max-w-md mx-auto drop-shadow-sm">
          What scene would you like to create with your child?
        </p>

        <div className="border-2 border-dashed rounded-xl p-8 transition-all duration-300 border-primary-indigo/50 bg-primary-indigo/5">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-2xl">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g., My daughter flying a unicorn through rainbow clouds"
                className="
                  min-h-[120px] text-lg p-4 w-full
                  border-2 border-primary-indigo/30 
                  focus:border-primary-indigo 
                  rounded-xl
                  bg-white/90
                  placeholder:text-neutral-slate/50
                  resize-none
                  outline-none
                "
                style={{ 
                  boxShadow: 'none',
                  background: 'rgba(255, 255, 255, 0.9)'
                }}
              />
            </div>
            
            <div>
              <p className="text-sm text-neutral-slate/80 drop-shadow-sm text-center">
                Be creative! Describe colors, settings, magical elements, or adventures your child loves.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-neutral-slate/70 drop-shadow-sm">
          The more details you provide, the better your coloring page will be!
        </div>
      </div>
    </Card>
  )
}
