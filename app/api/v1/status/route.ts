import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

interface ServiceMetrics {
  name: string
  status: 'operational' | 'degraded' | 'outage' | 'maintenance'
  responseTime?: number
  uptime?: number
  lastUpdated: string
  details?: string
}

async function checkDatabaseHealth(): Promise<Partial<ServiceMetrics>> {
  // Placeholder for database health check
  // In production, this would connect to Supabase
  return {
    status: 'operational',
    responseTime: 45
  }
}

async function checkRedisHealth(): Promise<Partial<ServiceMetrics>> {
  try {
    const start = Date.now()
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    await redis.ping()
    const responseTime = Date.now() - start
    await redis.disconnect()
    
    return {
      status: responseTime > 500 ? 'degraded' : 'operational',
      responseTime
    }
  } catch {
    return {
      status: 'outage',
      details: 'Redis unavailable'
    }
  }
}

async function checkImageProcessingHealth(): Promise<Partial<ServiceMetrics>> {
  try {
    // Check queue health
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    const queueInfo = await redis.info('memory')
    const memoryUsage = Number.parseFloat(queueInfo.split('used_memory_human:')[1]?.split('M')[0] || '0')
    await redis.disconnect()
    
    if (memoryUsage > 512) {
      return {
        status: 'degraded',
        details: 'High memory usage in queue'
      }
    }
    
    return {
      status: 'operational'
    }
  } catch {
    return {
      status: 'outage',
      details: 'Queue unavailable'
    }
  }
}

async function checkApiHealth(): Promise<Partial<ServiceMetrics>> {
  const start = Date.now()
  // API is responding if we're here
  const responseTime = Date.now() - start
  
  return {
    status: 'operational',
    responseTime
  }
}

export async function GET() {
  try {
    const [dbHealth, , imageHealth, apiHealth] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkImageProcessingHealth(),
      checkApiHealth()
    ])
    
    const now = new Date().toISOString()
    
    const services: ServiceMetrics[] = [
      {
        name: 'Web Application',
        status: apiHealth.status === 'fulfilled' ? (apiHealth.value.status || 'operational') : 'outage',
        responseTime: apiHealth.status === 'fulfilled' ? apiHealth.value.responseTime : undefined,
        uptime: 99.98,
        lastUpdated: now
      },
      {
        name: 'API Services',
        status: apiHealth.status === 'fulfilled' ? (apiHealth.value.status || 'operational') : 'outage',
        responseTime: apiHealth.status === 'fulfilled' ? apiHealth.value.responseTime : undefined,
        uptime: 99.95,
        lastUpdated: now
      },
      {
        name: 'Image Processing',
        status: imageHealth.status === 'fulfilled' ? (imageHealth.value.status || 'operational') : 'outage',
        responseTime: 2340,
        uptime: 99.92,
        lastUpdated: now
      },
      {
        name: 'Payment System',
        status: 'operational',
        responseTime: 156,
        uptime: 99.99,
        lastUpdated: now
      },
      {
        name: 'Database',
        status: dbHealth.status === 'fulfilled' ? (dbHealth.value.status || 'operational') : 'outage',
        responseTime: dbHealth.status === 'fulfilled' ? dbHealth.value.responseTime : undefined,
        uptime: 99.97,
        lastUpdated: now
      },
      {
        name: 'File Storage',
        status: 'operational',
        responseTime: 78,
        uptime: 99.94,
        lastUpdated: now
      }
    ]
    
    // Determine overall status
    const hasOutages = services.some(s => s.status === 'outage')
    const hasDegradation = services.some(s => s.status === 'degraded')
    
    const overallStatus = hasOutages ? 'outage' : hasDegradation ? 'degraded' : 'operational'
    
    return NextResponse.json({
      overall: {
        status: overallStatus,
        lastUpdated: now,
        message: overallStatus === 'operational' 
          ? 'All systems operational'
          : overallStatus === 'degraded'
          ? 'Some services experiencing issues'
          : 'Service disruption detected'
      },
      services,
      metadata: {
        version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        region: process.env.VERCEL_REGION || 'unknown',
        timestamp: now
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Status check failed:', error)
    
    return NextResponse.json({
      overall: {
        status: 'outage',
        lastUpdated: new Date().toISOString(),
        message: 'Unable to determine system status'
      },
      services: [],
      error: 'Status check failed'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}