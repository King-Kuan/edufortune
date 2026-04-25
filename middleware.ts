import { NextResponse, type NextRequest } from 'next/server'

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login', '/verify']

// Routes only for superadmin
const SUPERADMIN_ROUTES = ['/superadmin']

// Routes only for headteacher
const HEADTEACHER_ROUTES = ['/headteacher']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Read session cookie set after Firebase login
  const session = request.cookies.get('ef-session')?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Session cookie contains: { role, schoolId, uid } as base64 JSON
    const payload = JSON.parse(atob(session))
    const { role } = payload

    // Role-based route protection
    if (SUPERADMIN_ROUTES.some(r => pathname.startsWith(r)) && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/headteacher', request.url))
    }

    if (HEADTEACHER_ROUTES.some(r => pathname.startsWith(r)) && role !== 'headteacher') {
      return NextResponse.redirect(new URL('/superadmin', request.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid session cookie — clear it and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('ef-session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
}
