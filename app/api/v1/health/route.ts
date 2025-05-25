import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth-server'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test database connection
    const dbStart = Date.now()
    const supabase = await createClient()
    await supabase.from('jobs').select('count').limit(1).single()
    const dbLatency = Date.now() - dbStart
    
    // Calculate total response time
    const responseTime = Date.now() - startTime
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'healthy',
          responseTime: dbLatency
        },
        api: {
          status: 'healthy',
          responseTime
        }
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development'
    }
    
    return NextResponse.json(health, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      responseTime: Date.now() - startTime
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}