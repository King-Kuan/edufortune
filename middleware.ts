import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login', '/verify', '/change-password']

// Routes only for superadmin
const SUPERADMIN_ROUTES = ['/superadmin']

// Routes only for headteacher
const HEADTEACHER_ROUTES = ['/headteacher']

// Edge-safe base64 decode (no atob/Buffer dependency)
function decodeSession(value: string): { role: string } | null {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Read session cookie
  const session = request.cookies.get('ef-session')?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = decodeSession(session)

  if (!payload) {
    // Corrupted cookie — clear and redirect
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('ef-session')
    return response
  }

  const { role } = payload

  // Superadmin-only routes
  if (SUPERADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'superadmin') {
    return NextResponse.redirect(new URL('/headteacher', request.url))
  }

  // Headteacher-only routes
  if (HEADTEACHER_ROUTES.some(r => pathname.startsWith(r)) && role !== 'headteacher') {
    return NextResponse.redirect(new URL('/superadmin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (png, jpg, svg, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|api/).*)',
  ],
}
