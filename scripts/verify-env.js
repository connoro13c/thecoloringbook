#!/usr/bin/env node

/**
 * Production Environment Variable Verification Script
 * Ensures all required environment variables are properly configured
 */

const requiredEnvVars = {
  // Clerk Authentication
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'Clerk publishable key for client-side auth',
  'CLERK_SECRET_KEY': 'Clerk secret key for server-side auth',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL': 'Clerk sign-in URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL': 'Clerk sign-up URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL': 'Redirect URL after sign-in',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL': 'Redirect URL after sign-up',

  // Database
  'SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_ANON_KEY': 'Supabase anonymous key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',

  // Redis/Queue
  'REDIS_URL': 'Redis connection URL for queue management',

  // File Storage
  'BLOB_READ_WRITE_TOKEN': 'Vercel Blob storage token',
  'AWS_ACCESS_KEY_ID': 'AWS access key for S3',
  'AWS_SECRET_ACCESS_KEY': 'AWS secret key for S3',
  'AWS_REGION': 'AWS region for S3 bucket',
  'S3_BUCKET_NAME': 'S3 bucket name for file storage',

  // Payments
  'STRIPE_SECRET_KEY': 'Stripe secret key',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Stripe publishable key',
  'STRIPE_WEBHOOK_SECRET': 'Stripe webhook signing secret',

  // AI/Image Processing
  'SOURCEGRAPH_AMP_API_KEY': 'Sourcegraph Amp API key',
  'SOURCEGRAPH_AMP_ENDPOINT': 'Sourcegraph Amp API endpoint',

  // Application
  'NEXTAUTH_SECRET': 'NextAuth.js secret for JWT signing',
  'NEXTAUTH_URL': 'Application base URL',
  'NODE_ENV': 'Environment (production/development)',

  // Monitoring
  'GRAFANA_CLOUD_API_KEY': 'Grafana Cloud API key for monitoring',
  'SENTRY_DSN': 'Sentry DSN for error tracking'
}

const optionalEnvVars = {
  'VERCEL_URL': 'Automatically set by Vercel',
  'VERCEL_ENV': 'Automatically set by Vercel',
  'VERCEL_GIT_COMMIT_SHA': 'Automatically set by Vercel',
  'VERCEL_REGION': 'Automatically set by Vercel'
}

function checkEnvironmentVariables() {
  console.log('🔍 Verifying production environment variables...\n')
  
  let missingRequired = []
  let missingOptional = []
  let present = []

  // Check required variables
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (process.env[key]) {
      present.push({ key, description, value: maskValue(process.env[key]) })
    } else {
      missingRequired.push({ key, description })
    }
  }

  // Check optional variables
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (process.env[key]) {
      present.push({ key, description, value: maskValue(process.env[key]) })
    } else {
      missingOptional.push({ key, description })
    }
  }

  // Report results
  console.log('✅ Present environment variables:')
  present.forEach(({ key, description, value }) => {
    console.log(`   ${key}: ${value} (${description})`)
  })

  if (missingOptional.length > 0) {
    console.log('\n⚠️  Optional missing environment variables:')
    missingOptional.forEach(({ key, description }) => {
      console.log(`   ${key}: ${description}`)
    })
  }

  if (missingRequired.length > 0) {
    console.log('\n❌ Missing required environment variables:')
    missingRequired.forEach(({ key, description }) => {
      console.log(`   ${key}: ${description}`)
    })
    
    console.log('\n💡 To fix this:')
    console.log('   1. Add missing variables to your .env.local file')
    console.log('   2. Add them to your Vercel project environment variables')
    console.log('   3. Ensure they are available in your production environment')
    
    process.exit(1)
  }

  console.log('\n🎉 All required environment variables are present!')
  
  // Additional checks
  performAdditionalChecks()
}

function maskValue(value) {
  if (!value) return 'undefined'
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '***' + value.substring(value.length - 4)
}

function performAdditionalChecks() {
  console.log('\n🔧 Performing additional checks...')
  
  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    console.log(`⚠️  NODE_ENV is "${process.env.NODE_ENV}", expected "production"`)
  }
  
  // Check URL formats
  const urlChecks = [
    { key: 'SUPABASE_URL', pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/ },
    { key: 'NEXTAUTH_URL', pattern: /^https:\/\// },
    { key: 'REDIS_URL', pattern: /^redis(s)?:\/\// }
  ]
  
  urlChecks.forEach(({ key, pattern }) => {
    const value = process.env[key]
    if (value && !pattern.test(value)) {
      console.log(`⚠️  ${key} format may be incorrect: ${maskValue(value)}`)
    }
  })
  
  // Check key lengths (basic validation)
  const keyLengthChecks = [
    { key: 'CLERK_SECRET_KEY', minLength: 40 },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', minLength: 100 },
    { key: 'STRIPE_SECRET_KEY', minLength: 40 },
    { key: 'NEXTAUTH_SECRET', minLength: 32 }
  ]
  
  keyLengthChecks.forEach(({ key, minLength }) => {
    const value = process.env[key]
    if (value && value.length < minLength) {
      console.log(`⚠️  ${key} seems too short (${value.length} chars, expected >${minLength})`)
    }
  })
  
  console.log('✅ Additional checks completed')
}

// Run the checks
if (require.main === module) {
  checkEnvironmentVariables()
}

module.exports = { checkEnvironmentVariables }