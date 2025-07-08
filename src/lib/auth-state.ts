import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.AUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_STATE_SECRET or NEXTAUTH_SECRET environment variable is required')
  }
  return secret
}

export interface AuthState {
  pageId?: string
  exp: number // expiration timestamp
}

/**
 * Sign and encode auth state for secure transmission through OAuth flow
 */
export function encodeAuthState(state: AuthState): string {
  const payload = JSON.stringify(state)
  const b64 = Buffer.from(payload).toString('base64url')
  const signature = createHmac('sha256', getSecret()).update(b64).digest('base64url')
  return `${b64}.${signature}`
}

/**
 * Decode and verify auth state from OAuth callback
 */
export function decodeAuthState(token: string): AuthState {
  try {
    const [b64, signature] = token.split('.')
    if (!b64 || !signature) {
      throw new Error('Invalid token format')
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', getSecret()).update(b64).digest('base64url')
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature')
    }

    // Decode payload
    const payload = Buffer.from(b64, 'base64url').toString()
    const state: AuthState = JSON.parse(payload)

    // Check expiration (10 minutes max)
    if (Date.now() > state.exp) {
      throw new Error('Token expired')
    }

    return state
  } catch (error) {
    throw new Error(`Invalid auth state: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create auth state with 10-minute expiration
 */
export function createAuthState(pageId?: string): string {
  return encodeAuthState({
    pageId,
    exp: Date.now() + (10 * 60 * 1000) // 10 minutes
  })
}
