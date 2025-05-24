import { z } from 'zod'

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAID'
export type Style = 'CLASSIC' | 'MANGA' | 'BOLD'

export interface Job {
  id: string
  prompt: string
  style: Style
  difficulty: number
  status: JobStatus
  inputUrl?: string
  outputUrl?: string
  pdfUrl?: string
  errorMessage?: string
  processingTimeMs?: number
  createdAt: string
  updatedAt: string
}

export interface JobsResponse {
  jobs: Job[]
  total: number
  limit: number
  offset: number
}

const API_BASE = '/api/v1'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Generate coloring page
  async generateColoringPage(data: {
    prompt: string
    style: Style
    difficulty: number
    inputUrl?: string
  }): Promise<{
    jobId: string
    status: JobStatus
    outputUrl?: string
    processingTimeMs?: number
  }> {
    return apiRequest('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Get job by ID
  async getJob(jobId: string): Promise<Job> {
    return apiRequest(`/jobs/${jobId}`)
  },

  // Get user jobs
  async getJobs(options: {
    limit?: number
    offset?: number
    status?: JobStatus
  } = {}): Promise<JobsResponse> {
    const params = new URLSearchParams()
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.offset) params.set('offset', options.offset.toString())
    if (options.status) params.set('status', options.status)

    const query = params.toString() ? `?${params.toString()}` : ''
    return apiRequest(`/jobs${query}`)
  },

  // Create Stripe checkout session
  async createCheckoutSession(data: {
    jobId: string
    successUrl?: string
    cancelUrl?: string
  }): Promise<{
    sessionId: string
    url: string
  }> {
    return apiRequest('/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Generate PDF
  async makePdf(jobId: string): Promise<{
    pdfUrl: string
    jobId: string
  }> {
    return apiRequest('/make-pdf', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    })
  },
}