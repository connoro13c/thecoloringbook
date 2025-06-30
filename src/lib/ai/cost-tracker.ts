/**
 * OpenAI API cost tracking utilities
 * Prices derived from openai.com/api/pricing
 */

/** Prices in $ per token (from openai.com/api/pricing as of Jan 2025) */
const PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o': { in: 0.000005, out: 0.000020 }, // $5 / $20 per 1M tokens
  'gpt-4o-2024-08-06': { in: 0.000005, out: 0.000020 }, // $5 / $20 per 1M tokens
  'gpt-image-1': { in: 0.000005, out: 0.000040 }, // $5 text input / $40 image output per 1M
  'gpt-image-1-2025-04-23': { in: 0.000005, out: 0.000040 } // $5 text input / $40 image output per 1M
}

/** Image generation flat fees by quality */
const IMAGE_FEES = {
  'low': 0.01,
  'medium': 0.04, 
  'high': 0.17,
  'standard': 0.04, // alias for medium
  'hd': 0.17 // alias for high
} as const

export interface CostCalculation {
  model: string
  tokenCost: number
  flatCost: number
  totalCost: number
  formattedCost: string
}

export function calculateCost({
  model,
  prompt,
  completion = 0,
  imageQuality = 'high' // Default to high since that's what OpenAI seems to use
}: {
  model: string
  prompt: number
  completion?: number
  imageQuality?: keyof typeof IMAGE_FEES
}): CostCalculation {
  const pricing = PRICING[model]
  if (!pricing) {
    throw new Error(`Unknown model for cost calculation: ${model}`)
  }

  const tokenCost = prompt * pricing.in + completion * pricing.out
  const isImageModel = model.includes('gpt-image-1')
  const flatCost = isImageModel ? IMAGE_FEES[imageQuality] : 0
  const totalCost = tokenCost + flatCost

  return {
    model,
    tokenCost,
    flatCost,
    totalCost,
    formattedCost: `$${totalCost.toFixed(4)}`
  }
}

/**
 * Simplified cost calculation that returns just the total cost
 */
export function charge({
  model,
  prompt,
  completion = 0,
  imageQuality = 'high'
}: {
  model: string
  prompt: number 
  completion?: number
  imageQuality?: keyof typeof IMAGE_FEES
}): number {
  const pricing = PRICING[model]
  if (!pricing) {
    return 0
  }

  const tokenCost = prompt * pricing.in + completion * pricing.out
  const isImageModel = model.includes('gpt-image-1')
  const flatCost = isImageModel ? IMAGE_FEES[imageQuality] : 0
  const cost = tokenCost + flatCost
  
  return +cost.toFixed(6) // returns e.g. 0.180375
}

export interface CostSession {
  runningTotal: number
  costs: CostCalculation[]
}

export class CostTracker {
  private session: CostSession = {
    runningTotal: 0,
    costs: []
  }

  addCost(calculation: CostCalculation): void {
    this.session.runningTotal += calculation.totalCost
    this.session.costs.push(calculation)
  }

  getSession(): CostSession {
    return { ...this.session }
  }

  getTotal(): number {
    return this.session.runningTotal
  }

  getFormattedTotal(): string {
    return `$${this.session.runningTotal.toFixed(4)}`
  }

  reset(): void {
    this.session = {
      runningTotal: 0,
      costs: []
    }
  }
}
