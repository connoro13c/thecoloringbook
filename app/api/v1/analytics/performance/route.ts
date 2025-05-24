import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PerformanceMetricsSchema = z.object({
  // Core Web Vitals
  lcp: z.number().optional(),
  fid: z.number().optional(),
  cls: z.number().optional(),
  fcp: z.number().optional(),
  ttfb: z.number().optional(),
  
  // Custom metrics
  pageLoadTime: z.number(),
  domContentLoaded: z.number(),
  timeToInteractive: z.number().optional(),
  
  // Resource metrics
  jsSize: z.number(),
  cssSize: z.number(),
  imageSize: z.number(),
  totalSize: z.number(),
  
  // Context
  url: z.string().url(),
  userAgent: z.string(),
  connectionType: z.string().optional(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metrics = PerformanceMetricsSchema.parse(body);
    
    // Log performance metrics (in production, send to monitoring service)
    console.log('Performance metrics received:', {
      url: metrics.url,
      pageLoadTime: metrics.pageLoadTime,
      jsSize: Math.round(metrics.jsSize / 1024),
      totalSize: Math.round(metrics.totalSize / 1024),
      lcp: metrics.lcp,
      cls: metrics.cls,
      timestamp: new Date(metrics.timestamp).toISOString(),
    });
    
    // In production, you would:
    // 1. Store in analytics database
    // 2. Send to monitoring service (DataDog, New Relic, etc.)
    // 3. Check against performance budgets
    // 4. Trigger alerts if thresholds exceeded
    
    // Example: Check performance budgets
    const alerts = [];
    
    if (metrics.jsSize > 200 * 1024) {
      alerts.push('JS bundle size exceeds 200KB budget');
    }
    
    if (metrics.pageLoadTime > 3000) {
      alerts.push('Page load time exceeds 3s budget');
    }
    
    if (metrics.lcp && metrics.lcp > 2500) {
      alerts.push('LCP exceeds 2.5s threshold');
    }
    
    if (alerts.length > 0) {
      console.warn('Performance budget violations:', alerts);
    }
    
    return NextResponse.json({ success: true, alerts });
    
  } catch (error) {
    console.error('Failed to process performance metrics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid metrics data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}