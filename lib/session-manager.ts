/**
 * Session management for tracking anonymous and authenticated users
 * Handles session ID generation, storage, and retrieval
 */

import { createClient } from './auth-server';
import { getAuthenticatedUser } from './auth-utils';

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
}

/**
 * Generate a new session ID for anonymous users
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create a session for the current user
 * Returns existing session ID from cookie/header or creates new one
 */
export async function getOrCreateSession(
  request: Request
): Promise<SessionInfo> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { user } = await getAuthenticatedUser();
  
  if (user) {
    // For authenticated users, use their user ID as session identifier
    return {
      sessionId: user.id,
      userId: user.id,
      isAuthenticated: true
    };
  }

  // For anonymous users, check for existing session ID in headers/cookies
  const existingSessionId = getSessionIdFromRequest(request);
  
  if (existingSessionId) {
    // Verify session exists in database and extend expiry
    const { data: session } = await supabase
      .from('upload_sessions')
      .select('session_id')
      .eq('session_id', existingSessionId)
      .eq('user_id', null) // Anonymous only
      .single();

    if (session) {
      // Extend session expiry
      await supabase.rpc('extend_session_expiry', { 
        session_uuid: existingSessionId 
      });
      
      return {
        sessionId: existingSessionId,
        isAuthenticated: false
      };
    }
  }

  // Create new anonymous session
  const newSessionId = generateSessionId();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const { error } = await supabase
    .from('upload_sessions')
    .insert({
      session_id: newSessionId,
      user_id: null, // Anonymous
      client_ip: clientIp,
      user_agent: userAgent
    });

  if (error) {
    console.error('Failed to create anonymous session:', error);
    throw new Error('Failed to create session');
  }

  return {
    sessionId: newSessionId,
    isAuthenticated: false
  };
}

/**
 * Store upload session data in database
 */
export async function createUploadSession(
  sessionInfo: SessionInfo,
  clientIp?: string,
  userAgent?: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('upload_sessions')
    .insert({
      session_id: sessionInfo.sessionId,
      user_id: sessionInfo.userId || null,
      client_ip: clientIp,
      user_agent: userAgent
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create upload session:', error);
    throw new Error('Failed to create upload session');
  }

  return data.id;
}

/**
 * Store image upload data
 */
export async function recordImageUpload(
  uploadSessionId: string,
  imageData: {
    originalFilename?: string;
    fileSizeBytes: number;
    mimeType: string;
    storagePath: string;
    storageBucket: string;
    uploadOrder?: number;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('image_uploads')
    .insert({
      upload_session_id: uploadSessionId,
      original_filename: imageData.originalFilename,
      file_size_bytes: imageData.fileSizeBytes,
      mime_type: imageData.mimeType,
      storage_path: imageData.storagePath,
      storage_bucket: imageData.storageBucket,
      upload_order: imageData.uploadOrder || 1
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to record image upload:', error);
    throw new Error('Failed to record image upload');
  }

  return data.id;
}

/**
 * Store image analysis results
 */
export async function recordImageAnalysis(
  imageUploadId: string,
  analysisData: {
    analysisPrompt: string;
    rawResponse: string;
    parsedAnalysis: Record<string, unknown>;
    modelUsed?: string;
    tokensUsed?: number;
    processingTimeMs?: number;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('image_analyses')
    .insert({
      image_upload_id: imageUploadId,
      analysis_prompt: analysisData.analysisPrompt,
      raw_response: analysisData.rawResponse,
      parsed_analysis: analysisData.parsedAnalysis,
      model_used: analysisData.modelUsed || 'gpt-4o-mini',
      tokens_used: analysisData.tokensUsed,
      processing_time_ms: analysisData.processingTimeMs
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to record image analysis:', error);
    throw new Error('Failed to record image analysis');
  }

  return data.id;
}

/**
 * Store page generation results
 */
export async function recordPageGeneration(
  uploadSessionId: string,
  generationData: {
    userPrompt?: string;
    style: string;
    difficulty: number;
    generatedPrompt: string;
    dalleResponseUrl?: string;
    storagePath?: string;
    modelUsed?: string;
    processingTimeMs?: number;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('page_generations')
    .insert({
      upload_session_id: uploadSessionId,
      user_prompt: generationData.userPrompt,
      style: generationData.style,
      difficulty: generationData.difficulty,
      generated_prompt: generationData.generatedPrompt,
      dalle_response_url: generationData.dalleResponseUrl,
      storage_path: generationData.storagePath,
      model_used: generationData.modelUsed || 'dall-e-3',
      processing_time_ms: generationData.processingTimeMs
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to record page generation:', error);
    throw new Error('Failed to record page generation');
  }

  return data.id;
}

/**
 * Store PDF export data
 */
export async function recordPdfExport(
  pageGenerationId: string,
  userId: string,
  exportData: {
    stripePaymentIntentId?: string;
    pdfStoragePath: string;
    exportSettings?: Record<string, unknown>;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pdf_exports')
    .insert({
      page_generation_id: pageGenerationId,
      user_id: userId,
      stripe_payment_intent_id: exportData.stripePaymentIntentId,
      pdf_storage_path: exportData.pdfStoragePath,
      export_settings: exportData.exportSettings
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to record PDF export:', error);
    throw new Error('Failed to record PDF export');
  }

  return data.id;
}

/**
 * Helper functions
 */

function getSessionIdFromRequest(request: Request): string | null {
  // Check X-Session-ID header first
  const headerSessionId = request.headers.get('X-Session-ID');
  if (headerSessionId) {
    return headerSessionId;
  }

  // Check cookies as fallback
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const sessionCookie = cookieHeader
      .split(';')
      .find(cookie => cookie.trim().startsWith('session-id='));
    
    if (sessionCookie) {
      return sessionCookie.split('=')[1].trim();
    }
  }

  return null;
}

function getClientIp(request: Request): string | null {
  // Check various headers for client IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Get user's session history (for analytics/debugging)
 */
export async function getUserSessionHistory(
  userId: string,
  limit = 50
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('upload_sessions')
    .select(`
      *,
      image_uploads (
        *,
        image_analyses (*)
      ),
      page_generations (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to get user session history:', error);
    return [];
  }

  return data || [];
}

/**
 * Cleanup expired anonymous sessions (called by cron job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('cleanup_expired_anonymous_data');

  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return 0;
  }

  return data || 0;
}