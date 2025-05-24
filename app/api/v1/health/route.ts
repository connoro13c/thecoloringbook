import { NextResponse } from 'next/server'
import IORedis from 'ioredis'

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test Redis connection
    const redisStart = Date.now()
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    await redis.ping()
    const redisLatency = Date.now() - redisStart
    await redis.disconnect()
    
    // Calculate total response time
    const responseTime = Date.now() - startTime
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: {
          status: 'healthy',
          responseTime: redisLatency
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