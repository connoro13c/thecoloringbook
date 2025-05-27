import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/session-manager';

/**
 * Cron job endpoint to cleanup expired anonymous data (30+ days old)
 * Should be called daily via cron service
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting cleanup of expired anonymous data...');
    const startTime = Date.now();
    
    const deletedCount = await cleanupExpiredSessions();
    const duration = Date.now() - startTime;
    
    console.log(`Cleanup completed: ${deletedCount} expired sessions deleted in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      deletedCount,
      durationMs: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cleanup job failed:', error);
    return NextResponse.json(
      { 
        error: 'Cleanup failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    description: 'Cleanup cron job endpoint',
    lastRun: 'Call POST to execute cleanup'
  });
}