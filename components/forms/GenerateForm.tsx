'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useGenerateColoringPage } from '@/lib/hooks/useJobs'
import { Loader2 } from 'lucide-react'
import type { Style } from '@/lib/api'

const formSchema = z.object({
  prompt: z.string().min(1, 'Please describe what you want to create').max(500),
  style: z.enum(['CLASSIC', 'MANGA', 'BOLD'] as const),
  difficulty: z.number().min(1).max(5),
})

type FormData = z.infer<typeof formSchema>

const styleOptions = [
  {
    value: 'CLASSIC' as const,
    label: 'Classic Cartoon',
    description: 'Simple, clean lines perfect for young children'
  },
  {
    value: 'MANGA' as const,
    label: 'Manga Lite',
    description: 'Anime-inspired with dynamic character poses'
  },
  {
    value: 'BOLD' as const,
    label: 'Bold Outlines',
    description: 'Thick, prominent lines for easy coloring'
  },
]

interface GenerateFormProps {
  onSuccess?: (jobId: string) => void
}

export function GenerateForm({ onSuccess }: GenerateFormProps) {
  const [difficulty, setDifficulty] = useState([3])
  const generateMutation = useGenerateColoringPage()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      style: 'CLASSIC',
      difficulty: 3,
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const result = await generateMutation.mutateAsync({
        ...data,
        difficulty: difficulty[0],
      })
      
      if (onSuccess) {
        onSuccess(result.jobId)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Coloring Page</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              What would you like to create? *
            </Label>
            <Textarea
              id="prompt"
              placeholder="A happy puppy playing in a garden with butterflies..."
              className="min-h-20"
              {...form.register('prompt')}
            />
            {form.formState.errors.prompt && (
              <p className="text-sm text-red-600">
                {form.formState.errors.prompt.message}
              </p>
            )}
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Choose Art Style *</Label>
            <RadioGroup
              value={form.watch('style')}
              onValueChange={(value) => form.setValue('style', value as Style)}
              className="space-y-3"
            >
              {styleOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
            {form.formState.errors.style && (
              <p className="text-sm text-red-600">
                {form.formState.errors.style.message}
              </p>
            )}
          </div>

          {/* Difficulty Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Difficulty Level</Label>
              <span className="text-sm font-medium">{difficulty[0]}/5</span>
            </div>
            <Slider
              value={difficulty}
              onValueChange={setDifficulty}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Simple</span>
              <span>Complex</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Coloring Page'
            )}
          </Button>

          {generateMutation.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              Failed to generate coloring page. Please try again.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}