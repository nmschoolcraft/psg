import { NextResponse, type NextRequest } from 'next/server'

/**
 * Lightweight middleware — no @supabase/ssr import.
 * Session validation is handled per-page in Server Components.
 * Middleware only handles Supabase auth token refresh cookie passthrough.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
