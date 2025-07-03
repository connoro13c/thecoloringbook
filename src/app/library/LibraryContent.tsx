'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Download, Calendar, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Download {
  id: string;
  page_id: string;
  pdf_path: string;
  png_path: string;
  pdfUrl?: string; // Fresh presigned URL from API
  pngUrl?: string; // Fresh presigned URL from API
  storage_tier: 'hot' | 'cold';
  created_at: string;
  last_accessed_at: string;
  expires_at?: string;
  stripe_session_id?: string; // For fetching fresh URLs
}

export function LibraryContent() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/my-pages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch downloads');
      }
      
      const data = await response.json();
      setDownloads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (download: Download, type: 'pdf' | 'png') => {
    // Use fresh presigned URLs if available, otherwise fallback to stored paths
    const url = type === 'pdf' 
      ? (download.pdfUrl || download.pdf_path) 
      : (download.pngUrl || download.png_path);
    const filename = `coloring-page-${download.page_id.slice(0, 8)}.${type}`;
    
    // If we don't have fresh URLs, fetch them first
    if (!download.pdfUrl || !download.pngUrl) {
      try {
        const response = await fetch(`/api/v1/download-links?session_id=${download.stripe_session_id || download.id}`);
        if (response.ok) {
          const { pdfUrl, pngUrl } = await response.json();
          const freshUrl = type === 'pdf' ? pdfUrl : pngUrl;
          downloadFile(freshUrl, filename);
          return;
        }
      } catch (error) {
        console.error('Failed to get fresh download URL:', error);
      }
    }

    downloadFile(url, filename);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={fetchDownloads} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (downloads.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground mb-4">
            <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No downloads yet</h3>
            <p className="text-sm">
              Create and donate for your first coloring page to see it here!
            </p>
          </div>
          <Button asChild>
            <Link href="/">Create Your First Page</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {downloads.map((download) => (
          <Card key={download.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Coloring Page
                </CardTitle>
                <Badge variant={download.storage_tier === 'hot' ? 'default' : 'secondary'}>
                  {download.storage_tier === 'hot' ? 'Ready' : 'Archived'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(download.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(download, 'pdf')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(download, 'png')}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  PNG
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  Page ID: {download.page_id.slice(0, 8)}...
                </div>
                {download.last_accessed_at && (
                  <div>
                    Last accessed: {formatDistanceToNow(new Date(download.last_accessed_at), { addSuffix: true })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={fetchDownloads} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Library
        </Button>
      </div>
    </div>
  );
}
