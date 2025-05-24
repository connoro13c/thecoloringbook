'use client';

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ScenePromptProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ScenePrompt({
  value,
  onChange,
  disabled = false,
}: ScenePromptProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">💭</span>
        <Label htmlFor="scene-prompt" className="text-lg font-bold text-gray-900">
          Describe the scene
        </Label>
      </div>
      <div className="relative">
        <Textarea
          id="scene-prompt"
          placeholder="My kids riding a unicorn through magical clouds..."
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={500}
          rows={4}
          className="resize-none rounded-2xl border-2 border-gray-200 focus:border-primary text-base p-4 placeholder:text-gray-400"
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
          {value.length}/500
        </div>
      </div>
      <div className="bg-blue-50 rounded-2xl p-4">
        <p className="text-sm text-blue-700 font-medium mb-2">💡 Example ideas:</p>
        <div className="text-sm text-blue-600 space-y-1">
          <p>• &quot;Flying through space with astronaut helmets&quot;</p>
          <p>• &quot;Playing with dinosaurs in a jungle&quot;</p>
          <p>• &quot;Having a tea party with teddy bears&quot;</p>
        </div>
      </div>
    </div>
  );
}