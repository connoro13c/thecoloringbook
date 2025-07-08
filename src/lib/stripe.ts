// Server-side Stripe configuration (Node.js only)
import Stripe from 'stripe';
import { getRequiredEnv } from './env-validation';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = getRequiredEnv('STRIPE_SECRET_KEY');
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }
  return stripeInstance;
}

// For backwards compatibility - but prefer using getStripe() to avoid build-time issues
export { getStripe as stripe };

// Re-export client utilities for server use
export { STRIPE_CONFIG, formatPrice, validateDonationAmount } from './stripe-client';
