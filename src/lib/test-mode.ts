/**
 * Test mode utilities for bypassing AI generation during development
 */

export const isTestMode = () => {
  // Check environment variable first
  if (process.env.ENABLE_TEST_MODE === 'true') {
    return true
  }
  
  // In development, also check localStorage (client-side only)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return localStorage.getItem('test-mode') === 'true'
  }
  
  return false
}

// Sample coloring page data for testing
export const SAMPLE_COLORING_PAGES = [
  {
    style: 'Classic Cartoon',
    description: 'Child riding a magical unicorn through clouds',
    jpgUrl: '/test-images/sample-unicorn-coloring.jpg',
    difficulty: 3
  },
  {
    style: 'Ghibli Style',
    description: 'Child exploring a magical forest with woodland creatures',
    jpgUrl: '/test-images/sample-forest-coloring.jpg',
    difficulty: 4
  },
  {
    style: 'Mandala/Pattern',
    description: 'Child surrounded by intricate mandala patterns',
    jpgUrl: '/test-images/sample-mandala-coloring.jpg',
    difficulty: 5
  }
]

// Mock photo analysis result
export const getMockPhotoAnalysis = () => ({
  child_description: {
    hair_color: "brown",
    hair_style: "shoulder-length wavy",
    clothing: "striped t-shirt and jeans",
    age_estimate: "6-8 years old",
    pose: "standing with arms slightly raised",
    accessories: ["small backpack"]
  },
  scene_elements: {
    suggested_complexity: 3,
    recommended_style: "Classic Cartoon",
    character_positioning: "centered, full body visible"
  },
  technical_notes: {
    image_quality: "good",
    lighting: "adequate for processing",
    composition: "well-framed subject"
  }
})

// Get a random sample coloring page for testing
export const getRandomSamplePage = () => {
  const randomIndex = Math.floor(Math.random() * SAMPLE_COLORING_PAGES.length)
  return SAMPLE_COLORING_PAGES[randomIndex]
}

// Convert sample image to data URL for consistent interface
export const getSampleImageAsDataUrl = async (jpgUrl: string): Promise<string> => {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
  
  try {
    const response = await fetch(jpgUrl)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load sample image:', error)
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
}
