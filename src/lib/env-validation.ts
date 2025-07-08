/**
 * Runtime environment variable validation utilities
 * 
 * These functions ensure environment variables are only accessed at runtime,
 * preventing Next.js build-time failures.
 */

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

/**
 * Get a required environment variable at runtime
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new EnvValidationError(`${name} environment variable is required`)
  }
  return value
}

/**
 * Get an optional environment variable with default
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue
}

/**
 * Validate multiple required environment variables
 */
export function validateRequiredEnvs(names: string[]): void {
  const missing = names.filter(name => !process.env[name])
  if (missing.length > 0) {
    throw new EnvValidationError(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
