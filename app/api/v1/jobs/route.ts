import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Get jobs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      prompt: job.prompt,
      style: job.style,
      difficulty: job.difficulty,
      status: job.status,
      inputUrl: job.input_url,
      outputUrl: job.output_url,
      pdfUrl: job.pdf_url,
      errorMessage: job.error_message,
      processingTimeMs: job.processing_time_ms,
      createdAt: job.created_at,
      updatedAt: job.updated_at
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      total: count,
      limit,
      offset
    })

  } catch (error) {
    console.error('Get jobs API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}