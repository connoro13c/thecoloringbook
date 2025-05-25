'use client';

import { Card, CardContent } from '@/components/ui/card';

export interface OrientationPickerProps {
  value: 'portrait' | 'landscape';
  onChange: (orientation: 'portrait' | 'landscape') => void;
  disabled?: boolean;
}

export default function OrientationPicker({ value, onChange, disabled }: OrientationPickerProps) {
  const orientations = [
    {
      id: 'portrait' as const,
      name: 'Portrait',
      description: 'Tall format (good for people, full-body scenes)',
      icon: '📱'
    },
    {
      id: 'landscape' as const,
      name: 'Landscape', 
      description: 'Wide format (good for scenes, groups, activities)',
      icon: '🖼️'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Page Orientation</h3>
      <div className="grid grid-cols-2 gap-3">
        {orientations.map((orientation) => (
          <Card
            key={orientation.id}
            className={`cursor-pointer transition-all duration-200 ${
              value === orientation.id
                ? 'ring-2 ring-purple-500 bg-purple-50'
                : 'hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onChange(orientation.id)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">{orientation.icon}</div>
                <h4 className="font-medium text-sm text-gray-900">
                  {orientation.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {orientation.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}