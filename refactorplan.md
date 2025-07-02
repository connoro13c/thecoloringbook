Of course. Here is the refactoring plan in Markdown format, ready for your AI Code Agent.

Refactoring Plan: Coloring Book App - Auth and Storage
Project Goal: Refactor Auth and Storage for Simplicity and Reliability
The primary objective is to refactor the application to address the "Auth and Storage problems" you mentioned. We will achieve this by:

Simplifying the storage model: Moving from a two-bucket system to a single, unified bucket with clear lifecycle policies.

Streamlining the auth flow: Implementing a "just-in-time" account creation process and simplifying the middleware.

Reducing backend complexity: Optimizing the background job queue and consolidating API routes.

Phase 1: Simplify the Storage Layer
Objective: Replace the dual-bucket system (temp-pages and user-pages) with a single pages bucket. This will simplify file management and cleanup.

Step 1.1: Create a New Unified Storage Bucket
Action: In your Supabase dashboard, create a new storage bucket named pages.

Configuration: Make this bucket private. We will use signed URLs for access.

Cleanup: Once the refactoring is complete and verified, you can delete the old temp-pages and user-pages buckets.

Step 1.2: Update Supabase RLS Policies for Storage
File to Modify: Create a new SQL migration file in scripts/ (e.g., update-storage-rls.sql).

Action: Define the RLS policies for the new pages bucket.

SQL

-- Allow public read access for files with a 'public' tag
CREATE POLICY "Allow public read for public pages"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pages' AND (storage.foldername(name))[1] = 'public' );

-- Allow authenticated users to manage their own files
CREATE POLICY "Allow authenticated users to manage their own folder"
ON storage.objects FOR ALL
USING ( bucket_id = 'pages' AND auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( bucket_id = 'pages' AND auth.uid()::text = (storage.foldername(name))[1] );
Step 1.3: Refactor the Storage Library
File to Modify: lib/storage.ts

Action:

Update all functions to use the new pages bucket.

Implement a new function uploadAnonymousFile that uploads to a public/ folder within the pages bucket. Use a unique token for the filename.

Implement a new function associateFileWithUser that moves a file from the public/ folder to a user-specific folder upon login or signup.

TypeScript

// In lib/storage.ts

import { supabase } from './db';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'pages';

export async function uploadAnonymousFile(file: File) {
  const fileName = `${uuidv4()}-${file.name}`;
  const filePath = `public/${fileName}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (error) throw error;
  return data.path;
}

export async function associateFileWithUser(filePath: string, userId: string) {
  const newPath = filePath.replace('public/', `${userId}/`);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .move(filePath, newPath);

  if (error) throw error;
  return data.path;
}

// ... other storage functions updated for the new bucket ...
Step 1.4: Update API Routes
File to Modify: /app/api/v1/upload/route.ts

Action:

Use the new uploadAnonymousFile function from lib/storage.ts.

If the user is authenticated, immediately call associateFileWithUser.

Return the file path to the client.

Phase 2: Refactor the Authentication Flow
Objective: Simplify the authentication middleware and implement a "just-in-time" account creation flow.

Step 2.1: Simplify the Middleware
File to Modify: middleware.ts

Action: The current middleware is quite good for refreshing the session. To make it lighter, we can adjust the matcher to exclude static assets and public pages, which reduces the number of invocations. Your current matcher is already well-optimized. No changes are needed here unless you want to further restrict it.

Step 2.2: Implement Just-in-Time Account Creation
File to Modify: /app/upload/page.tsx and relevant UI components.

Action:

When an anonymous user clicks "Save this page," trigger a modal that prompts them to sign up or log in.

Store the path of the generated image in the client's local storage.

After successful authentication, read the image path from local storage and call a new API route to associate the image with the user.

Step 2.3: Create an "Associate" API Route
File to Modify: Create a new route at /app/api/v1/associate-file/route.ts.

Action:

This route will take a filePath as input.

It should be protected by the auth middleware to ensure only authenticated users can access it.

Call the associateFileWithUser function from lib/storage.ts.

TypeScript

// In /app/api/v1/associate-file/route.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { associateFileWithUser } from '@/lib/storage';

export async function POST(request: Request) {
  const { filePath } = await request.json();
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const newPath = await associateFileWithUser(filePath, user.id);
  return NextResponse.json({ success: true, path: newPath });
}
Phase 3: Optimize Background Job Processing
Objective: Transition from a custom Postgres-based queue to a more standard and lighter-weight solution using Vercel's built-in tools.

Step 3.1: Replace the Custom Queue
Recommendation: Use Vercel KV (a serverless Redis database) as a simple and effective queue.

Action:

Set up Vercel KV in your project dashboard.

Add the necessary environment variables to your .env.local and Vercel project settings.

Step 3.2: Refactor the Queue Library
File to Modify: lib/queue.ts

Action: Replace the Postgres-based queue logic with Vercel KV commands.

TypeScript

// In lib/queue.ts
import { kv } from '@vercel/kv';

export async function addJobToQueue(jobData: any) {
  const jobId = `job:${uuidv4()}`;
  await kv.lpush('image-processing-queue', JSON.stringify({ ...jobData, jobId }));
  return jobId;
}

export async function getNextJobFromQueue() {
  const job = await kv.rpop('image-processing-queue');
  return job ? JSON.parse(job) : null;
}
Step 3.3: Update the Cron Job
File to Modify: /app/api/cron/process-queue/route.ts

Action: Update the cron job to use the new getNextJobFromQueue function. The vercel.json file can remain as is, as it just triggers the route.

Phase 4: Cleanup and Verification
Objective: Remove obsolete code and ensure the new architecture is working correctly.

Step 4.1: Delete Unused Files and Code
Action:

Delete the old SQL scripts for setting up the two-bucket system.

Remove any old API routes that have been consolidated.

Delete the old lib/queue.ts logic if you've migrated to Vercel KV.

Step 4.2: Update Documentation
Files to Modify: RUNBOOK.md and AGENT.md.

Action:

Update the "Storage Architecture" and "Database Schema" sections to reflect the new single-bucket model.

Update the runbook with any new operational procedures related to the new storage and queueing system.

Step 4.3: Testing
Action:

Create new end-to-end tests for the anonymous-to-authenticated user flow.

Verify that the RLS policies are working as expected by writing tests that attempt to access files without the proper permissions.