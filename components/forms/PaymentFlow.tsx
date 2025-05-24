'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentButton } from '@/components/ui/PaymentButton';
import { PricingCard } from '@/components/ui/PricingCard';
import { Badge } from '@/components/ui/badge';
// import { useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentFlowProps {
  jobId: string;
  jobStatus: string;
  onPaymentSuccess?: () => void;
}

export function PaymentFlow({ jobId, jobStatus, onPaymentSuccess }: PaymentFlowProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  // const { isSignedIn } = useAuth();

  // Poll payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/v1/job/${jobId}`);
        const data = await response.json();
        
        if (data.paymentStatus) {
          setPaymentStatus(data.paymentStatus);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
    
    // Poll every 5 seconds for payment updates
    const interval = setInterval(checkPaymentStatus, 5000);
    
    return () => clearInterval(interval);
  }, [jobId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking payment status...</span>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment failed. Please try again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isPaid = paymentStatus === 'paid';
  const isJobComplete = jobStatus === 'completed';

  return (
    <div className="bg-white rounded-3xl border-2 border-primary/10 p-8 shadow-xl space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          {isPaid ? (
            <>
              <span className="text-3xl">🎉</span>
              <h2 className="text-3xl font-bold text-green-600">
                Purchase Complete!
              </h2>
              <span className="text-3xl">✨</span>
            </>
          ) : (
            <>
              <span className="text-3xl">💳</span>
              <h2 className="text-3xl font-bold text-gray-900">
                Get Your Coloring Page
              </h2>
              <span className="text-3xl">🎨</span>
            </>
          )}
        </div>
        {isPaid ? (
          <p className="text-gray-600 text-lg">
            🎊 Your amazing coloring page is ready for download!
          </p>
        ) : (
          <p className="text-gray-600 text-lg">
            Your preview looks amazing! Purchase to get the full printable PDF.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PricingCard
          title="Coloring Page"
          price={99} // $0.99 in cents
          features={[
            'High-quality line art conversion',
            'Print-ready PDF format',
            'Instant download',
            '30-day access to re-download',
          ]}
          isPopular={true}
        >
          <PaymentButton
            jobId={jobId}
            productType="coloring_page"
            price={99}
            disabled={!isJobComplete}
            isPaid={isPaid}
            onPaymentSuccess={onPaymentSuccess}
          />
        </PricingCard>

        <PricingCard
          title="Regenerate"
          price={50} // $0.50 in cents
          features={[
            'Try different style or difficulty',
            'New AI-generated variation',
            'Same photo, fresh look',
            'Quick turnaround',
          ]}
        >
          <PaymentButton
            jobId={jobId}
            productType="regeneration"
            price={50}
            disabled={!isJobComplete}
            onPaymentSuccess={() => {
              // Trigger regeneration
              window.location.reload();
            }}
          />
        </PricingCard>
      </div>

      {!isJobComplete && (
        <div className="text-center">
          <Badge variant="secondary" className="gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing your coloring page...
          </Badge>
        </div>
      )}
    </div>
  );
}