import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

// Client-side publishable key
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Product configuration
export const PRODUCTS = {
  COLORING_PAGE: {
    name: 'Coloring Page PDF',
    description: 'Custom generated coloring page with download',
    price: 99, // $0.99 in cents
    currency: 'usd',
  },
  REGENERATE: {
    name: 'Regenerate Coloring Page',
    description: 'Generate a new version of your coloring page',
    price: 50, // $0.50 in cents
    currency: 'usd',
  },
} as const;

// Create Stripe checkout session
export async function createCheckoutSession({
  jobId,
  userId,
  productType,
  successUrl,
  cancelUrl,
}: {
  jobId: string;
  userId: string;
  productType: keyof typeof PRODUCTS;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const product = PRODUCTS[productType];
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: undefined, // Will be populated by Clerk user email if needed
      metadata: {
        jobId,
        userId,
        productType,
      },
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
              metadata: {
                jobId,
                productType,
              },
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Enable Stripe Radar for fraud prevention
      payment_intent_data: {
        metadata: {
          jobId,
          userId,
          productType,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Helper to format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}