import type { PhotoAnalysis } from './photo-analysis'
import type { ColoringStyle } from '@/components/forms/StyleSelection'

interface PromptComponents {
  photoAnalysis: PhotoAnalysis
  sceneDescription: string
  style: ColoringStyle
  difficulty: number
}

const STYLE_PROMPTS = {
  classic: {
    artStyle: 'classic cartoon coloring book style',
    characteristics: 'clean bold outlines, simple shapes, clear distinct sections',
    lineWeight: 'thick black outlines perfect for coloring',
    complexity: 'age-appropriate with clear defined areas'
  },
  ghibli: {
    artStyle: 'Studio Ghibli inspired coloring book style',
    characteristics: 'beautiful detailed illustrations, organic flowing lines, magical elements',
    lineWeight: 'varied line weights with intricate details',
    complexity: 'detailed but accessible, with both simple and complex areas'
  },
  mandala: {
    artStyle: 'mandala and pattern coloring book style',
    characteristics: 'intricate geometric patterns, symmetrical designs, decorative elements',
    lineWeight: 'fine detailed lines with pattern work',
    complexity: 'complex patterns suitable for mindfulness coloring'
  }
} as const

const DIFFICULTY_MODIFIERS = {
  1: 'very simple, thick lines, minimal details, perfect for toddlers',
  2: 'simple, clear shapes, basic details, good for young children',
  3: 'moderate detail, balanced complexity, suitable for school-age children',
  4: 'detailed with intricate elements, challenging but achievable',
  5: 'highly detailed, complex patterns, suitable for older children and adults'
} as const

export function buildColoringPagePrompt({
  photoAnalysis,
  sceneDescription,
  style,
  difficulty
}: PromptComponents): string {
  const styleConfig = STYLE_PROMPTS[style]
  const difficultyModifier = DIFFICULTY_MODIFIERS[difficulty as keyof typeof DIFFICULTY_MODIFIERS]

  // Extract key elements from photo analysis
  const childDescription = `${photoAnalysis.child.age} ${photoAnalysis.child.gender} with ${photoAnalysis.child.appearance}`
  const clothingDetails = photoAnalysis.child.clothing
  const expression = photoAnalysis.child.expression
  const recommendedElements = photoAnalysis.suggestions.recommendedElements.join(', ')

  // Build the comprehensive prompt
  const prompt = `Create a ${styleConfig.artStyle} coloring page featuring:

MAIN SUBJECT:
- ${childDescription} 
- Wearing ${clothingDetails}
- With a ${expression} expression
- In the scene: ${sceneDescription}

ARTISTIC STYLE:
- ${styleConfig.characteristics}
- ${styleConfig.lineWeight}
- ${difficultyModifier}

SCENE COMPOSITION:
- Incorporate magical elements: ${recommendedElements}
- Background should complement the scene: ${sceneDescription}
- Maintain focus on the child as the central figure
- Include decorative elements that match the ${style} style

TECHNICAL REQUIREMENTS:
- Black and white line art only
- No shading, gradients, or filled areas
- Clean, crisp outlines suitable for coloring
- Proper spacing between elements for coloring tools
- ${difficulty >= 4 ? 'Include intricate details and patterns' : 'Keep details simple and clear'}
- Ensure all lines connect properly for clean coloring sections

COMPOSITION NOTES:
- Child should be prominently featured and recognizable
- Scene elements should enhance rather than overwhelm
- Leave appropriate white space for coloring
- Make it magical and engaging for a child to color

Style: ${styleConfig.artStyle}
Complexity: Level ${difficulty}/5`

  return prompt
}

export function buildDallePrompt(components: PromptComponents): string {
  const basePrompt = buildColoringPagePrompt(components)
  
  // Add DALL-E specific optimizations
  const dalleOptimizations = `

DALL-E SPECIFIC INSTRUCTIONS:
- Create this as a high-quality black and white line drawing
- Ensure thick, bold outlines that are perfect for printing
- No shading, textures, or gray areas - pure black lines on white background
- Make it look like a professional coloring book page
- Focus on clean, simple line art that children can easily color
- Avoid photorealistic details - use stylized illustration approach`

  return basePrompt + dalleOptimizations
}
