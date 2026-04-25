/**
 * Browser-safe session cookie reader.
 * Uses atob() instead of Buffer (Buffer is Node-only, not available in browsers).
 */
export interface SessionPayload {
  uid:        string
  role:       'superadmin' | 'headteacher' | 'teacher'
  schoolId?:  string
  schoolName?: string
  schoolCode?: string
  name?:      string
}

export function readSession(): SessionPayload | null {
  if (typeof document === 'undefined') return null
  try {
    const cookie = document.cookie
      .split('; ')
      .find(r => r.startsWith('ef-session='))
      ?.split('=')[1]
    if (!cookie) return null
    const json = atob(cookie)
    return JSON.parse(json) as SessionPayload
  } catch {
    return null
  }
}

export function writeSession(payload: SessionPayload): void {
  const encoded = btoa(JSON.stringify(payload))
  document.cookie = `ef-session=${encoded}; path=/; SameSite=Strict`
}

export function clearSession(): void {
  document.cookie = 'ef-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}
