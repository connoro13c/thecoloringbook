/**
 * Tiered logging system - compact ledger + collapsible details
 * Provides scannable overview with rich context available below
 */

import { CostCalculation } from './cost-tracker'

export interface JobContext {
  id: number
  style: string
  difficulty: number
  scene: string
  photoSize: number
  analysis: {
    age: string
    appearance: string
    pose: string
    perspective: string
    elements: string[]
    complexity: string
    usingFallback: boolean
  }
  promptSample: string // first 120 chars
  fileName: string
  recordId: string
  timing: number // ms
  costs: {
    vision: number
    image: number
    total: number
  }
  tokens: {
    vision: { input: number; output: number }
    image: { input: number; output: number }
  }
}

export class TieredLogger {
  private context: Partial<JobContext> = {}
  private startTime: number = 0
  private stepTimes: { [key: string]: number } = {}
  private jobId: number

  constructor() {
    this.jobId = Math.floor(Math.random() * 9999) + 1000 // Random 4-digit ID
  }

  /**
   * Initialize job with basic parameters
   */
  startJob(params: {
    style: string
    difficulty: number
    scene: string
    photoSize: number
  }): void {
    this.startTime = Date.now()
    this.context = {
      id: this.jobId,
      style: params.style,
      difficulty: params.difficulty,
      scene: params.scene.length > 50 ? params.scene.slice(0, 47) + '...' : params.scene,
      photoSize: params.photoSize,
      costs: { vision: 0, image: 0, total: 0 },
      tokens: { 
        vision: { input: 0, output: 0 }, 
        image: { input: 0, output: 0 } 
      }
    }

    // Mark step start times
    this.stepTimes.upload = Date.now()
    this.stepTimes.vision = Date.now()

    // Output job header immediately
    const photoMB = (params.photoSize / 1024 / 1024).toFixed(2)
    const bar = '─'.repeat(42)
    
    console.log(`🖍️  Coloring‑page #${this.jobId}   ⏱ starting...`)
    console.log(bar)
    console.log(`📸  Photo       ${photoMB} MB          style=${params.style}  diff=${params.difficulty}`)
  }

  /**
   * Add vision analysis results
   */
  addVisionData(params: {
    cost: CostCalculation
    tokens: { input: number; output: number }
    analysis: {
      age: string
      appearance: string
      pose: string
      perspective: string
      elements: string[]
      complexity: string
      usingFallback: boolean
    }
  }): void {
    this.context.costs!.vision = params.cost.totalCost
    this.context.tokens!.vision = params.tokens
    this.context.analysis = params.analysis

    // Calculate vision step duration
    const visionDuration = (Date.now() - this.stepTimes.vision) / 1000
    this.stepTimes.image = Date.now()

    // Output vision step immediately with timing
    const totalTokens = params.tokens.input + params.tokens.output
    this.logModelLine('🧠', 'gpt‑4o', totalTokens, params.cost.totalCost, false, visionDuration)
  }

  /**
   * Add image generation results
   */
  addImageData(params: {
    cost: CostCalculation
    tokens: { input: number; output: number }
    promptSample: string
  }): void {
    this.context.costs!.image = params.cost.totalCost
    this.context.tokens!.image = params.tokens
    this.context.promptSample = params.promptSample.slice(0, 120)

    // Calculate image step duration
    const imageDuration = (Date.now() - this.stepTimes.image) / 1000
    this.stepTimes.storage = Date.now()

    // Output image step immediately with timing
    this.logModelLine('🎨', 'gpt‑img‑1', params.tokens.input, params.cost.totalCost, true, imageDuration)
  }

  /**
   * Add storage and database results
   */
  addStorageData(params: {
    fileName: string
    recordId: string
  }): void {
    this.context.fileName = params.fileName
    this.context.recordId = params.recordId

    // Calculate storage step duration
    const storageDuration = (Date.now() - this.stepTimes.storage) / 1000

    // Output storage step immediately with timing
    const bar = '─'.repeat(42)
    console.log(bar)
    console.log(`💾  File        ${params.fileName}                   ⏱ ${storageDuration.toFixed(1)}s`)
    console.log(`🗄️  Record      ${params.recordId.slice(0, 8)}`)
  }

  /**
   * Complete job and output final summary
   */
  completeJob(): void {
    this.context.timing = Date.now() - this.startTime
    this.context.costs!.total = this.context.costs!.vision + this.context.costs!.image
    
    // Output final summary and details
    console.log(`💸  Cost total                        $${this.context.costs!.total.toFixed(4)}`)
    console.log(`✅  Done in ${(this.context.timing! / 1000).toFixed(1)} s`)
    
    // Output details section
    this.outputDetailsSection(this.context as JobContext)
  }

  /**
   * Log error
   */
  logError(message: string, error?: unknown): void {
    const bar = '─'.repeat(42)
    console.error(`❌  Job #${this.jobId} failed`)
    console.error(bar)
    console.error(`    ${message}`)
    if (this.isDebug() && error) {
      console.error('    Error details:', error)
    }
    console.error(bar)
  }

  /**
   * Output the details section only
   */
  private outputDetailsSection(ctx: JobContext): void {
    const bar = '─'.repeat(42)
    
    // Details section
    console.log('╰─ ▶ details ' + '─'.repeat(39))
    console.log(`   • Scene…… "${ctx.scene}"`)
    console.log('   • Analysis')
    this.logField('age', ctx.analysis.age)
    this.logField('appearance', ctx.analysis.appearance)
    this.logField('pose', ctx.analysis.pose)
    this.logField('perspective', ctx.analysis.perspective)
    this.logField('elements', ctx.analysis.elements.join(', '))
    this.logField('complexity', `${ctx.analysis.complexity}   (${ctx.analysis.usingFallback ? 'fallback' : 'no fallback'})`)
    console.log('   • Prompt excerpt')
    console.log('       ' + ctx.promptSample.replace(/\n/g, ' '))
    console.log(bar)
  }

  /**
   * Helper for model cost lines
   */
  private logModelLine(icon: string, model: string, tokens: number, cost: number, hasFlat = false, duration?: number): void {
    const durationStr = duration ? `⏱ ${duration.toFixed(1)}s` : ''
    console.log(`${icon}  ${model.padEnd(11)} ${tokens.toString().padStart(5)} tok   $${cost.toFixed(4)}  ${durationStr}`)
    if (hasFlat) {
      const flatCost = 0.17 // High quality image fee
      console.log(' '.repeat(31) + `└─ flat  $${flatCost.toFixed(4)}`)
    }
  }

  /**
   * Helper for detail fields
   */
  private logField(label: string, value: string): void {
    const truncatedValue = value.length > 60 ? value.slice(0, 57) + '...' : value
    console.log(`       ${label.padEnd(13, '…')} ${truncatedValue}`)
  }

  /**
   * Check if debug mode is enabled
   */
  private isDebug(): boolean {
    return process.env.LOG_LEVEL === 'debug'
  }

  /**
   * Debug logging for verbose mode
   */
  debug(message: string, data?: unknown): void {
    if (this.isDebug()) {
      console.debug(`🔍 DEBUG: ${message}`)
      if (data) {
        console.debug(JSON.stringify(data, null, 2))
      }
    }
  }

  /**
   * Get current job ID
   */
  getJobId(): number {
    return this.jobId
  }
}
