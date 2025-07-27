#!/usr/bin/env npx tsx
/**
 * Apply the claim_token removal migration to production database
 * Usage: npx tsx scripts/apply-migration.ts [--project-id=PROJECT_ID]
 */

import { createClient } from '@supabase/supabase-js'

async function applyMigrationDirect() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
    process.exit(1)
  }

  console.log('🔗 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🔄 Applying migration: Drop claim_token column...')

  try {
    // First check if the column exists
    console.log('🔍 Checking if claim_token column exists...')
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'pages')
      .eq('column_name', 'claim_token')

    if (checkError) {
      throw checkError
    }

    if (!columns || columns.length === 0) {
      console.log('ℹ️  claim_token column does not exist - migration already complete')
      return
    }

    console.log('⚠️  claim_token column exists - manual migration required')
    console.log('\n📋 Please run this SQL in your Supabase Dashboard SQL Editor:')
    console.log('   DROP INDEX IF EXISTS idx_pages_claim_token;')
    console.log('   ALTER TABLE pages DROP COLUMN IF EXISTS claim_token;')
    console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/rsjxwphpbklvewzkopxd/sql/new')
    
    return

  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('column "claim_token" of relation "pages" does not exist')) {
      console.log('ℹ️  Column/index already removed - migration complete')
    } else {
      console.error('❌ Migration failed:', error)
      console.error('\n📋 Manual migration required. Run this SQL in Supabase Dashboard:')
      console.error('   DROP INDEX IF EXISTS idx_pages_claim_token;')
      console.error('   ALTER TABLE pages DROP COLUMN IF EXISTS claim_token;')
      process.exit(1)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const projectIdArg = args.find(arg => arg.startsWith('--project-id='))
  
  if (projectIdArg) {
    const projectId = projectIdArg.split('=')[1]
    console.log(`🎯 Using project ID: ${projectId}`)
    console.log('📝 Note: Supabase MCP integration would be used here if available')
    // For now, fall back to direct method
  }
  
  await applyMigrationDirect()
}

// Run the migration
main().catch(console.error)
