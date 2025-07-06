import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    console.log('Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test 1: List all buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError
      })
    }
    
    // Test 2: Check if pages bucket exists
    const pagesBucket = buckets?.find(bucket => bucket.name === 'pages')
    
    // Test 3: Try to list files in pages bucket (if it exists)
    let filesTest = null
    if (pagesBucket) {
      const { data: files, error: filesError } = await supabaseAdmin.storage
        .from('pages')
        .list()
      filesTest = { files, error: filesError }
    }
    
    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      pagesBucketExists: !!pagesBucket,
      pagesBucketPublic: pagesBucket?.public,
      filesTest
    })
    
  } catch (error) {
    console.error('Storage test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
