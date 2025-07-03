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
    // Server-side: read from filesystem
    try {
      const fs = await import('fs')
      const path = await import('path')
      
      // Convert /test-images/sample.svg to public/test-images/sample.svg
      const filePath = path.join(process.cwd(), 'public', jpgUrl)
      const svgContent = fs.readFileSync(filePath, 'utf8')
      
      // Convert SVG to data URL
      const base64Svg = Buffer.from(svgContent).toString('base64')
      return `data:image/svg+xml;base64,${base64Svg}`
    } catch (error) {
      console.error('Failed to load sample image on server:', error)
      // Return a minimal SVG placeholder
      const placeholder = '<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="white"/><text x="512" y="512" text-anchor="middle" fill="black">Test Mode Coloring Page</text></svg>'
      const base64Placeholder = Buffer.from(placeholder).toString('base64')
      return `data:image/svg+xml;base64,${base64Placeholder}`
    }
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
