# Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/log in
3. Click "New Project" 
4. Name: `coloring-book`
5. Choose strong database password
6. Select region closest to you
7. Click "Create new project"

## Step 2: Get Your Keys
**Dashboard → Settings → API**

Copy these values to your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` = "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = "anon public" key  
- `SUPABASE_SERVICE_ROLE_KEY` = "service_role secret" key

## Step 3: Clean Up Previous Attempts (if needed)
If you get "already exists" errors, run this first:

**Dashboard → SQL Editor → New Query**

Copy and paste the entire contents of `supabase/cleanup.sql` and click "Run".

## Step 4: Run Database Migration
**Dashboard → SQL Editor → New Query**

Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql` and click "Run".

## Step 5: Set Up Storage
**Dashboard → SQL Editor → New Query**

Copy and paste the entire contents of `supabase/storage_setup.sql` and click "Run".

## Step 6: Verify Setup
**Dashboard → Storage** - Should see:
- ✅ `temp-pages` (public bucket)  
- ✅ `user-pages` (private bucket)

**Dashboard → Table Editor** - Should see:
- ✅ `pages` table
- ✅ `page_sessions` table

## Step 7: Test Connection
Update your `.env.local` with the actual keys, then run:
```bash
npm run dev
```

The app should start without Supabase connection errors.

---

⚠️ **Important**: Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it has admin privileges!
