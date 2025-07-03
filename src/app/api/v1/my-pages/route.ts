import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDownloadUrls } from '@/lib/services/file-generation';

export async function GET() {
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

    // Fetch user's downloads
    const { data: downloads, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching downloads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch downloads' },
        { status: 500 }
      );
    }

    // Process downloads to add fresh URLs for frontend display
    const processedDownloads = await Promise.all(
      downloads.map(async (download: { id: string; pdf_path: string; png_path: string; [key: string]: unknown }) => {
        try {
          // Generate fresh presigned URLs from stored file paths
          const { pdfUrl, pngUrl } = await generateDownloadUrls(
            download.pdf_path,
            download.png_path,
            86400 // 24 hours
          );

          return {
            ...download,
            pdfUrl, // Add URLs for immediate download
            pngUrl
          };
        } catch (urlError) {
          console.error('Error generating URLs for download:', download.id, urlError);
          // Return download record without URLs if generation fails
          return download;
        }
      })
    );

    return NextResponse.json(processedDownloads);
  } catch (error) {
    console.error('My pages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}
