// Server-side Stripe configuration (Node.js only)
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-01-10',
});

// Re-export client utilities for server use
export { STRIPE_CONFIG, formatPrice, validateDonationAmount } from './stripe-client';
