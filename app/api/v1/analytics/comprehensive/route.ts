import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth-server';

/**
 * Analytics endpoint for comprehensive tracking data
 * Provides insights into usage patterns, popular styles, etc.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin access (you'll need to implement admin checking)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = Number(url.searchParams.get('days')) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get comprehensive analytics using our database function
    const { data: analytics, error } = await supabase.rpc('get_analytics_summary', {
      start_date: startDate.toISOString(),
      end_date: new Date().toISOString()
    });

    if (error) {
      console.error('Analytics query failed:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Get detailed breakdowns
    const { data: sessionDetails } = await supabase
      .from('upload_sessions')
      .select(`
        id,
        user_id,
        created_at,
        image_uploads (count),
        page_generations (
          style,
          difficulty,
          created_at
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({
      summary: analytics,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      recentSessions: sessionDetails || [],
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get image analysis insights
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisType = 'attributes' } = await request.json();

    if (analysisType === 'attributes') {
      // Analyze common child attributes patterns
      const { data: analyses } = await supabase
        .from('image_analyses')
        .select('parsed_analysis')
        .not('parsed_analysis', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!analyses) {
        return NextResponse.json({ attributes: [] });
      }

      // Aggregate analysis results
      const attributeStats = {
        ages: {} as Record<string, number>,
        hair_styles: {} as Record<string, number>,
        clothing: {} as Record<string, number>,
        poses: {} as Record<string, number>,
        main_objects: {} as Record<string, number>
      };

      analyses.forEach((analysis) => {
        const attrs = analysis.parsed_analysis as Record<string, string>;
        if (attrs) {
          if (attrs.age) attributeStats.ages[attrs.age] = (attributeStats.ages[attrs.age] || 0) + 1;
          if (attrs.hair_style) attributeStats.hair_styles[attrs.hair_style] = (attributeStats.hair_styles[attrs.hair_style] || 0) + 1;
          if (attrs.clothing) attributeStats.clothing[attrs.clothing] = (attributeStats.clothing[attrs.clothing] || 0) + 1;
          if (attrs.pose) attributeStats.poses[attrs.pose] = (attributeStats.poses[attrs.pose] || 0) + 1;
          if (attrs.main_object && attrs.main_object !== 'none') {
            attributeStats.main_objects[attrs.main_object] = (attributeStats.main_objects[attrs.main_object] || 0) + 1;
          }
        }
      });

      return NextResponse.json({
        totalAnalyses: analyses.length,
        attributeBreakdown: attributeStats,
        generatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });

  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate detailed analytics' },
      { status: 500 }
    );
  }
}