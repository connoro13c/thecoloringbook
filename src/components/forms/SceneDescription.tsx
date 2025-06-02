'use client'

import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface SceneDescriptionProps {
  value: string
  onChange: (value: string) => void
}

export function SceneDescription({ value, onChange }: SceneDescriptionProps) {
  return (
    <Card className="p-6 bg-neutral-ivory border-2 border-accent-aqua/30">
      <div className="text-center mb-6">
        <h2 className="font-playfair text-3xl font-bold text-neutral-slate mb-4">
          Describe the Adventure
        </h2>
        <p className="text-lg text-neutral-slate/80 max-w-md mx-auto">
          What scene would you like to create with your child?
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., My daughter flying a unicorn through rainbow clouds"
          className="
            min-h-[120px] text-lg p-4 
            border-2 border-accent-aqua/50 
            focus:border-primary-indigo 
            focus:ring-primary-indigo/20 
            rounded-xl
            bg-white/80
            placeholder:text-neutral-slate/50
          "
        />
        
        <div className="mt-4 text-sm text-neutral-slate/60 text-center">
          Be creative! Describe colors, settings, magical elements, or adventures your child loves.
        </div>
      </div>
    </Card>
  )
}
