/**
 * Compact logging system for the coloring page generation pipeline
 * Provides clean, emoji-enhanced output with optional debug mode
 */

import { CostTracker, calculateCost, type CostCalculation } from './cost-tracker'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LoggerConfig {
  logLevel?: LogLevel
  colors?: boolean
  pipeline?: string
}

export interface VisionMetrics {
  promptTokens: number
  completionTokens: number
  cost: CostCalculation
}

export interface ImageMetrics {
  promptTokens?: number
  completionTokens?: number
  cost: CostCalculation
  quality?: string
}

export class CompactLogger {
  private config: LoggerConfig
  private costTracker: CostTracker
  private startTime: number
  private timerLabel: string

  constructor(config: LoggerConfig = {}) {
    this.config = {
      logLevel: (process.env.LOG_LEVEL as LogLevel) || 'info',
      colors: true,
      ...config
    }
    this.costTracker = new CostTracker()
    this.startTime = 0
    this.timerLabel = config.pipeline || 'pipeline'
  }

  /**
   * Initialize the pipeline timer and log job start
   */
  startPipeline(params: {
    style: string
    difficulty: number
    photoSize: number
  }): void {
    this.startTime = Date.now()
    console.time(this.timerLabel)
    
    const sizeInMB = (params.photoSize / 1024 / 1024).toFixed(2)
    this.log('info', `🎨  Coloring‑page job started  (style=${params.style}, difficulty=${params.difficulty})`)
    this.log('info', `📸  Photo uploaded……………… ${sizeInMB} MB`)
  }

  /**
   * Log vision analysis step
   */
  logVision(metrics: VisionMetrics): void {
    this.costTracker.addCost(metrics.cost)
    
    this.log('info', `🧠  Vision step ▸ gpt‑4o`)
    this.log('info', `    Tokens  in/out  ${metrics.promptTokens.toLocaleString()} / ${metrics.completionTokens}`)
    this.log('info', `    Cost   ${metrics.cost.formattedCost}`)
    
    if (this.isDebug()) {
      this.debug('Vision analysis completed with detailed tokens', {
        input: metrics.promptTokens,
        output: metrics.completionTokens,
        breakdown: metrics.cost
      })
    }
  }

  /**
   * Log image generation step
   */
  logImage(metrics: ImageMetrics): void {
    this.costTracker.addCost(metrics.cost)
    
    const quality = metrics.quality || 'medium'
    this.log('info', `🖌️  Image step ▸ gpt‑image‑1  (${quality} quality)`)
    
    if (metrics.promptTokens) {
      this.log('info', `    Tokens  in/out       ${metrics.promptTokens} / 0`)
    }
    
    this.log('info', `    Image   flat fee     $${metrics.cost.flatCost.toFixed(4)}`)
    this.log('info', `    Cost   ${metrics.cost.formattedCost}`)
    
    if (this.isDebug()) {
      this.debug('Image generation completed', {
        prompt: metrics.promptTokens,
        flatFee: metrics.cost.flatCost,
        totalCost: metrics.cost.totalCost
      })
    }
  }

  /**
   * Log storage completion
   */
  logStorage(filename: string): void {
    this.log('info', `💾  Stored  ${filename}`)
    
    if (this.isDebug()) {
      this.debug('Image stored to Supabase', { filename })
    }
  }

  /**
   * Log database save
   */
  logDatabase(pageId: string): void {
    this.log('info', `🗄️  Saved   DB id ${pageId.slice(0, 8)}`)
    
    if (this.isDebug()) {
      this.debug('Page record saved', { fullPageId: pageId })
    }
  }

  /**
   * Log pipeline completion with total time and cost
   */
  completePipeline(): void {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1)
    const totalCost = this.costTracker.getFormattedTotal()
    
    console.timeEnd(this.timerLabel)
    this.log('info', `✅  Done in ${duration} s`)
    this.log('info', `💸  **OpenAI API total: ${totalCost}**`)
    
    if (this.isDebug()) {
      this.debug('Pipeline completed', {
        duration: `${duration}s`,
        totalCost,
        breakdown: this.costTracker.getSession().costs
      })
    }
  }

  /**
   * Log errors with appropriate styling
   */
  logError(message: string, error?: unknown): void {
    this.log('error', `❌  ${message}`)
    
    if (this.isDebug() && error) {
      this.debug('Error details', error)
    }
  }

  /**
   * Get current cost total
   */
  getCostTotal(): number {
    return this.costTracker.getTotal()
  }

  /**
   * Reset cost tracker for new job
   */
  reset(): void {
    this.costTracker.reset()
    this.startTime = 0
  }

  /**
   * Core logging method with level filtering
   */
  private log(level: LogLevel, message: string): void {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 }
    const currentLevel = levels[this.config.logLevel || 'info']
    const messageLevel = levels[level]
    
    if (messageLevel <= currentLevel) {
      if (level === 'error') {
        console.error(message)
      } else if (level === 'warn') {
        console.warn(message)
      } else {
        console.log(message)
      }
    }
  }

  /**
   * Debug logging for verbose mode
   */
  private debug(message: string, data?: unknown): void {
    if (this.isDebug()) {
      console.debug(`🔍 DEBUG: ${message}`)
      if (data) {
        console.debug(JSON.stringify(data, null, 2))
      }
    }
  }

  /**
   * Check if debug mode is enabled
   */
  private isDebug(): boolean {
    return this.config.logLevel === 'debug'
  }
}

/**
 * Helper function to create cost calculation for vision calls
 */
export function createVisionMetrics(
  promptTokens: number,
  completionTokens: number
): VisionMetrics {
  const cost = calculateCost({
    model: 'gpt-4o',
    prompt: promptTokens,
    completion: completionTokens
  })

  return {
    promptTokens,
    completionTokens,
    cost
  }
}

/**
 * Helper function to create cost calculation for image generation calls
 */
export function createImageMetrics(
  promptTokens?: number,
  quality: string = 'medium'
): ImageMetrics {
  const cost = calculateCost({
    model: 'gpt-image-1',
    prompt: promptTokens || 0,
    completion: 0,
    imageQuality: quality as any
  })

  return {
    promptTokens,
    completionTokens: 0,
    cost,
    quality
  }
}
