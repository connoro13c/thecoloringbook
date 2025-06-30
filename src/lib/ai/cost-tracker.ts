/**
 * OpenAI API cost tracking utilities
 * Prices derived from openai.com/api/pricing
 */

/** Prices in $ per token */
const PRICING: Record<string, { in: number; out: number; flat?: number }> = {
  'gpt-4o': { in: 0.000005, out: 0.000020 }, // $5 / $20 per 1M tokens
  'gpt-image-1': { in: 0.000010, out: 0.000040, flat: 0.04 } // $10 / $40 per 1M + ~$0.04 per medium image
}

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
  imageQuality = 'medium'
}: {
  model: string
  prompt: number
  completion?: number
  imageQuality?: 'medium' | 'standard' | 'hd'
}): CostCalculation {
  const pricing = PRICING[model]
  if (!pricing) {
    throw new Error(`Unknown model for cost calculation: ${model}`)
  }

  const tokenCost = prompt * pricing.in + completion * pricing.out
  const flatCost = model === 'gpt-image-1' ? (pricing.flat || 0) : 0
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
  imageQuality = 'medium'
}: {
  model: string
  prompt: number 
  completion?: number
  imageQuality?: 'medium' | 'standard' | 'hd'
}): number {
  const pricing = PRICING[model]
  if (!pricing) {
    return 0
  }

  const cost = (
    prompt * pricing.in +
    completion * pricing.out +
    (model === 'gpt-image-1' ? (pricing.flat || 0) : 0)
  )
  
  return +cost.toFixed(6) // returns e.g. 0.050375
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
