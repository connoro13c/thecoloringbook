'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Plus, 
  Download, 
  Calendar, 
  Image as ImageIcon, 
  FileText,
  Loader2,
  AlertCircle,
  LogOut
} from 'lucide-react';

interface UserJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  pdfUrl?: string;
  scenePrompt?: string;
  style: 'classic' | 'ghibli' | 'bold';
  difficulty: number;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<UserJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchUserJobs();
      } else {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserJobs();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const fetchUserJobs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/user/jobs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // User will be redirected by auth state change
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleDownload = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/download/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download');
      }

      // Trigger download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `coloring-page-${jobId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedJobs = jobs.filter(job => job.status === 'completed');
  const processingJobs = jobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                My Coloring Pages
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.email}!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing</p>
                  <p className="text-2xl font-bold text-blue-600">{processingJobs.length}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{failedJobs.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No coloring pages yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first custom coloring page from your photos
              </p>
              <Link href="/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Your Coloring Pages</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Card key={job.jobId} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {job.scenePrompt || 'Custom Coloring Page'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {job.style} style • Level {job.difficulty}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Image Preview */}
                    {job.imageUrl && (
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={job.imageUrl}
                          alt="Coloring page preview"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Payment Status */}
                    {job.paymentStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Payment:</span>
                        <Badge variant={getPaymentStatusColor(job.paymentStatus)}>
                          {job.paymentStatus}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {job.status === 'completed' && job.paymentStatus === 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(job.jobId)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      {job.status === 'completed' && job.paymentStatus !== 'paid' && (
                        <Link href={`/upload?jobId=${job.jobId}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            Purchase
                          </Button>
                        </Link>
                      )}

                      {job.status === 'failed' && (
                        <Link href="/upload" className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            Try Again
                          </Button>
                        </Link>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Created: {formatDate(job.createdAt)}
                      </div>
                      {job.completedAt && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Completed: {formatDate(job.completedAt)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}