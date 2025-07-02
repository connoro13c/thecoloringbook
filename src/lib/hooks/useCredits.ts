'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCredits() {
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch credits
  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error
      }

      setCredits(data?.credits || 0)
      setError(null)
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch credits')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Use credits
  const useCredits = async (amount: number): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('use_credits', {
        user_uuid: user.id,
        credit_count: amount
      })

      if (error) throw error

      if (data) {
        // Refresh credits after successful use
        await fetchCredits()
        return true
      }
      
      return false
    } catch (err) {
      console.error('Error using credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to use credits')
      return false
    }
  }

  // Subscribe to real-time credit updates
  useEffect(() => {
    if (!user) return

    fetchCredits()

    // Set up real-time subscription
    const channel = supabase
      .channel('user_credits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && 'credits' in payload.new) {
            setCredits(payload.new.credits as number)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, fetchCredits])

  return {
    credits,
    loading,
    error,
    fetchCredits,
    useCredits,
    hasCredits: credits > 0
  }
}
