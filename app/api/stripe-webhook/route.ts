import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(failedPayment)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const jobId = session.metadata?.jobId
  const userId = session.metadata?.userId

  if (!jobId || !userId) {
    console.error('Missing metadata in checkout session:', session.id)
    return
  }

  try {
    // Update job status to PAID
    const { error } = await supabase
      .from('jobs')
      .update({ 
        status: 'PAID',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to update job status:', error)
    } else {
      console.log(`Job ${jobId} marked as PAID`)
    }

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const jobId = paymentIntent.metadata?.jobId

  if (!jobId) {
    console.log('No jobId in payment intent metadata')
    return
  }

  console.log(`Payment succeeded for job ${jobId}`)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const jobId = paymentIntent.metadata?.jobId

  if (!jobId) {
    console.log('No jobId in failed payment intent metadata')
    return
  }

  console.log(`Payment failed for job ${jobId}`)
  
  // Could implement retry logic or user notification here
}