import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { deleteTempSession } from '@/lib/storage'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    try {
      // Delete files from storage
      await deleteTempSession(sessionId)

      // Delete session record from database
      const { error: deleteError } = await supabase
        .from('page_sessions')
        .delete()
        .eq('id', sessionId)

      if (deleteError) {
        console.error('Failed to delete session record:', deleteError)
        // Don't fail the request since files are already deleted
      }

      return NextResponse.json({
        success: true,
        message: 'Session expired successfully'
      })

    } catch (error) {
      console.error('Failed to expire session:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to expire session'
      
      return NextResponse.json(
        { error: 'Failed to expire session', details: errorMessage },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Expire session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}