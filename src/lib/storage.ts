import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface StorageResult {
  path: string
  publicUrl: string
}

export async function uploadToStorage(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<StorageResult> {
  try {
    console.log('📤 Uploading to Supabase Storage:', path)

    const { data, error } = await supabaseAdmin.storage
      .from('temp-pages')
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload failed:', error)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    console.log('✅ Upload successful:', data.path)

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('temp-pages')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  } catch (error) {
    console.error('❌ Storage error:', error)
    throw new Error('Failed to save image to storage')
  }
}

export async function uploadUserImage(
  buffer: Buffer,
  userId: string,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<StorageResult> {
  const path = `${userId}/${filename}`
  
  try {
    console.log('📤 Uploading user image to Supabase Storage:', path)

    const { data, error } = await supabaseAdmin.storage
      .from('user-pages')
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ User storage upload failed:', error)
      throw new Error(`User storage upload failed: ${error.message}`)
    }

    console.log('✅ User upload successful:', data.path)

    // Get public URL (signed for private bucket)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('user-pages')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  } catch (error) {
    console.error('❌ User storage error:', error)
    throw new Error('Failed to save user image to storage')
  }
}

export function generateFilename(prefix: string = 'coloring'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}-${timestamp}-${random}.jpg`
}
