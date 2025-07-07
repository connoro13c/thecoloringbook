import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test auth connection
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Test a simple Supabase API call to see exact error
    let apiTestError = null
    try {
      const { error: testError } = await supabase.auth.signInWithOtp({
        email: 'test@example.com',
        options: { shouldCreateUser: false } // Won't actually create user
      })
      apiTestError = testError?.message || null
    } catch (err) {
      apiTestError = err instanceof Error ? err.message : 'API test failed'
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKeyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...',
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
      authError: error?.message || null,
      apiTestError,
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
