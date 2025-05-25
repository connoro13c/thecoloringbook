'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface JobStatus {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  output_url?: string
  pdf_url?: string
  error_message?: string
  processing_time_ms?: number
  created_at: string
  updated_at: string
}

export function useJobStatus(jobId: string | null) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!jobId) {
      setLoading(false)
      return
    }

    let channel: RealtimeChannel

    const fetchInitialJob = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (error) {
          setError(error.message)
        } else {
          setJob(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job')
      } finally {
        setLoading(false)
      }
    }

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${jobId}`
          },
          (payload) => {
            console.log('Job update received:', payload.new)
            setJob(payload.new as JobStatus)
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status)
        })
    }

    // Fetch initial data and setup subscription
    fetchInitialJob()
    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [jobId, supabase])

  return { job, loading, error }
}

export function useQueueStatus(userId: string | null) {
  const [queueJobs, setQueueJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let channel: RealtimeChannel

    const fetchQueueJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('job_queue')
          .select(`
            *,
            jobs:job_id (
              id,
              prompt,
              style,
              difficulty,
              status,
              output_url,
              created_at
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Failed to fetch queue jobs:', error)
        } else {
          setQueueJobs(data || [])
        }
      } catch (err) {
        console.error('Queue fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    const setupQueueSubscription = () => {
      channel = supabase
        .channel(`queue-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_queue',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Queue update received:', payload)
            // Refetch queue jobs when changes occur
            fetchQueueJobs()
          }
        )
        .subscribe()
    }

    fetchQueueJobs()
    setupQueueSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  return { queueJobs, loading }
}