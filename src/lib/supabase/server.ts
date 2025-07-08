import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './client'
import { getRequiredEnv } from '../env-validation'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create a service role client that bypasses RLS
 * Use this for admin operations or anonymous user data
 */
export function createServiceClient() {
  const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL').trim()
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY').trim()
  
  // Basic validation that we have a properly formatted key
  if (!serviceRoleKey.startsWith('eyJ')) {
    throw new Error('Invalid service role key format')
  }
  
  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No cookies needed for service role
        },
      },
    }
  )
}
