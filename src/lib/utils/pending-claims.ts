/**
 * Utility for managing pending page claims in localStorage
 * Used to track anonymous pages that need to be associated with users after authentication
 */

export interface PendingClaim {
  pageId: string
  claimToken: string
  createdAt: string
}

const STORAGE_KEY = 'pendingPageClaims'

/**
 * Add a pending claim to localStorage
 */
export function addPendingClaim(pageId: string, claimToken: string): void {
  try {
    const existingClaims = getPendingClaims()
    
    // Check if claim already exists to avoid duplicates
    const existingClaim = existingClaims.find(claim => claim.pageId === pageId)
    if (existingClaim) {
      return
    }
    
    const newClaim: PendingClaim = {
      pageId,
      claimToken,
      createdAt: new Date().toISOString()
    }
    
    const updatedClaims = [...existingClaims, newClaim]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClaims))
  } catch (error) {
    console.error('Failed to add pending claim:', error)
  }
}

/**
 * Get all pending claims from localStorage
 */
export function getPendingClaims(): PendingClaim[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const claims = JSON.parse(stored) as PendingClaim[]
    
    // Filter out old claims (older than 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const validClaims = claims.filter(claim => claim.createdAt > cutoff)
    
    // Update localStorage with only valid claims
    if (validClaims.length !== claims.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validClaims))
    }
    
    return validClaims
  } catch (error) {
    console.error('Failed to get pending claims:', error)
    return []
  }
}

/**
 * Clear all pending claims from localStorage
 */
export function clearPendingClaims(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear pending claims:', error)
  }
}

/**
 * Remove a specific pending claim
 */
export function removePendingClaim(pageId: string): void {
  try {
    const existingClaims = getPendingClaims()
    const updatedClaims = existingClaims.filter(claim => claim.pageId !== pageId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClaims))
  } catch (error) {
    console.error('Failed to remove pending claim:', error)
  }
}

/**
 * Get the count of pending claims
 */
export function getPendingClaimCount(): number {
  return getPendingClaims().length
}
