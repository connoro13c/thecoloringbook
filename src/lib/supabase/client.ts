import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export createClient function for consistent usage - returns singleton
export const createClient = () => supabase

export type Database = {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          user_id: string
          prompt: string
          style: string
          difficulty: number
          jpg_path: string | null
          pdf_path: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          style: string
          difficulty?: number
          jpg_path?: string | null
          pdf_path?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          style?: string
          difficulty?: number
          jpg_path?: string | null
          pdf_path?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          created_at?: string
          updated_at?: string
        }
      }
      donations: {
        Row: {
          id: string
          user_id: string | null
          stripe_payment_id: string | null
          amount_cents: number
          credits_granted: number
          stripe_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          stripe_payment_id?: string | null
          amount_cents: number
          credits_granted: number
          stripe_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          stripe_payment_id?: string | null
          amount_cents?: number
          credits_granted?: number
          stripe_status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
