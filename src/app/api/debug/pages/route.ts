import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const serviceClient = createServiceClient()
    
    // Get all pages from the last week
    const { data: pages, error } = await serviceClient
      .from('pages')
      .select('id, user_id, created_at, prompt')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const summary = {
      total: pages.length,
      withUserId: pages.filter(p => p.user_id).length,
      pages: pages.map(p => ({
        id: p.id,
        user_id: p.user_id ? 'SET' : 'NULL',
        created_at: p.created_at,
        prompt: p.prompt?.substring(0, 50) + '...'
      }))
    }
    
    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}
