import { randomBytes } from 'crypto'

/**
 * Generate a secure verification token for QR codes
 * Format: 32 hex characters, URL-safe
 */
export function generateVerificationToken(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Build the full QR verification URL
 */
export function buildVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://admin.edufortune.com'
  return `${baseUrl}/verify/${token}`
}
