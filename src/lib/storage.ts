import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { ProgressiveLogger } from './ai/progressive-logger'

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Single bucket name for unified storage
const BUCKET_NAME = 'pages'

export interface StorageResult {
  path: string
  publicUrl: string
}

// Whitelist of allowed content types for security
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
] as const

type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number]

/**
 * Validate that the content type is in our security whitelist
 */
function validateContentType(contentType: string): contentType is AllowedContentType {
  return ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)
}

/**
 * Upload directly to user folder (for authenticated users)
 */
export async function uploadUserImage(
  buffer: Buffer,
  userId: string,
  filename: string,
  contentType: string = 'image/jpeg',
  logger?: ProgressiveLogger
): Promise<StorageResult> {
  const path = `${userId}/${filename}`
  
  // Security: Validate content type against whitelist
  if (!validateContentType(contentType)) {
    throw new Error(`Invalid content type: ${contentType}. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`)
  }
  
  try {
    if (logger) {
      logger.updateStorageProgress('Uploading to user storage', `${Math.round(buffer.length / 1024)}KB`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false // Security: Prevent overwriting existing files
      })

    if (error) {
      console.error('❌ User storage upload failed:', error)
      throw new Error(`User storage upload failed: ${error.message}`)
    }

    if (logger) {
      logger.updateStorageProgress('Generating signed URL for user');
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    }
  } catch (error) {
    console.error('❌ User storage error:', error)
    throw new Error('Failed to save image to user storage')
  }
}

/**
 * Generate a secure filename with timestamp and UUID
 */
export function generateFilename(prefix: string = 'file'): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const uuid = uuidv4().slice(0, 8) // First 8 chars of UUID
  return `${prefix}-${timestamp}-${uuid}.png`
}

/**
 * Delete file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('❌ File deletion failed:', error)
      throw new Error(`File deletion failed: ${error.message}`)
    }
  } catch (error) {
    console.error('❌ Delete file error:', error)
    throw new Error('Failed to delete file')
  }
}

/**
 * Generate signed URL for private access (authenticated downloads)
 */
export async function generateSignedUrl(
  path: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('❌ Signed URL generation failed:', error)
      throw new Error(`Signed URL generation failed: ${error.message}`)
    }

    return data.signedUrl
  } catch (error) {
    console.error('❌ Generate signed URL error:', error)
    throw new Error('Failed to generate signed URL')
  }
}
