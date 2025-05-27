'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ChildAttributes } from '@/lib/prompt-builder'

interface EditableAnalysisProps {
  analysis: ChildAttributes
  onUpdate: (updatedAnalysis: ChildAttributes) => void
}

export default function EditableAnalysis({ 
  analysis, 
  onUpdate 
}: EditableAnalysisProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<ChildAttributes>(analysis)

  const handleSave = () => {
    onUpdate(editedAnalysis)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedAnalysis(analysis)
    setIsEditing(false)
  }

  const updateField = (field: keyof ChildAttributes, value: string) => {
    setEditedAnalysis(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isEditing) {
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">
            What our AI sees in your photo:
          </h4>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            ✏️ Edit
          </Button>
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <div><strong>Age:</strong> {analysis.age}</div>
          <div><strong>Hair:</strong> {analysis.hair_style}</div>
          {analysis.headwear !== 'none' && <div><strong>Headwear:</strong> {analysis.headwear}</div>}
          {analysis.eyewear !== 'none' && <div><strong>Eyewear:</strong> {analysis.eyewear}</div>}
          <div><strong>Clothing:</strong> {analysis.clothing}</div>
          <div><strong>Pose:</strong> {analysis.pose}</div>
          {analysis.main_object !== 'none' && <div><strong>Main object:</strong> {analysis.main_object}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-yellow-900">
          Edit AI Analysis:
        </h4>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="text-xs bg-green-600 hover:bg-green-700"
          >
            ✓ Save
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 text-sm">
        <div>
          <Label htmlFor="age" className="text-xs font-medium text-gray-700">Age</Label>
          <Input
            id="age"
            value={editedAnalysis.age}
            onChange={(e) => updateField('age', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. young child, toddler, school age"
          />
        </div>
        
        <div>
          <Label htmlFor="hair_style" className="text-xs font-medium text-gray-700">Hair Style</Label>
          <Input
            id="hair_style"
            value={editedAnalysis.hair_style}
            onChange={(e) => updateField('hair_style', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. short curly hair, long straight hair"
          />
        </div>
        
        <div>
          <Label htmlFor="headwear" className="text-xs font-medium text-gray-700">Headwear</Label>
          <Input
            id="headwear"
            value={editedAnalysis.headwear}
            onChange={(e) => updateField('headwear', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. baseball cap, headband, none"
          />
        </div>
        
        <div>
          <Label htmlFor="eyewear" className="text-xs font-medium text-gray-700">Eyewear</Label>
          <Input
            id="eyewear"
            value={editedAnalysis.eyewear}
            onChange={(e) => updateField('eyewear', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. round sunglasses, glasses, none"
          />
        </div>
        
        <div>
          <Label htmlFor="clothing" className="text-xs font-medium text-gray-700">Clothing</Label>
          <Input
            id="clothing"
            value={editedAnalysis.clothing}
            onChange={(e) => updateField('clothing', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. t-shirt and shorts, dress with sleeves"
          />
        </div>
        
        <div>
          <Label htmlFor="pose" className="text-xs font-medium text-gray-700">Pose</Label>
          <Input
            id="pose"
            value={editedAnalysis.pose}
            onChange={(e) => updateField('pose', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. standing with arms raised, sitting cross-legged"
          />
        </div>
        
        <div>
          <Label htmlFor="main_object" className="text-xs font-medium text-gray-700">Main Object</Label>
          <Input
            id="main_object"
            value={editedAnalysis.main_object}
            onChange={(e) => updateField('main_object', e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. toy car, ball, none"
          />
        </div>
      </div>
      
      <p className="text-xs text-yellow-700 mt-3">
        💡 Tip: Make sure the analysis accurately describes what you want in the coloring page. This helps our AI generate better results.
      </p>
    </div>
  )
}