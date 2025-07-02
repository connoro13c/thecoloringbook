import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { associateFileWithUser } from '@/lib/storage'

// Request validation schema
const AssociateFileSchema = z.object({
  filePath: z.string().min(1, 'File path is required')
})

/**
 * Associate an anonymous file with an authenticated user
 * This moves the file from public/ folder to the user's folder
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json()
    const { filePath } = AssociateFileSchema.parse(body)

    // Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    // Validate file path is in public folder
    if (!filePath.startsWith('public/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file path - file must be in public folder' 
        },
        { status: 400 }
      )
    }

    // Move file to user folder
    const newPath = await associateFileWithUser(filePath, user.id)

    return NextResponse.json({ 
      success: true, 
      path: newPath.path,
      publicUrl: newPath.publicUrl
    })

  } catch (error) {
    console.error('❌ Associate file error:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    // Handle unexpected errors
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to associate file with user' 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'file-association',
    timestamp: new Date().toISOString()
  })
}
