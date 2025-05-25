import { NextRequest, NextResponse } from 'next/server';
import { processQueue, processSingleJob } from '@/lib/worker';

export async function POST(request: NextRequest) {
  try {
    // Check for admin/service authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WORKER_SECRET_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { jobId, action = 'process-queue' } = body;

    if (action === 'process-single' && jobId) {
      await processSingleJob(jobId);
      return NextResponse.json({ 
        success: true, 
        message: `Job ${jobId} processed` 
      });
    } else {
      await processQueue();
      return NextResponse.json({ 
        success: true, 
        message: 'Queue processed' 
      });
    }

  } catch (error) {
    console.error('Worker API error:', error);
    return NextResponse.json(
      { error: 'Worker processing failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    worker: 'ready'
  });
}