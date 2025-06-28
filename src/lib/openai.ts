import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const OPENAI_MODELS = {
  VISION: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
  ImageGen: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',  
} as const
