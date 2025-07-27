#!/usr/bin/env npx tsx
/**
 * Test observability integration by creating sample log entries
 * Usage: npx tsx scripts/test-observability.ts
 */

import { ProgressiveLogger } from '../src/lib/ai/progressive-logger'

async function testObservability() {
  console.log('🧪 Testing ProgressiveLogger observability integration...')
  
  // Enable observability logging for this test
  process.env.ENABLE_OBSERVABILITY_LOGGING = 'true'
  
  // Create a test logger with a fake user ID (valid UUID format)
  const logger = new ProgressiveLogger('12345678-1234-5678-9012-123456789012')
  
  // Simulate a successful generation
  console.log('\n1. Testing successful generation logging...')
  logger.startJob({
    style: 'Classic Cartoon',
    difficulty: 3,
    scene: 'A child riding a magical unicorn through rainbow clouds',
    photoSize: 156789
  })
  
  // Simulate some progress
  logger.updateVisionProgress('Analyzing photo', 'Extracting visual features')
  logger.updateVisionProgress('Building DALLE prompt')
  logger.updateImageProgress('Creating coloring page')
  logger.updateStorageProgress('Uploading to storage')
  logger.updateStorageProgress('Saving to database')
  
  // Add some context data
  logger.context = {
    ...logger.context,
    analysis: {
      age: '8-12 years',
      appearance: 'blonde hair, blue eyes',
      pose: 'standing, arms outstretched',
      perspective: 'three-quarter view',
      elements: ['child', 'unicorn', 'clouds', 'rainbow'],
      complexity: 'medium',
      usingFallback: false
    },
    costs: {
      vision: 0.0025,
      image: 0.080,
      total: 0.0825
    },
    tokens: {
      vision: { input: 1250, output: 325 },
      image: { input: 78, output: 0 }
    },
    promptSample: 'A child with blonde hair and blue eyes riding a magical unicorn...',
    fileName: 'coloring-test-123.jpg',
    recordId: 'page-uuid-12345'
  }
  
  // Complete the job (this should trigger observability)
  logger.completeJob()
  
  console.log('\n2. Testing error logging...')
  
  // Test error logging
  const errorLogger = new ProgressiveLogger('87654321-4321-8765-2109-987654321098')
  errorLogger.startJob({
    style: 'Ghibli Style',
    difficulty: 5,
    scene: 'A complex magical forest scene',
    photoSize: 245000
  })
  
  // Simulate an error
  const testError = new Error('OpenAI API rate limit exceeded')
  errorLogger.logError('Generation failed due to API limits', testError)
  
  console.log('\n✅ Observability test completed!')
  console.log('📊 Check your Supabase generation_logs table for new entries')
  console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard/project/rsjxwphpbklvewzkopxd/editor/generation_logs')
}

testObservability().catch(console.error)
