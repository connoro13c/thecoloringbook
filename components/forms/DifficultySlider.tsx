'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
// import { Baby, User, GraduationCap, Crown } from 'lucide-react';

interface DifficultySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const difficultyLevels = [
  {
    level: 1,
    name: 'Super Simple',
    description: 'Big shapes, perfect for tiny hands',
    emoji: '🍎',
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  {
    level: 2,
    name: 'Easy Peasy',
    description: 'Simple shapes with a few details',
    emoji: '🌟',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    level: 3,
    name: 'Just Right',
    description: 'Perfect balance of fun and challenge',
    emoji: '🎯',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  {
    level: 4,
    name: 'Challenge Mode',
    description: 'More details for focused coloring',
    emoji: '🧩',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
  {
    level: 5,
    name: 'Master Level',
    description: 'Intricate details for coloring pros',
    emoji: '👑',
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
];

export default function DifficultySlider({
  value,
  onChange,
  disabled = false,
}: DifficultySliderProps) {
  const currentLevel = difficultyLevels.find(level => level.level === value) || difficultyLevels[2];

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xl">⚡</span>
        <Label className="text-lg font-bold text-gray-900">
          Choose difficulty
        </Label>
      </div>

      <div className={`${currentLevel.bgColor} rounded-3xl p-6 border-2 border-white/50`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl">{currentLevel.emoji}</div>
          <div>
            <h3 className={`text-xl font-bold ${currentLevel.color}`}>
              {currentLevel.name}
            </h3>
            <p className="text-gray-700 text-sm">
              {currentLevel.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={1}
            max={5}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          
          {/* Difficulty level indicators */}
          <div className="flex justify-between">
            {difficultyLevels.map((level) => (
              <button
                type="button"
                key={level.level}
                onClick={() => onChange(level.level)}
                disabled={disabled}
                className={`flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all touch-target ${
                  level.level === value 
                    ? `${level.bgColor} scale-110 shadow-lg` 
                    : 'hover:bg-white/50 hover:scale-105'
                }`}
              >
                <span className="text-lg">{level.emoji}</span>
                <span className="text-xs font-medium text-gray-700 hidden sm:block">
                  {level.name}
                </span>
                <span className="text-xs font-bold text-gray-500 sm:hidden">
                  {level.level}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-2xl p-4">
        <p className="text-sm text-blue-700">
          <span className="font-bold">💡 Tip:</span> Start with &quot;Just Right&quot; and adjust based on your child&apos;s age and coloring experience!
        </p>
      </div>
    </div>
  );
}