import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth-server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getUserPageSignedUrl } from '@/lib/storage'

const supabase = createSupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const userId = user.id

    // Get pagination parameters
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Fetch user's pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (pagesError) {
      console.error('Failed to fetch pages:', pagesError)
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Failed to count pages:', countError)
    }

    // Generate signed URLs for images
    const pagesWithUrls = await Promise.all(
      pages.map(async (page) => {
        let imageUrl = null
        
        try {
          if (page.jpg_path) {
            imageUrl = await getUserPageSignedUrl(page.jpg_path, 3600) // 1 hour
          }
        } catch (error) {
          console.error(`Failed to get signed URL for page ${page.id}:`, error)
        }

        return {
          id: page.id,
          prompt: page.prompt,
          style: page.style,
          imageUrl,
          paid: page.paid,
          hasPdf: !!page.pdf_path,
          createdAt: page.created_at
        }
      })
    )

    return NextResponse.json({
      pages: pagesWithUrls,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('My pages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}