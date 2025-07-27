/**
 * Progressive CLI logger with real-time spinners and step-by-step updates
 * Builds on TieredLogger but adds interactive CLI experience
 */

import ora from 'ora';
import { CostCalculation } from './cost-tracker';

export interface JobContext {
  id: number;
  style: string;
  difficulty: number;
  scene: string;
  photoSize: number;
  analysis: {
    age: string;
    appearance: string;
    pose: string;
    perspective: string;
    elements: string[];
    complexity: string;
    usingFallback: boolean;
  };
  promptSample: string;
  fileName: string;
  recordId: string;
  timing: number;
  costs: {
    vision: number;
    image: number;
    total: number;
  };
  tokens: {
    vision: { input: number; output: number };
    image: { input: number; output: number };
  };
}

export class ProgressiveLogger {
  public context: Partial<JobContext> = {};
  private startTime: number = 0;
  private stepTimes: { [key: string]: number } = {};
  private jobId: number;
  private userId?: string;
  private currentSpinner?: { text: string; succeed: (text: string) => void; fail: (text: string) => void };
  private visionSteps: string[] = [];
  private imageSteps: string[] = [];
  private storageSteps: string[] = [];

  constructor(userId?: string) {
    this.jobId = Math.floor(Math.random() * 9999) + 1000;
    this.userId = userId;
  }

  /**
   * Initialize job with basic parameters
   */
  startJob(params: {
    style: string;
    difficulty: number;
    scene: string;
    photoSize: number;
  }): void {
    this.startTime = Date.now();
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
    };

    this.stepTimes.upload = Date.now();
    this.stepTimes.vision = Date.now();

    // Output job header immediately
    const photoMB = (params.photoSize / 1024 / 1024).toFixed(2);
    const bar = '─'.repeat(42);
    
    console.log(`🖍️  Coloring‑page #${this.jobId}   ⏱ starting...`);
    console.log(bar);
    console.log(`📸  Photo       ${photoMB} MB          style=${params.style}  diff=${params.difficulty}`);

    // Start photo processing
    this.currentSpinner = ora({
      text: 'Processing uploaded photo...',
      color: 'cyan'
    }).start();
  }

  /**
   * Update vision analysis progress
   */
  updateVisionProgress(step: string, details?: string): void {
    this.visionSteps.push(`${step}${details ? ` (${details})` : ''}`);
    if (this.currentSpinner) {
      this.currentSpinner.text = `🔍 Vision Analysis: ${step}${details ? ` - ${details}` : ''}`;
    }
  }

  /**
   * Complete vision analysis step
   */
  addVisionData(params: {
    cost: CostCalculation;
    tokens: { input: number; output: number };
    analysis: {
      age: string;
      appearance: string;
      pose: string;
      perspective: string;
      elements: string[];
      complexity: string;
      usingFallback: boolean;
    };
  }): void {
    if (this.currentSpinner) {
      this.currentSpinner.succeed('Vision analysis complete');
    }

    this.context.costs!.vision = params.cost.totalCost;
    this.context.tokens!.vision = params.tokens;
    this.context.analysis = params.analysis;

    const visionDuration = (Date.now() - this.stepTimes.vision) / 1000;
    this.stepTimes.image = Date.now();

    // Output vision results
    const totalTokens = params.tokens.input + params.tokens.output;
    console.log(`🧠  gpt‑4o      ${totalTokens.toString().padStart(5)} tok   $${params.cost.totalCost.toFixed(4)}  ⏱ ${visionDuration.toFixed(1)}s`);
    console.log(`    👶 Child: ${params.analysis.age}, ${params.analysis.appearance}`);
    
    // Start image generation
    this.currentSpinner = ora({
      text: 'Preparing image generation prompt...',
      color: 'magenta'
    }).start();
  }

  /**
   * Update image generation progress
   */
  updateImageProgress(step: string, details?: string): void {
    this.imageSteps.push(`${step}${details ? ` (${details})` : ''}`);
    if (this.currentSpinner) {
      this.currentSpinner.text = `🎨 Image Generation: ${step}${details ? ` - ${details}` : ''}`;
    }
  }

  /**
   * Complete image generation step
   */
  addImageData(params: {
    cost: CostCalculation;
    tokens: { input: number; output: number };
    promptSample: string;
  }): void {
    if (this.currentSpinner) {
      this.currentSpinner.succeed('Image generation complete');
    }

    this.context.costs!.image = params.cost.totalCost;
    this.context.tokens!.image = params.tokens;
    this.context.promptSample = params.promptSample.slice(0, 120);

    const imageDuration = (Date.now() - this.stepTimes.image) / 1000;
    this.stepTimes.storage = Date.now();

    // Output image results
    console.log(`🎨  gpt‑img‑1   ${params.tokens.input.toString().padStart(5)} tok   $${params.cost.totalCost.toFixed(4)}  ⏱ ${imageDuration.toFixed(1)}s`);
    console.log(' '.repeat(31) + `└─ flat  $0.1700`);

    // Start storage
    this.currentSpinner = ora({
      text: 'Uploading image to storage...',
      color: 'green'
    }).start();
  }

  /**
   * Update storage progress
   */
  updateStorageProgress(step: string, details?: string): void {
    this.storageSteps.push(`${step}${details ? ` (${details})` : ''}`);
    if (this.currentSpinner) {
      this.currentSpinner.text = `💾 Storage: ${step}${details ? ` - ${details}` : ''}`;
    }
  }

  /**
   * Complete storage step
   */
  addStorageData(params: {
    fileName: string;
    recordId: string;
  }): void {
    if (this.currentSpinner) {
      this.currentSpinner.succeed('Storage and database complete');
    }

    this.context.fileName = params.fileName;
    this.context.recordId = params.recordId;

    const storageDuration = (Date.now() - this.stepTimes.storage) / 1000;

    // Output storage results
    const bar = '─'.repeat(42);
    console.log(bar);
    console.log(`💾  File        ${params.fileName}                   ⏱ ${storageDuration.toFixed(1)}s`);
    console.log(`🗄️  Record      ${params.recordId.slice(0, 8)}`);
  }

  /**
   * Complete job and output final summary
   */
  completeJob(): void {
    this.context.timing = Date.now() - this.startTime;
    this.context.costs!.total = this.context.costs!.vision + this.context.costs!.image;
    
    // Output final summary
    console.log(`💸  Cost total                        $${this.context.costs!.total.toFixed(4)}`);
    console.log(`✅  Done in ${(this.context.timing! / 1000).toFixed(1)} s`);
    
    // Output details section
    this.outputDetailsSection(this.context as JobContext);
    this.outputProgressDetails();
    
    // Send metrics to observability sink
    this.sendToObservabilitySink();
  }

  /**
   * Log error and stop any active spinner
   */
  logError(message: string, error?: unknown): void {
    if (this.currentSpinner) {
      this.currentSpinner.fail(`Job #${this.jobId} failed`);
    }

    const bar = '─'.repeat(42);
    console.error(`❌  Job #${this.jobId} failed`);
    console.error(bar);
    console.error(`    ${message}`);
    if (this.isDebug() && error) {
      console.error('    Error details:', error);
    }
    console.error(bar);

    // Send error to observability sink
    this.sendErrorToObservabilitySink(message, error);
  }

  /**
   * Output the details section
   */
  private outputDetailsSection(ctx: JobContext): void {
    const bar = '─'.repeat(42);
    
    console.log('╰─ ▶ details ' + '─'.repeat(39));
    console.log(`   • Scene…… "${ctx.scene}"`);
    console.log('   • Analysis');
    this.logField('age', ctx.analysis.age);
    this.logField('appearance', ctx.analysis.appearance);
    this.logField('pose', ctx.analysis.pose);
    this.logField('perspective', ctx.analysis.perspective);
    this.logField('elements', ctx.analysis.elements.join(', '));
    this.logField('complexity', `${ctx.analysis.complexity}   (${ctx.analysis.usingFallback ? 'fallback' : 'no fallback'})`);
    console.log('   • Prompt excerpt');
    console.log('       ' + ctx.promptSample.replace(/\n/g, ' '));
    console.log(bar);
  }

  /**
   * Output detailed progress steps
   */
  private outputProgressDetails(): void {
    if (this.isDebug()) {
      console.log('\n🔍 Progress Details:');
      
      if (this.visionSteps.length > 0) {
        console.log('   Vision Steps:');
        this.visionSteps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });
      }
      
      if (this.imageSteps.length > 0) {
        console.log('   Image Steps:');
        this.imageSteps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });
      }
      
      if (this.storageSteps.length > 0) {
        console.log('   Storage Steps:');
        this.storageSteps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step}`);
        });
      }
    }
  }

  /**
   * Helper for detail fields
   */
  private logField(label: string, value: string): void {
    const truncatedValue = value.length > 60 ? value.slice(0, 57) + '...' : value;
    console.log(`       ${label.padEnd(13, '…')} ${truncatedValue}`);
  }

  /**
   * Check if debug mode is enabled
   */
  private isDebug(): boolean {
    return process.env.LOG_LEVEL === 'debug';
  }

  /**
   * Debug logging for verbose mode
   */
  debug(message: string, data?: unknown): void {
    if (this.isDebug()) {
      console.debug(`🔍 DEBUG: ${message}`);
      if (data) {
        console.debug(JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Get current job ID
   */
  getJobId(): number {
    return this.jobId;
  }

  /**
   * Send error to observability sink
   */
  private async sendErrorToObservabilitySink(message: string, error?: unknown): Promise<void> {
    try {
      // Only send in production or when explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_OBSERVABILITY_LOGGING) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error || message);
      
      const logEntry = {
        user_id: this.userId,
        job_id: this.jobId.toString(),
        style: this.context.style || null,
        difficulty: this.context.difficulty || null,
        duration_ms: Date.now() - this.startTime,
        costs: {
          vision: this.context.costs?.vision || 0,
          image: this.context.costs?.image || 0,
          total: (this.context.costs?.vision || 0) + (this.context.costs?.image || 0)
        },
        tokens: {
          vision_input: this.context.tokens?.vision?.input || 0,
          vision_output: this.context.tokens?.vision?.output || 0,
          image_input: this.context.tokens?.image?.input || 0,
          image_output: this.context.tokens?.image?.output || 0
        },
        success: false,
        error_message: errorMessage
      };

      // Send to Supabase for business intelligence
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await this.sendToSupabase(logEntry);
      }

      // Optionally send to other observability platforms
      if (process.env.DATADOG_API_KEY) {
        await this.sendToDatadog(logEntry);
      }

    } catch (observabilityError) {
      console.warn('Failed to send error observability data:', observabilityError);
    }
  }

  /**
   * Send metrics to observability sink for business intelligence
   */
  private async sendToObservabilitySink(): Promise<void> {
    try {
      // Only send in production or when explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_OBSERVABILITY_LOGGING) {
        return;
      }

      const logEntry = {
        user_id: this.userId,
        job_id: this.jobId.toString(),
        style: this.context.style,
        difficulty: this.context.difficulty,
        duration_ms: this.context.timing,
        costs: {
          vision: this.context.costs?.vision || 0,
          image: this.context.costs?.image || 0,
          total: this.context.costs?.total || 0
        },
        tokens: {
          vision_input: this.context.tokens?.vision?.input || 0,
          vision_output: this.context.tokens?.vision?.output || 0,
          image_input: this.context.tokens?.image?.input || 0,
          image_output: this.context.tokens?.image?.output || 0
        },
        success: true,
        error_message: null
      };

      // Send to Supabase for business intelligence
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await this.sendToSupabase(logEntry);
      }

      // Optionally send to other observability platforms
      if (process.env.DATADOG_API_KEY) {
        await this.sendToDatadog(logEntry);
      }

    } catch (error) {
      // Don't fail the main request if observability fails
      console.warn('Failed to send observability data:', error);
    }
  }

  /**
   * Send metrics to Supabase generation_logs table
   */
  private async sendToSupabase(logEntry: any): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from('generation_logs')
        .insert([logEntry]);

      if (error) {
        console.warn('Failed to insert generation log:', error);
      }
    } catch (error) {
      console.warn('Supabase logging error:', error);
    }
  }

  /**
   * Send metrics to Datadog (optional)
   */
  private async sendToDatadog(logEntry: any): Promise<void> {
    try {
      // Example implementation for Datadog metrics
      const response = await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.DATADOG_API_KEY!
        },
        body: JSON.stringify({
          series: [
            {
              metric: 'coloring_book.generation.duration',
              points: [[Math.floor(Date.now() / 1000), logEntry.duration_ms]],
              tags: [`style:${logEntry.style}`, `difficulty:${logEntry.difficulty}`]
            },
            {
              metric: 'coloring_book.generation.cost',
              points: [[Math.floor(Date.now() / 1000), logEntry.costs.total]],
              tags: [`style:${logEntry.style}`, `difficulty:${logEntry.difficulty}`]
            }
          ]
        })
      });

      if (!response.ok) {
        console.warn('Datadog API error:', response.statusText);
      }
    } catch (error) {
      console.warn('Datadog logging error:', error);
    }
  }
}
