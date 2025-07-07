import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Handle OAuth flow with code parameter
  const code = req.nextUrl.searchParams.get('code')
  if (code) {
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

  // Handle magic link flow - redirect to login page to process tokens from URL fragment
  // Magic links contain tokens in the URL fragment (#access_token=...) which can't be read server-side
  // The login page will handle extracting these tokens client-side
  const pageId = req.nextUrl.searchParams.get('state') || ''
  const loginUrl = new URL('/login', req.url)
  if (pageId) {
    loginUrl.searchParams.set('page', pageId)
  }
  
  return NextResponse.redirect(loginUrl)
}
