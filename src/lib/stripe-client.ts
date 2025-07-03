// Client-side Stripe configuration (browser-safe)
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: 'usd',
  minAmount: 100, // $1.00 in cents
  defaultAmounts: [100, 500, 1000], // $1, $5, $10
} as const;

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function validateDonationAmount(amount: number): boolean {
  return amount >= STRIPE_CONFIG.minAmount;
}
