import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limiter'

export async function GET(req: NextRequest) {
  // Apply rate limiting for auth endpoints
  const rateLimitResult = rateLimit(rateLimitConfigs.auth)(req)
  if (!rateLimitResult.success) {
    return NextResponse.redirect(new URL('/login?error=rate_limit', req.url))
  }
  
  const supabase = await createClient()

  // Handle OAuth flow with code parameter
  const code = req.nextUrl.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
    }

    // Handle signed state parameter securely
    const state = req.nextUrl.searchParams.get('state')
    const redirectUrl = new URL('/auth/success', req.url)
    
    if (state) {
      try {
        // Pass signed state to success page for verification
        redirectUrl.searchParams.set('state', state)
      } catch (error) {
        console.error('Invalid auth state in OAuth callback:', error)
        // Continue without page claiming if state is invalid
      }
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // Handle magic link flow - redirect to login page to process tokens from URL fragment
  // Magic links contain tokens in the URL fragment (#access_token=...) which can't be read server-side
  // The login page will handle extracting these tokens client-side
  const state = req.nextUrl.searchParams.get('state')
  const loginUrl = new URL('/login', req.url)
  if (state) {
    loginUrl.searchParams.set('state', state)
  }
  
  return NextResponse.redirect(loginUrl)
}
