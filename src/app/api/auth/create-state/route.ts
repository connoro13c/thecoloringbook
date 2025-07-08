import { NextRequest, NextResponse } from 'next/server'
import { createAuthState } from '@/lib/auth-state'
import { z } from 'zod'

const createStateSchema = z.object({
  pageId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId } = createStateSchema.parse(body)
    
    const state = createAuthState(pageId)
    
    return NextResponse.json({ state })
  } catch (error) {
    console.error('Create auth state error:', error)
    return NextResponse.json(
      { error: 'Failed to create auth state' },
      { status: 500 }
    )
  }
}
