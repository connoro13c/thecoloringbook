import { NextRequest, NextResponse } from 'next/server'
import { decodeAuthState } from '@/lib/auth-state'
import { z } from 'zod'

const decodeStateSchema = z.object({
  state: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { state } = decodeStateSchema.parse(body)
    
    const authState = decodeAuthState(state)
    
    return NextResponse.json({ authState })
  } catch (error) {
    console.error('Decode auth state error:', error)
    return NextResponse.json(
      { error: 'Invalid auth state' },
      { status: 400 }
    )
  }
}
