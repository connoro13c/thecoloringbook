import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
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
    })

  } catch (error) {
    console.error('Get job API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}