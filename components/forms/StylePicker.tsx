'use client';

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Palette, Sparkles, Bold } from 'lucide-react';

export type StyleType = 'classic' | 'manga' | 'bold';

interface StylePickerProps {
  value: StyleType;
  onChange: (value: StyleType) => void;
  disabled?: boolean;
}

const styles = [
  {
    id: 'classic' as const,
    name: 'Classic Cartoon',
    description: 'Simple, clean outlines perfect for all ages',
    icon: Palette,
    preview: '🎨',
  },
  {
    id: 'manga' as const,
    name: 'Manga Lite',
    description: 'Anime-inspired with expressive details',
    icon: Sparkles,
    preview: '✨',
  },
  {
    id: 'bold' as const,
    name: 'Bold Outlines',
    description: 'Thick lines ideal for young children',
    icon: Bold,
    preview: '🖍️',
  },
];

export default function StylePicker({
  value,
  onChange,
  disabled = false,
}: StylePickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🎨</span>
        <Label className="text-lg font-bold text-gray-900">
          Pick your style
        </Label>
      </div>
      
      <RadioGroup
        value={value}
        onValueChange={(newValue) => onChange(newValue as StyleType)}
        disabled={disabled}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {styles.map((style) => {
          return (
            <div key={style.id} className="relative">
              <RadioGroupItem
                value={style.id}
                id={style.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={style.id}
                className={`
                  flex flex-col items-center p-6 rounded-3xl border-2 cursor-pointer transition-all touch-target
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 hover:scale-105'}
                  ${value === style.id ? 'border-primary bg-primary/10 shadow-lg scale-105' : 'border-gray-200'}
                  focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  relative overflow-hidden group
                `}
              >
                <div className={`absolute top-2 right-2 transition-opacity ${value === style.id ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{style.preview}</span>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2 text-center text-lg">
                  {style.name}
                </h3>
                
                <p className="text-sm text-gray-600 text-center leading-relaxed">
                  {style.description}
                </p>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}