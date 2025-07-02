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

/**
 * Upload file for anonymous users to public folder
 */
export async function uploadAnonymousFile(
  file: File,
  logger?: ProgressiveLogger
): Promise<StorageResult> {
  try {
    const fileName = `${uuidv4()}-${file.name}`
    const filePath = `public/${fileName}`
    
    if (logger) {
      logger.updateStorageProgress('Uploading to public storage', `${Math.round(file.size / 1024)}KB`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Anonymous storage upload failed:', error)
      throw new Error(`Anonymous storage upload failed: ${error.message}`)
    }

    if (logger) {
      logger.updateStorageProgress('Generating public URL');
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
    console.error('❌ Anonymous storage error:', error)
    throw new Error('Failed to save file to storage')
  }
}

/**
 * Move file from public folder to user folder
 */
export async function associateFileWithUser(
  filePath: string, 
  userId: string,
  logger?: ProgressiveLogger
): Promise<StorageResult> {
  try {
    const newPath = filePath.replace('public/', `${userId}/`)
    
    if (logger) {
      logger.updateStorageProgress('Moving file to user folder');
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .move(filePath, newPath)

    if (error) {
      console.error('❌ File association failed:', error)
      throw new Error(`File association failed: ${error.message}`)
    }

    if (logger) {
      logger.updateStorageProgress('Generating signed URL for user');
    }

    // Get public URL for the new path (use newPath since move operation may not return path)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newPath)

    return {
      path: newPath,
      publicUrl: publicUrlData.publicUrl
    }
  } catch (error) {
    console.error('❌ File association error:', error)
    throw new Error('Failed to associate file with user')
  }
}

/**
 * Legacy function - Upload to storage (updated for single bucket)
 * @deprecated Use uploadAnonymousFile for new anonymous uploads
 */
export async function uploadToStorage(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/jpeg',
  logger?: ProgressiveLogger
): Promise<StorageResult> {
  try {
    // For backward compatibility, upload to public folder if no folder specified
    const filePath = path.includes('/') ? path : `public/${path}`
    
    if (logger) {
      logger.updateStorageProgress('Uploading to unified storage', `${Math.round(buffer.length / 1024)}KB`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload failed:', error)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    if (logger) {
      logger.updateStorageProgress('Generating public URL');
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
    console.error('❌ Storage error:', error)
    throw new Error('Failed to save image to storage')
  }
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
  
  try {
    if (logger) {
      logger.updateStorageProgress('Uploading to user storage', `${Math.round(buffer.length / 1024)}KB`);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
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
    throw new Error('Failed to save user image to storage')
  }
}

export function generateFilename(prefix: string = 'coloring'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}-${timestamp}-${random}.jpg`
}
