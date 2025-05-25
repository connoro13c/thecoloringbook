'use client';

import { useQueueStatus } from '@/lib/hooks/useJobStatus';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface QueueStatusProps {
  userId: string | null;
}

export function QueueStatus({ userId }: QueueStatusProps) {
  const { queueJobs, loading } = useQueueStatus(userId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading queue status...</span>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'retrying':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const retryJob = async (queueJobId: string) => {
    try {
      const response = await fetch('/api/v1/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueJobId, action: 'retry' })
      });

      if (!response.ok) {
        throw new Error('Failed to retry job');
      }

      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry job. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Processing Queue ({queueJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {queueJobs.length === 0 ? (
          <p className="text-sm text-gray-500">No jobs in queue</p>
        ) : (
          <div className="space-y-3">
            {queueJobs.map((queueJob) => (
              <div key={queueJob.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(queueJob.status)}
                  <div>
                    <p className="text-sm font-medium">
                      {queueJob.jobs?.prompt || 'Coloring Page Generation'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {queueJob.jobs?.style} • Level {queueJob.jobs?.difficulty}
                    </p>
                    {queueJob.error_message && (
                      <p className="text-xs text-red-500 mt-1">{queueJob.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(queueJob.status) as any}>
                    {queueJob.status}
                  </Badge>
                  {queueJob.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryJob(queueJob.id)}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}