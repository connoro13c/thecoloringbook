# Setup Guide - Coloring Book App

## Prerequisites

- Node.js 20.9.0 or higher
- Supabase account
- OpenAI API key
- Stripe account (for payments)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`

## Database Setup

Run the database migrations in order:

1. **User Credits Table:**
   ```sql
   -- Run: database/migrations/20250629_001_create_user_credits_table.sql
   ```

2. **Donations Table:**
   ```sql
   -- Run: database/migrations/20250629_002_create_donations_table.sql
   ```

3. **Credit Functions:**
   ```sql
   -- Run: database/migrations/20250629_003_create_credit_functions.sql
   ```

## Supabase Configuration

### 1. Enable Auth Providers

Go to Authentication > Providers and enable:
- Email (for magic links)
- Google (optional)

### 2. Set up Storage Buckets

Create two storage buckets:
- `temp-pages` (public) - for anonymous user previews
- `user-pages` (private) - for authenticated user pages

### 3. Row Level Security

The migrations include RLS policies. Verify they're enabled:
- `user_credits`: Users can only read their own credits
- `donations`: Users can only read their own donations
- `pages`: Users can only access their own pages

## Stripe Setup

1. Create a Stripe account
2. Get your secret key and webhook secret
3. Set up webhook endpoint: `your-domain.com/api/webhooks/stripe`
4. Subscribe to events: `checkout.session.completed`, `checkout.session.async_payment_failed`

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

## Testing

Test the complete flow:
1. Upload a photo (anonymous preview)
2. Generate preview
3. Click "Download & Save" to trigger auth
4. Sign up with email verification
5. Receive 5 free credits
6. Generate full-resolution image
7. Test donation flow when credits run out

## Key Features Implemented

✅ **Anonymous Previews:** Free low-res generation, no account required
✅ **Credit System:** 5 free credits after email verification
✅ **Donation Model:** $0.25 per credit, supports Stanford Children's Hospital
✅ **Auth Integration:** Seamless Supabase authentication
✅ **Stripe Payments:** Secure donation processing
✅ **Real-time Updates:** Credit balance updates via Supabase subscriptions
✅ **Database Functions:** Secure credit management with Postgres functions
