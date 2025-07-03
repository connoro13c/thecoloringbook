'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { STRIPE_CONFIG, formatPrice } from '@/lib/stripe-client';
import { Heart, Download } from 'lucide-react';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  onDonationSuccess?: () => void;
}

export function DonationModal({ 
  open, 
  onOpenChange, 
  pageId, 
  onDonationSuccess 
}: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(STRIPE_CONFIG.defaultAmounts[1]); // Default to $5
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
    setError('');
    
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 1) {
      setSelectedAmount(Math.round(amount * 100)); // Convert to cents
    }
  };

  const handleDonate = async () => {
    try {
      setIsLoading(true);
      setError('');

      const finalAmount = isCustom 
        ? Math.round(parseFloat(customAmount) * 100) 
        : selectedAmount;

      if (finalAmount < STRIPE_CONFIG.minAmount) {
        setError('Minimum donation amount is $1');
        return;
      }

      const response = await fetch('/api/v1/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          amount: finalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(STRIPE_CONFIG.publishableKey)
      );
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // If we reach here, the redirect failed
      onDonationSuccess?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-rose-500" />
            Donate to Unlock High-Resolution Files
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your donation helps us create more magical coloring pages for children. 
            You'll receive both PDF and PNG high-resolution files, plus a tax-deductible receipt.
          </p>

          <div className="space-y-3">
            <Label>Choose your donation amount:</Label>
            
            <div className="grid grid-cols-3 gap-2">
              {STRIPE_CONFIG.defaultAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount && !isCustom ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className="h-12"
                >
                  {formatPrice(amount)}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount">Or enter custom amount:</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="5.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">What you'll get:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  <li>• High-resolution PDF (perfect for printing)</li>
                  <li>• High-resolution PNG (great for digital use)</li>
                  <li>• Tax-deductible donation receipt</li>
                  <li>• Permanent access in your Library</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDonate}
              disabled={isLoading || (isCustom && !customAmount)}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : `Donate ${formatPrice(selectedAmount)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
