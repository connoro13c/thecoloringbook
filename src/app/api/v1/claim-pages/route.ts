import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import path from 'path'

// Request validation schema
const ClaimPagesSchema = z.object({
  claims: z.array(
    z.object({
      pageId: z.string().uuid(),
      claimToken: z.string().uuid()
    })
  ).max(20) // Safety cap - prevent abuse
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Parse and validate request
    const body = await request.json()
    const { claims } = ClaimPagesSchema.parse(body)

    if (claims.length === 0) {
      return NextResponse.json({
        success: true,
        claimed: 0,
        failed: 0
      })
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceClient()
    
    let claimedCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const { pageId, claimToken } of claims) {
      try {
        // First, get the page to verify it exists and can be claimed
        const { data: page, error: fetchError } = await serviceClient
          .from('pages')
          .select('id, user_id, claim_token, jpg_path')
          .eq('id', pageId)
          .single()

        if (fetchError || !page) {
          console.log(`Page ${pageId} not found or error:`, fetchError)
          failedCount++
          errors.push(`Page ${pageId} not found`)
          continue
        }

        // Check if page is already claimed
        if (page.user_id) {
          console.log(`Page ${pageId} already claimed by user ${page.user_id}`)
          failedCount++
          errors.push(`Page ${pageId} already claimed`)
          continue
        }

        // Verify claim token matches
        if (page.claim_token !== claimToken) {
          console.log(`Invalid claim token for page ${pageId}`)
          failedCount++
          errors.push(`Invalid claim token for page ${pageId}`)
          continue
        }

        // Move file from public folder to user folder
        const fileName = path.basename(page.jpg_path)
        const newPath = `${user.id}/${fileName}`

        console.log(`Moving file from ${page.jpg_path} to ${newPath}`)
        
        const { error: moveError } = await serviceClient.storage
          .from('pages')
          .move(page.jpg_path, newPath)

        if (moveError) {
          console.error(`Failed to move file for page ${pageId}:`, moveError)
          failedCount++
          errors.push(`Failed to move file for page ${pageId}`)
          continue
        }

        // Update page record with new user_id, file path, and clear claim_token
        const { error: updateError } = await serviceClient
          .from('pages')
          .update({
            user_id: user.id,
            jpg_path: newPath,
            claim_token: null
          })
          .eq('id', pageId)

        if (updateError) {
          console.error(`Failed to update page ${pageId}:`, updateError)
          failedCount++
          errors.push(`Failed to update page ${pageId}`)
          continue
        }

        claimedCount++
        console.log(`Successfully claimed page ${pageId}`)

      } catch (error) {
        console.error(`Error processing claim for page ${pageId}:`, error)
        failedCount++
        errors.push(`Error processing page ${pageId}`)
      }
    }

    return NextResponse.json({
      success: true,
      claimed: claimedCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Claim pages error:', error)
    
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

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to claim pages' 
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'claim-pages',
    timestamp: new Date().toISOString()
  })
}
