import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const LongTaskSchema = z.object({
  duration: z.number().min(50), // Long tasks are >= 50ms
  startTime: z.number(),
  url: z.string().url(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const longTask = LongTaskSchema.parse(body);
    
    // Log long task (in production, send to monitoring service)
    console.warn('Long task detected:', {
      duration: Math.round(longTask.duration),
      url: longTask.url,
      timestamp: new Date(longTask.timestamp).toISOString(),
    });
    
    // In production:
    // 1. Store in monitoring database
    // 2. Track patterns and frequency
    // 3. Alert if too many long tasks detected
    // 4. Analyze for performance optimization opportunities
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Failed to process long task data:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid long task data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}