'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import { Loader2, CreditCard, Download } from 'lucide-react';

interface PaymentButtonProps {
  jobId: string;
  productType: 'coloring_page' | 'regeneration';
  price: number;
  disabled?: boolean;
  isPaid?: boolean;
  onPaymentSuccess?: () => void;
}

export function PaymentButton({
  jobId,
  productType,
  price,
  disabled = false,
  isPaid = false,
  onPaymentSuccess,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handlePayment = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          productType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isPaid) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/download/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link');
      }

      // Trigger download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `coloring-page-${jobId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isPaid) {
    return (
      <Button className="w-full" onClick={handleDownload} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing download...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {productType === 'regeneration' ? 'Regenerate' : 'Purchase'} {formatPrice(price)}
        </>
      )}
    </Button>
  );
}