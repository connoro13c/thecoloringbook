import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received:', { code: !!code, origin, searchParams: Object.fromEntries(searchParams) })

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange code result:', { user: !!user, error })
    
    if (!error && user) {
      // Check if email is verified (required per spec)
      if (!user.email_confirmed_at) {
        console.log(`⏳ User ${user.email} signed up but email not yet verified`)
        return NextResponse.redirect(`${origin}?auth=pending-verification`)
      }

      // Credits are automatically granted by the grant_initial_credits() trigger
      // when email_confirmed_at is set during OAuth flow
      console.log(`✅ User ${user.email} authenticated successfully`)

      // TODO: Handle image migration from temp storage to user storage
      // This would involve checking for any temp images and moving them to user's permanent storage
      
      // For returning users, redirect to dashboard
      // For now, redirect to home page with success parameter
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}?auth=success`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}?auth=success`)
      } else {
        return NextResponse.redirect(`${origin}${next}?auth=success`)
      }
    }
  }

  // Return the user to an error page with instructions
  console.log('Auth callback failed - no code or exchange failed')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
