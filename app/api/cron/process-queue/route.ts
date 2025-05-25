import { NextRequest, NextResponse } from 'next/server';
import { processQueue } from '@/lib/worker';

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await processQueue();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: 'Queue processed successfully' 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}