/**
 * Security utilities for sanitizing user inputs to prevent prompt injection attacks
 */

/**
 * Sanitize scene description to prevent prompt injection
 * Removes common injection patterns while preserving creative content
 */
export function sanitizeSceneDescription(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Trim and normalize whitespace
  let sanitized = input.trim().replace(/\s+/g, ' ')
  
  // Remove excessive line breaks that could break prompt structure
  sanitized = sanitized.replace(/\n\n+/g, '\n')
  
  // Remove potential system prompt injection patterns
  const injectionPatterns = [
    // Direct instruction attempts
    /\b(ignore|forget|disregard|override)\s+(previous|above|earlier|all)\s+(instructions?|prompts?|rules?|commands?)/gi,
    
    // Role manipulation attempts  
    /\b(you\s+are\s+now|act\s+as|pretend\s+to\s+be|role\s*[-:]?\s*play)\b/gi,
    
    // System instruction attempts
    /\b(system\s*[:]\s*|human\s*[:]\s*|assistant\s*[:]\s*)/gi,
    
    // Prompt delimiter attempts
    /["""'''`]{3,}/g,
    
    // XML/HTML-like instruction tags
    /<\s*\/?\s*(system|instruction|prompt|rule|override|ignore)\s*>/gi,
    
    // Common jailbreak phrases
    /\b(jailbreak|bypass|circumvent|workaround)\b/gi,
    
    // Developer mode attempts
    /\b(developer\s+mode|debug\s+mode|admin\s+mode)\b/gi
  ]
  
  // Apply pattern removal
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  // Remove excessive special characters that could disrupt parsing
  sanitized = sanitized.replace(/[{}[\]()]{3,}/g, '')
  
  // Limit length to prevent overwhelming the prompt
  const MAX_LENGTH = 500
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH).trim()
  }
  
  // Ensure it ends cleanly (no incomplete sentences)
  if (sanitized.length === MAX_LENGTH) {
    const lastPeriod = sanitized.lastIndexOf('.')
    const lastSpace = sanitized.lastIndexOf(' ')
    const cutoff = Math.max(lastPeriod + 1, lastSpace)
    if (cutoff > MAX_LENGTH - 50) { // Only trim if we're not cutting too much
      sanitized = sanitized.substring(0, cutoff).trim()
    }
  }
  
  return sanitized.trim()
}

/**
 * Validate that the scene description is safe and appropriate
 */
export function validateSceneDescription(input: string): { isValid: boolean; reason?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, reason: 'Scene description is required' }
  }
  
  const trimmed = input.trim()
  
  if (trimmed.length < 3) {
    return { isValid: false, reason: 'Scene description is too short' }
  }
  
  if (trimmed.length > 500) {
    return { isValid: false, reason: 'Scene description is too long (max 500 characters)' }
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    // Violence/harmful content
    /\b(kill|murder|violence|blood|gore|death|suicide|self[-\s]?harm)\b/gi,
    
    // Adult content
    /\b(sex|sexual|nude|naked|porn|adult|explicit)\b/gi,
    
    // Inappropriate content for children
    /\b(drug|alcohol|weapon|gun|knife|bomb)\b/gi
  ]
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, reason: 'Scene description contains inappropriate content' }
    }
  }
  
  return { isValid: true }
}

/**
 * Create a safe, sanitized version of the scene description for logging
 */
export function createLogSafeDescription(input: string): string {
  const sanitized = sanitizeSceneDescription(input)
  
  // Further truncate for logs to prevent log injection
  const LOG_MAX_LENGTH = 100
  if (sanitized.length > LOG_MAX_LENGTH) {
    return sanitized.substring(0, LOG_MAX_LENGTH - 3) + '...'
  }
  
  return sanitized
}
