import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDownloadUrls } from '@/lib/services/file-generation';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Fetch download record
    const { data: download, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !download) {
      return NextResponse.json(
        { error: 'Download not found' },
        { status: 404 }
      );
    }

    // Generate fresh presigned URLs from stored file paths
    try {
      const { pdfUrl, pngUrl } = await generateDownloadUrls(
        download.pdf_path,
        download.png_path,
        86400 // 24 hours
      );

      // Update last accessed time
      await supabase
        .from('downloads')
        .update({
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', download.id);

      return NextResponse.json({
        pdfUrl,
        pngUrl,
        pageId: download.page_id,
      });
    } catch (urlError) {
      console.error('Error generating download URLs:', urlError);
      return NextResponse.json(
        { error: 'Failed to generate download URLs' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Download links error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download links' },
      { status: 500 }
    );
  }
}
