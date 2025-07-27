import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  gitSha?: string
  checks: HealthCheck[]
  uptime: number
}

/**
 * Comprehensive health check endpoint for monitoring
 * Requires authentication to access
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const checks: HealthCheck[] = []
    
    // 1. Supabase Database Connectivity
    const dbCheck = await checkDatabase()
    checks.push(dbCheck)
    
    // 2. Supabase Storage Connectivity  
    const storageCheck = await checkStorage()
    checks.push(storageCheck)
    
    // 3. OpenAI API Connectivity
    const openaiCheck = await checkOpenAI()
    checks.push(openaiCheck)
    
    // 4. Environment Configuration
    const configCheck = checkConfiguration()
    checks.push(configCheck)
    
    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy')
    const hasDegraded = checks.some(check => check.status === 'degraded')
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    }
    
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8),
      checks,
      uptime: process.uptime()
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503
    return NextResponse.json(response, { status: statusCode })
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, { status: 503 })
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const serviceClient = createServiceClient()
    
    // Simple query to test connectivity
    const { error } = await serviceClient
      .from('pages')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }
    
    return {
      service: 'database',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test storage by listing buckets
    const { error } = await supabaseAdmin.storage.listBuckets()
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      return {
        service: 'storage',
        status: 'unhealthy',
        responseTime,
        error: error.message
      }
    }
    
    return {
      service: 'storage',
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    return {
      service: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function checkOpenAI(): Promise<HealthCheck> {
  const startTime = Date.now()
  
  try {
    const { getOpenAI } = await import('@/lib/openai')
    const openai = getOpenAI()
    
    // Test with a minimal request to check quota/connectivity
    const response = await openai.models.list()
    
    const responseTime = Date.now() - startTime
    
    if (!response.data || response.data.length === 0) {
      return {
        service: 'openai',
        status: 'unhealthy',
        responseTime,
        error: 'No models available'
      }
    }
    
    return {
      service: 'openai',
      status: responseTime > 3000 ? 'degraded' : 'healthy',
      responseTime
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    let status: 'unhealthy' | 'degraded' = 'unhealthy'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a quota/rate limit issue (degraded) vs connectivity (unhealthy)
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      status = 'degraded'
    }
    
    return {
      service: 'openai',
      status,
      responseTime,
      error: errorMessage
    }
  }
}

function checkConfiguration(): HealthCheck {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ]
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    return {
      service: 'configuration',
      status: 'unhealthy',
      error: `Missing environment variables: ${missing.join(', ')}`
    }
  }
  
  return {
    service: 'configuration',
    status: 'healthy'
  }
}
