# Database Migration Required

## Migration to Add Claim Token Support

Before testing the anonymous-to-authenticated user flow, you need to run the following SQL migration:

```sql
-- Add claim_token column to pages table for anonymous-to-authenticated user flow
-- This allows anonymous users to claim their pages after signing up

ALTER TABLE pages ADD COLUMN claim_token UUID DEFAULT gen_random_uuid();

-- Add index for efficient lookups during claiming
CREATE INDEX idx_pages_claim_token ON pages(claim_token) WHERE claim_token IS NOT NULL;
```

## How to Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands above

**OR**

1. Use the SQL file: `database/migrations/20250108_add_claim_token.sql`
2. Copy the contents and run it in your Supabase SQL Editor

## What This Enables

After running this migration, the anonymous-to-authenticated user flow will work as follows:

1. **Anonymous User**: Creates a coloring page → gets a unique `claim_token`
2. **localStorage**: Stores the `pageId` and `claimToken` locally
3. **Sign Up**: User creates account
4. **Dashboard**: Automatically claims their anonymous pages using the stored tokens
5. **Result**: User sees all their previously generated pages in the dashboard

## Testing the Flow

1. Run the migration above
2. Go to the app as an anonymous user
3. Upload a photo and generate a coloring page
4. Click "Save this page - Create account"
5. Sign up with email
6. Navigate to dashboard - you should see your generated page!

## Files Modified

- `database/migrations/20250108_add_claim_token.sql` - Migration script
- `src/lib/utils/pending-claims.ts` - localStorage utility
- `src/app/api/v1/claim-pages/route.ts` - API endpoint to claim pages
- `src/components/dashboard/DashboardClient.tsx` - Auto-claim logic
- `src/app/page.tsx` - Store pending claims after generation
- `src/lib/database.ts` - Updated types for claim_token
- `src/types/index.ts` - Updated GenerationResponse type
- `src/lib/services/generation-service.ts` - Return claim_token in response
