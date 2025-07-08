import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { createHighResVersions } from '@/lib/services/file-generation';
import { sendDonationReceipt } from '@/lib/services/email-service';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { rateLimit } from '@/lib/rate-limiter';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Validate required environment variables at runtime
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is required');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Apply rate limiting to prevent webhook abuse
    const rateLimitResult = rateLimit({
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    })(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');
    
    if (!sig) {
      console.error('Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract and validate metadata
      const pageId = session.metadata?.pageId;
      const userId = session.metadata?.userId;

      if (!pageId || !userId) {
        console.error('Missing required metadata in session:', session.id);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }
      
      // Validate metadata format (UUIDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(pageId) || !uuidRegex.test(userId)) {
        console.error('Invalid UUID format in metadata:', { pageId, userId });
        return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 });
      }
      
      // Validate payment amount (minimum $1)
      if (!session.amount_total || session.amount_total < 100) {
        console.error('Invalid payment amount:', session.amount_total);
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      // Use service role client to bypass RLS
      const supabase = createServiceClient();

      try {
        // Step 1: Get the original page data to access the generated image
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('jpg_path')
          .eq('id', pageId)
          .single();

        if (pageError || !pageData || !pageData.jpg_path) {
          console.error('Error fetching page data or missing jpg_path:', pageError);
          return NextResponse.json({ error: 'Page not found or missing image' }, { status: 404 });
        }

        // Step 2: Get the image data from storage
        const { data: imageData, error: downloadError } = await supabase.storage
          .from('pages')
          .download(pageData.jpg_path);

        if (downloadError || !imageData) {
          console.error('Error downloading image:', downloadError);
          return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
        }

        // Step 3: Convert image to base64 for processing
        const imageBuffer = await imageData.arrayBuffer();
        const imageBase64 = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;

        // Step 4: Generate high-resolution PDF and PNG files
        console.log(`🎨 Creating high-res files for payment: ${session.id}`);
        const fileResult = await createHighResVersions(pageId, userId, imageBase64);

        // Step 5: Insert download record with permanent file paths
        const { error: insertError } = await supabase
          .from('downloads')
          .upsert({
            user_id: userId,
            page_id: pageId,
            stripe_session_id: session.id,
            pdf_path: fileResult.pdfPath,  // Store permanent path, not URL
            png_path: fileResult.pngPath,  // Store permanent path, not URL
            storage_tier: 'hot',
            expires_at: null, // No expiry for file paths
            last_accessed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,page_id',
            ignoreDuplicates: false,
          });

        if (insertError) {
          console.error('Error inserting download record:', insertError);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        console.log(`✅ Successfully processed payment and created files for page ${pageId}`);

        // Step 6: Send donation receipt email (async, don't block on errors)
        try {
          await sendDonationReceipt({
            userEmail: session.customer_email || session.customer_details?.email || '',
            userName: session.customer_details?.name || undefined,
            amount: session.amount_total || 0,
            donationDate: new Date().toISOString(),
            stripeSessionId: session.id,
            pageId: pageId
          });
        } catch (emailError) {
          console.error('Error sending donation receipt:', emailError);
          // Don't fail the webhook for email errors
        }

      } catch (fileError) {
        console.error('Error generating high-res files:', fileError);
        return NextResponse.json({ error: 'Failed to generate high-resolution files' }, { status: 500 });
      }

      console.log('Successfully processed payment for page:', pageId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
