import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid' && session.metadata?.user_id) {
        const userId = session.metadata.user_id
        const amountCents = session.amount_total || 0
        const creditsToGrant = Math.floor(amountCents / 25) // $0.25 per credit

        try {
          // Add credits to user
          const { error: creditError } = await supabase
            .rpc('add_credits', { 
              user_uuid: userId, 
              credit_count: creditsToGrant 
            })

          if (creditError) {
            console.error('❌ Error adding credits:', creditError)
            throw creditError
          }

          // Log donation
          const { error: donationError } = await supabase
            .from('donations')
            .insert({
              user_id: userId,
              stripe_payment_id: session.payment_intent as string,
              amount_cents: amountCents,
              credits_granted: creditsToGrant,
              stripe_status: 'completed'
            })

          if (donationError) {
            console.error('❌ Error logging donation:', donationError)
            // Don't throw here - credits were already added
          }

          console.log(`✅ Successfully processed donation: ${creditsToGrant} credits for user ${userId}`)

        } catch (error) {
          console.error('❌ Error processing successful payment:', error)
          return NextResponse.json({ error: 'Error processing payment' }, { status: 500 })
        }
      }
    }

    // Handle failed payments
    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.metadata?.user_id) {
        const { error } = await supabase
          .from('donations')
          .insert({
            user_id: session.metadata.user_id,
            stripe_payment_id: session.payment_intent as string,
            amount_cents: session.amount_total || 0,
            credits_granted: 0,
            stripe_status: 'failed'
          })

        if (error) {
          console.error('❌ Error logging failed payment:', error)
        }
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
