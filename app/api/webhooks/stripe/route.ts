import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhookSignature } from '@/lib/stripe';
import Stripe from 'stripe';

// Database operations (placeholder - in production use Supabase)
async function updateJobPaymentStatus(
  jobId: string, 
  status: 'paid' | 'failed',
  paymentIntentId?: string
) {
  // TODO: Update job status in database
  console.log(`Job ${jobId} payment status: ${status}`, { paymentIntentId });
  
  // In production, this would update Supabase:
  // await supabase
  //   .from('jobs')
  //   .update({ 
  //     payment_status: status,
  //     payment_intent_id: paymentIntentId,
  //     paid_at: status === 'paid' ? new Date().toISOString() : null
  //   })
  //   .eq('id', jobId);
}

async function sendReceiptEmail(
  userId: string,
  jobId: string,
  amount: number,
  receiptUrl?: string
) {
  // TODO: Send receipt email
  console.log(`Send receipt email to user ${userId}`, { 
    jobId, 
    amount, 
    receiptUrl 
  });
  
  // In production, this would send email via service like SendGrid:
  // await sendEmail({
  //   to: userEmail,
  //   subject: 'Your Coloring Page Receipt',
  //   template: 'receipt',
  //   data: { jobId, amount, receiptUrl }
  // });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    console.log('Stripe webhook received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { jobId, userId, productType } = session.metadata || {};

        if (!jobId || !userId) {
          console.error('Missing metadata in checkout session:', session.id);
          break;
        }

        console.log('Payment successful:', {
          sessionId: session.id,
          jobId,
          userId,
          productType,
          amount: session.amount_total,
        });

        // Update job payment status
        await updateJobPaymentStatus(
          jobId,
          'paid',
          session.payment_intent as string
        );

        // Send receipt email
        if (session.amount_total) {
          await sendReceiptEmail(
            userId,
            jobId,
            session.amount_total,
            session.customer_email ? `Receipt sent to ${session.customer_email}` : undefined
          );
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { jobId, userId } = paymentIntent.metadata || {};

        if (jobId && userId) {
          console.log('Payment intent succeeded:', {
            paymentIntentId: paymentIntent.id,
            jobId,
            userId,
            amount: paymentIntent.amount,
          });
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { jobId, userId } = paymentIntent.metadata || {};

        if (jobId && userId) {
          console.log('Payment failed:', {
            paymentIntentId: paymentIntent.id,
            jobId,
            userId,
            lastPaymentError: paymentIntent.last_payment_error,
          });

          // Update job payment status to failed
          await updateJobPaymentStatus(jobId, 'failed', paymentIntent.id);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}