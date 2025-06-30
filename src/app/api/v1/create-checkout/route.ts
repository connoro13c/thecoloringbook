import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const CreateCheckoutSchema = z.object({
  amount: z.number().min(0.25, 'Minimum donation is $0.25'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const { amount, successUrl, cancelUrl } = CreateCheckoutSchema.parse(body)

    const amountCents = Math.round(amount * 100)
    const creditsToGrant = Math.floor(amountCents / 25)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Coloring Book Credits (${creditsToGrant} credits)`,
              description: 'Support Stanford Children\'s Hospital and get credits for coloring pages',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
      metadata: {
        user_id: user.id,
        credits_to_grant: creditsToGrant.toString()
      },
    })

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })

  } catch (error) {
    console.error('❌ Checkout creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
