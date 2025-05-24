import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client for server-side operations
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

// Client for authenticated user operations
export const createUserClient = (userToken: string) => {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  })
}

export const bucket = supabaseService.storage.from('uploads')

export interface UploadOptions {
  contentType: string
  cacheControl?: string
}

export class StorageService {
  static async upload(
    userId: string, 
    filename: string, 
    file: File | Buffer | Uint8Array, 
    options: UploadOptions
  ) {
    const path = `${userId}/${filename}`
    
    const { data, error } = await bucket.upload(path, file, {
      contentType: options.contentType,
      cacheControl: options.cacheControl || '3600'
    })
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    return {
      path: data.path,
      url: `${supabaseUrl}/storage/v1/object/public/uploads/${data.path}`
    }
  }
  
  static async download(path: string): Promise<Uint8Array> {
    const { data, error } = await bucket.download(path)
    
    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }
    
    return new Uint8Array(await data.arrayBuffer())
  }
  
  static async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await bucket.createSignedUrl(path, expiresIn)
    
    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  }
  
  static async delete(path: string): Promise<void> {
    const { error } = await bucket.remove([path])
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }
  
  static async deleteUserFiles(userId: string): Promise<void> {
    const { data: files, error: listError } = await bucket.list(userId)
    
    if (listError) {
      throw new Error(`Failed to list user files: ${listError.message}`)
    }
    
    if (files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`)
      const { error: deleteError } = await bucket.remove(filePaths)
      
      if (deleteError) {
        throw new Error(`Failed to delete user files: ${deleteError.message}`)
      }
    }
  }
}