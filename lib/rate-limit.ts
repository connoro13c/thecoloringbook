import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  total: number
}

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (from proxy/CDN)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  // Check for real IP (some proxies use this)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Check for client IP (some CDNs use this)
  const clientIP = request.headers.get('x-client-ip')
  if (clientIP) {
    return clientIP
  }
  
  // Fallback to connection remote address
  return request.ip || '127.0.0.1'
}

// Rate limiting for anonymous users
export async function checkAnonymousRateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000 // 1 hour
  }
): Promise<RateLimitResult> {
  const clientIP = getClientIP(request)
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)
  
  try {
    // Count requests from this IP in the current window
    const { count, error } = await supabase
      .from('page_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', windowStart.toISOString())
      .eq('client_ip', clientIP)

    if (error) {
      console.error('Rate limit check failed:', error)
      // Allow request if we can't check rate limit
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs),
        total: config.maxRequests
      }
    }

    const requestCount = count || 0
    const remaining = Math.max(0, config.maxRequests - requestCount)
    const allowed = requestCount < config.maxRequests

    return {
      allowed,
      remaining: allowed ? remaining - 1 : 0, // Subtract 1 for the current request
      resetTime: new Date(now.getTime() + config.windowMs),
      total: config.maxRequests
    }

  } catch (error) {
    console.error('Rate limit error:', error)
    // Allow request if rate limit check fails
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now.getTime() + config.windowMs),
      total: config.maxRequests
    }
  }
}

// Record a request for rate limiting
export async function recordAnonymousRequest(
  request: NextRequest,
  sessionId: string
): Promise<void> {
  const clientIP = getClientIP(request)
  
  try {
    // Update the session record with the client IP
    await supabase
      .from('page_sessions')
      .update({ client_ip: clientIP })
      .eq('id', sessionId)

  } catch (error) {
    console.error('Failed to record request for rate limiting:', error)
  }
}

// Rate limiting middleware headers
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
  }
}