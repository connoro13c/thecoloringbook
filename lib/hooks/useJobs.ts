'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Job, type JobStatus, type Style } from '@/lib/api'

export function useJobs(options: {
  limit?: number
  offset?: number
  status?: JobStatus
} = {}) {
  return useQuery({
    queryKey: ['jobs', options],
    queryFn: () => api.getJobs(options),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.getJob(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      // Auto-refresh if job is still processing
      const data = query.state.data
      if (data?.status === 'PENDING' || data?.status === 'PROCESSING') {
        return 2000 // 2 seconds
      }
      return false
    },
  })
}

export function useGenerateColoringPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.generateColoringPage,
    onSuccess: (data) => {
      // Invalidate jobs list to show new job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      
      // Set initial job data in cache
      queryClient.setQueryData(['job', data.jobId], {
        id: data.jobId,
        status: data.status,
        outputUrl: data.outputUrl,
      })
    },
  })
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: api.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url
    },
  })
}

export function useMakePdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.makePdf,
    onSuccess: (data, jobId) => {
      // Update job in cache with PDF URL
      queryClient.setQueryData(['job', jobId], (old: Job | undefined) => {
        if (old) {
          return { ...old, pdfUrl: data.pdfUrl }
        }
        return old
      })
      
      // Invalidate jobs list to update PDF status
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}