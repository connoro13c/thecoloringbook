import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get queue status for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('job_queue')
      .select(`
        *,
        jobs:job_id (
          id,
          prompt,
          style,
          difficulty,
          status,
          output_url,
          pdf_url,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: queueJobs, error, count } = await query;

    if (error) {
      console.error('Get queue jobs error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue jobs' },
        { status: 500 }
      );
    }

    // Get queue statistics
    const { data: stats } = await supabase
      .from('job_queue')
      .select('status')
      .eq('user_id', userId);

    const statistics = {
      total: stats?.length || 0,
      pending: stats?.filter(j => j.status === 'pending').length || 0,
      processing: stats?.filter(j => j.status === 'processing').length || 0,
      completed: stats?.filter(j => j.status === 'completed').length || 0,
      failed: stats?.filter(j => j.status === 'failed').length || 0,
      retrying: stats?.filter(j => j.status === 'retrying').length || 0
    };

    return NextResponse.json({
      queueJobs: queueJobs || [],
      statistics,
      pagination: {
        total: count,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Retry a failed job
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;
    const userId = user.id;

    const body = await request.json();
    const { queueJobId, action } = body;

    if (action === 'retry' && queueJobId) {
      // Reset a failed job back to pending
      const { error } = await supabase
        .from('job_queue')
        .update({
          status: 'pending',
          retry_count: 0,
          error_message: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', queueJobId)
        .eq('user_id', userId) // Ensure user can only retry their own jobs
        .in('status', ['failed', 'retrying']);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to retry job' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Job has been reset and will be retried'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Queue retry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}