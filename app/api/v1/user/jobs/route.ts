import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Mock database functions (placeholder - in production use Supabase)
async function getUserJobs(userId: string) {
  // TODO: Query user jobs from database
  console.log(`Fetching jobs for user ${userId}`);
  
  // In production, this would query Supabase:
  // const { data, error } = await supabase
  //   .from('jobs')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('created_at', { ascending: false });
  // 
  // if (error) throw error;
  // return data;
  
  // For now, return mock data
  return [
    {
      jobId: 'job_1234567890',
      status: 'completed',
      imageUrl: 'https://example.com/sample-coloring-page.png',
      pdfUrl: 'https://example.com/sample-coloring-page.pdf',
      scenePrompt: 'A child playing in a magical garden',
      style: 'classic',
      difficulty: 3,
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), // 23 hours ago
    },
    {
      jobId: 'job_0987654321',
      status: 'completed',
      imageUrl: 'https://example.com/sample-coloring-page-2.png',
      pdfUrl: 'https://example.com/sample-coloring-page-2.pdf',
      scenePrompt: 'Superhero adventure scene',
      style: 'manga',
      difficulty: 4,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 3 days ago + 1 hour
    },
    {
      jobId: 'job_1122334455',
      status: 'processing',
      scenePrompt: 'Princess castle adventure',
      style: 'classic',
      difficulty: 2,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      jobId: 'job_5544332211',
      status: 'failed',
      scenePrompt: 'Space exploration scene',
      style: 'bold',
      difficulty: 5,
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
  ];
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's jobs from database
    const jobs = await getUserJobs(userId);

    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
    });

  } catch (error) {
    console.error('User jobs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user jobs' },
      { status: 500 }
    );
  }
}