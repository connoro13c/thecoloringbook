import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user already has credits record
    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingCredits) {
      return NextResponse.json({ message: 'Credits already initialized' })
    }

    // Create initial credits record (5 free credits)
    const { data, error } = await supabase
      .from('user_credits')
      .insert({
        user_id: user.id,
        credits: 5
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create initial credits:', error)
      return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 })
    }

    console.log(`✅ Initialized 5 credits for user ${user.email}`)
    return NextResponse.json({ 
      message: 'Credits initialized successfully',
      credits: 5 
    })

  } catch (error) {
    console.error('Error initializing credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
