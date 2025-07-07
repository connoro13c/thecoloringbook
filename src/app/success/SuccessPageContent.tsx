'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Image, Receipt, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DownloadData {
  pdfUrl: string;
  pngUrl: string;
  pageId: string;
}

export function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDownloadData = async () => {
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/download-links?session_id=${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch download links');
        }
        
        const data = await response.json();
        setDownloadData(data);
        
        // Auto-download PDF on desktop
        if (typeof window !== 'undefined' && !isMobile()) {
          downloadFile(data.pdfUrl, 'coloring-page.pdf');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadData();
  }, [sessionId]);

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="text-center">
        <CardContent className="p-8">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank You for Your Donation!
            </h1>
            <p className="text-lg text-gray-600">
              Your coloring page is ready for download
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => downloadFile(downloadData!.pdfUrl, 'coloring-page.pdf')}
                className="flex items-center justify-center gap-2 h-12"
              >
                <FileText className="h-5 w-5" />
                Download PDF
              </Button>
              
              <Button
                variant="outline"
                onClick={() => downloadFile(downloadData!.pngUrl, 'coloring-page.png')}
                className="flex items-center justify-center gap-2 h-12"
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                 <Image className="h-5 w-5" />
                Download PNG
              </Button>
            </div>

            {isMobile() && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                <p>
                  On mobile devices, downloads may open in a new tab. 
                  Long-press the image to save it to your device.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            What&apos;s Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive a tax-deductible donation receipt and Stripe payment confirmation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Access your Library</p>
                <p className="text-sm text-muted-foreground">
                  All your downloaded pages are saved in your personal Library for future access
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Print and enjoy!</p>
                <p className="text-sm text-muted-foreground">
                  Your high-resolution files are perfect for printing on standard paper
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild variant="outline">
              <Link href="/library">
                View Library
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            
            <Button asChild>
              <Link href="/">
                Create Another Page
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
