'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JobStatus } from '@/components/ui/JobProgress';

interface UseJobPollingOptions {
  jobId: string | null;
  interval?: number; // milliseconds
  maxAttempts?: number;
  onComplete?: (job: JobStatus) => void;
  onError?: (error: string) => void;
}

export function useJobPolling({
  jobId,
  interval = 2000,
  maxAttempts = 150, // 5 minutes max polling
  onComplete,
  onError,
}: UseJobPollingOptions) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const attemptsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobStatus = useCallback(async (currentJobId: string): Promise<JobStatus | null> => {
    try {
      const response = await fetch(`/api/v1/job/${currentJobId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        throw new Error(`Failed to fetch job status: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch job status');
      }

      // Convert date strings back to Date objects
      const jobStatus: JobStatus = {
        ...data.job,
        createdAt: new Date(data.job.createdAt),
        completedAt: data.job.completedAt ? new Date(data.job.completedAt) : undefined,
      };

      return jobStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Job status fetch error:', errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(async (currentJobId: string) => {
    if (isPolling || !currentJobId) return;

    setIsPolling(true);
    setError(null);
    attemptsRef.current = 0;

    // Initial fetch
    try {
      const initialJob = await fetchJobStatus(currentJobId);
      if (initialJob) {
        setJob(initialJob);
        
        // Check if job is already complete
        if (initialJob.status === 'completed' || initialJob.status === 'failed') {
          if (initialJob.status === 'completed' && onComplete) {
            onComplete(initialJob);
          }
          if (initialJob.status === 'failed' && onError) {
            onError(initialJob.error || 'Job failed');
          }
          stopPolling();
          return;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      stopPolling();
      return;
    }

    // Start polling
    intervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      // Check max attempts
      if (attemptsRef.current >= maxAttempts) {
        const timeoutError = 'Job polling timed out';
        setError(timeoutError);
        if (onError) onError(timeoutError);
        stopPolling();
        return;
      }

      try {
        const updatedJob = await fetchJobStatus(currentJobId);
        if (updatedJob) {
          setJob(updatedJob);

          // Check if job is complete
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            if (updatedJob.status === 'completed' && onComplete) {
              onComplete(updatedJob);
            }
            if (updatedJob.status === 'failed' && onError) {
              onError(updatedJob.error || 'Job failed');
            }
            stopPolling();
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        stopPolling();
      }
    }, interval);
  }, [isPolling, fetchJobStatus, interval, maxAttempts, onComplete, onError, stopPolling]);

  // Effect to start/stop polling based on jobId changes
  useEffect(() => {
    if (jobId) {
      startPolling(jobId);
    } else {
      stopPolling();
      setJob(null);
      setError(null);
    }

    // Cleanup on unmount or jobId change
    return () => {
      stopPolling();
    };
  }, [jobId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    job,
    isPolling,
    error,
    refetch: useCallback(() => {
      if (jobId) {
        stopPolling();
        startPolling(jobId);
      }
    }, [jobId, startPolling, stopPolling]),
    stopPolling,
  };
}