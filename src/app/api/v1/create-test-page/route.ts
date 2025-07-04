import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/server'
import { z } from 'zod'

const createTestPageSchema = z.object({
  prompt: z.string().min(1),
  style: z.string().min(1),
  difficulty: z.number().min(1).max(5)
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, difficulty } = createTestPageSchema.parse(await request.json())

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Create a test page record in database
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .insert({
        user_id: user.id,
        prompt,
        style,
        difficulty,
        jpg_path: 'test/placeholder.jpg', // Placeholder path
        pdf_path: null // Will be set after payment
      })
      .select()
      .single()

    if (pageError) {
      console.error('Database error:', pageError)
      return NextResponse.json({ error: 'Failed to create test page' }, { status: 500 })
    }

    return NextResponse.json({ 
      pageId: page.id,
      message: 'Test page created successfully' 
    })

  } catch (error) {
    console.error('Error creating test page:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
