import { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// In production, use Redis or similar persistent storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

export interface RateLimitResult {
  success: boolean;
  remainingRequests: number;
  resetTime: number;
  error?: string;
}

export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): RateLimitResult => {
    const key = config.keyGenerator?.(req) || getClientKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now);
    
    const record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      // First request or window expired
      const resetTime = now + config.windowMs;
      rateLimitMap.set(key, { count: 1, resetTime });
      
      return {
        success: true,
        remainingRequests: config.maxRequests - 1,
        resetTime,
      };
    }
    
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remainingRequests: 0,
        resetTime: record.resetTime,
        error: 'Rate limit exceeded',
      };
    }
    
    // Increment count
    record.count++;
    rateLimitMap.set(key, record);
    
    return {
      success: true,
      remainingRequests: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  };
}

function getClientKey(req: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // For authenticated users, use user ID if available
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  return `ip:${ip}`;
}

function cleanupExpiredEntries(now: number) {
  // Clean up expired entries to prevent memory leaks
  const entries = Array.from(rateLimitMap.entries());
  for (const [key, record] of entries) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // AI generation endpoints - more restrictive
  aiGeneration: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Authentication endpoints - moderate
  auth: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // General API endpoints - less restrictive
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // File upload endpoints - moderate
  upload: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
