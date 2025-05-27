import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth-server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check which tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      return NextResponse.json({
        error: 'Failed to query tables',
        details: tablesError.message
      }, { status: 500 })
    }
    
    // Test critical tables
    const requiredTables = ['upload_sessions', 'image_uploads', 'image_analyses', 'page_generations']
    const existingTables = tables?.map(t => t.table_name) || []
    
    const tableStatus = requiredTables.map(table => ({
      table,
      exists: existingTables.includes(table),
      status: existingTables.includes(table) ? '✓' : '✗'
    }))
    
    return NextResponse.json({
      allTables: existingTables,
      requiredTables: tableStatus,
      summary: {
        total: existingTables.length,
        required: requiredTables.length,
        missing: requiredTables.filter(t => !existingTables.includes(t))
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}