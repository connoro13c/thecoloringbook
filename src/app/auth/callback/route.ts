import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Exchange the OAuth code for a session and set cookies
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }
  
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
  }

  // Optional: pass pageId through the OAuth flow via 'state' parameter
  const pageId = req.nextUrl.searchParams.get('state') || ''
  
  // Redirect to success page with optional page ID
  const redirectUrl = new URL('/auth/success', req.url)
  if (pageId) {
    redirectUrl.searchParams.set('page', pageId)
  }
  
  return NextResponse.redirect(redirectUrl)
}
