import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, validateDonationAmount } from '@/lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  pageId: z.string().uuid(),
  amount: z.number().min(100), // Minimum $1 in cents
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { pageId, amount } = checkoutSchema.parse(body);

    // Validate donation amount
    if (!validateDonationAmount(amount)) {
      return NextResponse.json(
        { error: 'Minimum donation amount is $1' },
        { status: 400 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Coloring Book Donation',
              description: 'Tax-deductible donation to unlock high-resolution coloring page',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
      metadata: {
        pageId,
        userId: user.id,
      },
      customer_email: user.email,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
