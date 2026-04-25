/**
 * Generate a secure verification token for QR codes
 * Uses Web Crypto API — works in browser, edge runtime, and Node.js
 * Format: 32 hex characters, URL-safe
 */
export function generateVerificationToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Build the full QR verification URL
 */
export function buildVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://admin.edufortune.com'
  return `${baseUrl}/verify/${token}`
}
