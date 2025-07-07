import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'NEXT_PUBLIC_SUPABASE_URL not configured' 
      }, { status: 500 })
    }

    if (!supabaseAnonKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY not configured' 
      }, { status: 500 })
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured' 
      }, { status: 500 })
    }

    // Test database connection
    const supabase = await createClient()
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('pages')
      .select('count', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: `Database connection failed: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase configuration is valid',
      details: {
        supabaseUrl: supabaseUrl.substring(0, 30) + '...',
        anonKeyPresent: !!supabaseAnonKey,
        serviceKeyPresent: !!supabaseServiceKey,
        databaseConnected: true
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
