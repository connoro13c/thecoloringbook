import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const checkoutSchema = z.object({
  jobId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, successUrl, cancelUrl } = checkoutSchema.parse(body)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Coloring Page Download',
              description: 'High-quality PDF coloring page download',
            },
            unit_amount: 99, // $0.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        jobId,
        userId
      },
      customer_email: undefined, // Let Stripe collect email
      payment_intent_data: {
        metadata: {
          jobId,
          userId
        }
      }
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error) {
    console.error('Create checkout session error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}