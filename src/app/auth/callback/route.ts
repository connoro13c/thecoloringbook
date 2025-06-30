import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if email is verified (required per spec)
      if (!user.email_confirmed_at) {
        console.log(`⏳ User ${user.email} signed up but email not yet verified`)
        return NextResponse.redirect(`${origin}?auth=pending-verification`)
      }

      // Check if this is a new user (first time signing up with verified email)
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single()

      // If no existing credits record, this is a new verified user
      if (!existingCredits) {
        try {
          // Grant 5 free credits for new users (per spec: after email verification)
          await supabase
            .from('user_credits')
            .insert({
              user_id: user.id,
              credits: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          console.log(`✅ Granted 5 free credits to verified new user: ${user.email}`)
        } catch (error) {
          console.error('Failed to grant free credits:', error)
        }
      }

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
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
