import OpenAI from 'openai'
import { getRequiredEnv, getOptionalEnv } from './env-validation'

let openaiInstance: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = getRequiredEnv('OPENAI_API_KEY')
    openaiInstance = new OpenAI({ apiKey })
  }
  return openaiInstance
}

// Lazy-loaded models configuration
export function getOpenAIModels() {
  return {
    VISION: getOptionalEnv('OPENAI_VISION_MODEL', 'gpt-4o'),
    ImageGen: getOptionalEnv('OPENAI_IMAGE_MODEL', 'gpt-image-1'),
  } as const
}

// For backwards compatibility - but prefer using getOpenAI() and getOpenAIModels() 
// to avoid build-time issues
export { getOpenAI as openai }
export { getOpenAIModels as OPENAI_MODELS }
