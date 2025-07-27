import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { PhotoAnalysis } from '@/types'

export interface PageRecord {
  id: string
  user_id: string
  prompt: string
  style: string
  difficulty: number
  jpg_path?: string
  pdf_path?: string
  analysis_output?: PhotoAnalysis
  created_at: string
  updated_at: string
}

export interface CreatePageData {
  user_id: string
  prompt: string
  style: string
  difficulty: number
  jpg_path?: string
  pdf_path?: string
  analysis_output?: PhotoAnalysis
}

/**
 * Create a new page record with analysis output
 * Requires authenticated user
 */
export async function createPage(data: CreatePageData): Promise<PageRecord> {
  // Use regular client since user is authenticated
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .insert([data])
    .select()
    .single()

  if (error) {
    console.error('Failed to create page:', error)
    throw new Error('Failed to save page to database')
  }

  return page
}

/**
 * Get a page by ID
 */
export async function getPage(id: string): Promise<PageRecord | null> {
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Page not found
    }
    console.error('Failed to get page:', error)
    throw new Error('Failed to retrieve page')
  }

  return page
}

/**
 * Get all pages for a user
 */
export async function getUserPages(userId: string): Promise<PageRecord[]> {
  const supabase = await createClient()

  const { data: pages, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get user pages:', error)
    throw new Error('Failed to retrieve user pages')
  }

  return pages || []
}

/**
 * Update a page record (e.g., to add PDF path)
 */
export async function updatePage(id: string, updates: Partial<CreatePageData>): Promise<PageRecord> {
  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update page:', error)
    throw new Error('Failed to update page')
  }

  return page
}
