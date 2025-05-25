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

// Storage buckets for different use cases
export const tempPagesBucket = supabaseService.storage.from('temp-pages')  // Public, 2-min TTL
export const userPagesBucket = supabaseService.storage.from('user-pages')  // Private, permanent

// Legacy bucket for backwards compatibility
export const bucket = supabaseService.storage.from('uploads')

export interface UploadOptions {
  contentType: string
  cacheControl?: string
}

// Anonymous storage functions (temp bucket)
export async function uploadTempPage(
  sessionId: string,
  filename: string,
  file: File | Buffer | Uint8Array,
  options: UploadOptions
) {
  const path = `${sessionId}/${filename}`
  
  const { data, error } = await tempPagesBucket.upload(path, file, {
    contentType: options.contentType,
    cacheControl: options.cacheControl || 'max-age=120' // 2 minutes
  })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  return {
    path: data.path,
    url: `${supabaseUrl}/storage/v1/object/public/temp-pages/${data.path}`
  }
}

// Authenticated user storage functions (permanent bucket)
export async function uploadUserPage(
  userId: string,
  filename: string,
  file: File | Buffer | Uint8Array,
  options: UploadOptions
) {
  const path = `${userId}/${filename}`
  
  const { data, error } = await userPagesBucket.upload(path, file, {
    contentType: options.contentType,
    cacheControl: options.cacheControl || '3600'
  })
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  return {
    path: data.path,
    signedUrl: await getUserPageSignedUrl(data.path)
  }
}

export async function getUserPageSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await userPagesBucket.createSignedUrl(path, expiresIn)
  
  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }
  
  return data.signedUrl
}

export async function deleteTempSession(sessionId: string): Promise<void> {
  const { data: files, error: listError } = await tempPagesBucket.list(sessionId)
  
  if (listError) {
    throw new Error(`Failed to list session files: ${listError.message}`)
  }
  
  if (files.length > 0) {
    const filePaths = files.map(file => `${sessionId}/${file.name}`)
    const { error: deleteError } = await tempPagesBucket.remove(filePaths)
    
    if (deleteError) {
      throw new Error(`Failed to delete session files: ${deleteError.message}`)
    }
  }
}

export async function deleteUserPage(userId: string, filename: string): Promise<void> {
  const path = `${userId}/${filename}`
  const { error } = await userPagesBucket.remove([path])
  
  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export async function deleteAllUserPages(userId: string): Promise<void> {
  const { data: files, error: listError } = await userPagesBucket.list(userId)
  
  if (listError) {
    throw new Error(`Failed to list user files: ${listError.message}`)
  }
  
  if (files.length > 0) {
    const filePaths = files.map(file => `${userId}/${file.name}`)
    const { error: deleteError } = await userPagesBucket.remove(filePaths)
    
    if (deleteError) {
      throw new Error(`Failed to delete user files: ${deleteError.message}`)
    }
  }
}

// Legacy StorageService for backwards compatibility
export const StorageService = {
  async upload(
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
  },
  
  async download(path: string): Promise<Uint8Array> {
    const { data, error } = await bucket.download(path)
    
    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }
    
    return new Uint8Array(await data.arrayBuffer())
  },
  
  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await bucket.createSignedUrl(path, expiresIn)
    
    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`)
    }
    
    return data.signedUrl
  },
  
  async delete(path: string): Promise<void> {
    const { error } = await bucket.remove([path])
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  },
  
  async deleteUserFiles(userId: string): Promise<void> {
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